import "dotenv/config";

type ScriptOptions = {
  help: boolean;
  apply: boolean;
};

const JOB_NAME = "recompute-attempt-xp";

let closeDatabase: (() => Promise<void>) | null = null;

async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const [
    { and, eq, gt, sql },
    dbClient,
    schema,
    { calculateAttemptXp },
    { getLevelForXp },
    { getPermanentXpBonusPercent },
    { badgeCodeToId },
  ] = await Promise.all([
    import("drizzle-orm"),
    import("../db/client"),
    import("../db/schema"),
    import("../../features/tryout-attempt/attempt-xp"),
    import("../../features/engagement-surface/level-catalog"),
    import("../../features/engagement-surface/badge-catalog"),
    import("../../features/engagement-surface/engagement-surface-model"),
  ]);
  const { db } = dbClient;
  const { attempts, studentBadges, studentExpLedger } = schema;

  closeDatabase = dbClient.closeDb;

  // Attempts stored with 0 XP stay at 0: they are extra practice, impersonated, or blank
  // submissions, and extra practice is not stored anywhere else we could recheck.
  const rows = await db
    .select({
      id: attempts.id,
      studentUserId: attempts.studentUserId,
      attemptNumber: attempts.attemptNumber,
      correctCount: attempts.correctCount,
      submittedAt: attempts.submittedAt,
      xpEarned: attempts.xpEarned,
    })
    .from(attempts)
    .where(and(
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      gt(attempts.xpEarned, 0),
      eq(attempts.isImpersonatedSubmission, false),
    ));
  const badgeRewardRows = await db
    .select({
      studentUserId: studentExpLedger.studentUserId,
      xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
    })
    .from(studentExpLedger)
    .where(eq(studentExpLedger.sourceType, "badge_reward"))
    .groupBy(studentExpLedger.studentUserId);
  const badgeXpByStudent = new Map(badgeRewardRows.map((row) => [row.studentUserId, Number(row.xp)]));
  const badgeRows = await db
    .select({
      studentUserId: studentBadges.studentUserId,
      badgeCode: studentBadges.badgeCode,
      awardedAt: studentBadges.awardedAt,
    })
    .from(studentBadges);
  const badgesByStudent = Map.groupBy(badgeRows, (row) => row.studentUserId);

  // Same rule as submit: only level badges awarded before the attempt was submitted count.
  const getBonusPercentAt = (studentUserId: string, submittedAt: Date | null) => {
    if (!submittedAt) return 0;

    const earlierBadgeIds = (badgesByStudent.get(studentUserId) ?? [])
      .filter((badge) => badge.awardedAt < submittedAt)
      .map((badge) => badgeCodeToId(badge.badgeCode))
      .filter((badgeId): badgeId is number => badgeId !== null);

    return getPermanentXpBonusPercent(earlierBadgeIds);
  };

  const changes = rows
    .map((row) => ({
      ...row,
      nextXp: calculateAttemptXp({
        correctCount: row.correctCount ?? 0,
        attemptNumber: row.attemptNumber,
        isExtraPractice: false,
        xpBonusPercent: getBonusPercentAt(row.studentUserId, row.submittedAt),
      }),
    }))
    .filter((row) => row.nextXp !== row.xpEarned);

  const nextXpByAttemptId = new Map(changes.map((change) => [change.id, change.nextXp]));
  const students = new Map<string, { beforeXp: number; afterXp: number }>();

  for (const row of rows) {
    const badgeXp = badgeXpByStudent.get(row.studentUserId) ?? 0;
    const student = students.get(row.studentUserId) ?? { beforeXp: badgeXp, afterXp: badgeXp };

    student.beforeXp += row.xpEarned;
    student.afterXp += nextXpByAttemptId.get(row.id) ?? row.xpEarned;
    students.set(row.studentUserId, student);
  }

  const studentSamples = [...students.entries()]
    .sort(([, a], [, b]) => b.beforeXp - a.beforeXp)
    .slice(0, 10)
    .map(([studentUserId, xp]) => ({
      studentUserId,
      beforeXp: xp.beforeXp,
      afterXp: xp.afterXp,
      afterLevel: getLevelForXp(xp.afterXp).level,
    }));

  if (options.apply && changes.length > 0) {
    await db.transaction(async (tx) => {
      for (const change of changes) {
        await tx
          .update(attempts)
          .set({ xpEarned: change.nextXp, updatedAt: new Date() })
          .where(eq(attempts.id, change.id));
      }
    });
  }

  console.log(JSON.stringify({
    job: JOB_NAME,
    ok: true,
    mode: options.apply ? "apply" : "dry-run",
    attemptsChecked: rows.length,
    attemptsChanged: changes.length,
    studentsAffected: new Set(changes.map((change) => change.studentUserId)).size,
    attemptXpBefore: changes.reduce((total, change) => total + change.xpEarned, 0),
    attemptXpAfter: changes.reduce((total, change) => total + change.nextXp, 0),
    topStudentsByPreviousXp: studentSamples,
  }, null, 2));
}

function parseOptions(args: string[]): ScriptOptions {
  const options: ScriptOptions = {
    help: false,
    apply: false,
  };

  for (const arg of args) {
    if (arg === "--") continue;

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Recalculates attempts.xp_earned with the current XP formula (4 XP per correct answer, 25% on retakes,
plus the permanent level badge bonus for badges awarded before each attempt).
Badges and badge reward XP are kept. Finalised weekly leaderboard snapshots are not changed.

Usage:
  pnpm run jobs:recompute-attempt-xp            # dry run, prints what would change
  pnpm run jobs:recompute-attempt-xp -- --apply # writes the new values`);
}

main()
  .catch((error) => {
    console.error(JSON.stringify({
      job: JOB_NAME,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }));

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase?.();
  });

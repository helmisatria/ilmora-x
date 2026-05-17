import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  adminMembers,
  attempts,
  studentBadges,
  studentExpLedger,
  studentProfiles,
  user,
  weeklyLeaderboardEntries,
  weeklyLeaderboardSnapshots,
} from "../db/schema";

const DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD = 10;

const TOP_N_BADGES = [
  { badgeCode: "BADGE-016", maxRank: 1, rewardXp: 1000 },
  { badgeCode: "BADGE-015", maxRank: 3, rewardXp: 750 },
  { badgeCode: "BADGE-014", maxRank: 5, rewardXp: 500 },
  { badgeCode: "BADGE-013", maxRank: 10, rewardXp: 200 },
] as const;

type RankedStudent = {
  studentUserId: string;
  xp: number;
  lastXpAttemptSubmittedAt: Date;
};

export function getWeeklyParticipantThreshold() {
  const configuredThreshold = Number(process.env.WEEKLY_LEADERBOARD_PARTICIPANT_THRESHOLD);

  if (!Number.isInteger(configuredThreshold)) return DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD;
  if (configuredThreshold < 1) return DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD;

  return configuredThreshold;
}

export function getJakartaWeekStartDateKey(date = new Date()) {
  const jakartaDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const day = jakartaDate.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  jakartaDate.setUTCDate(jakartaDate.getUTCDate() - daysSinceMonday);

  return formatUtcDateKey(jakartaDate);
}

export function getPreviousJakartaWeekStartDateKey(date = new Date()) {
  const currentWeekStart = dateKeyToJakartaStart(getJakartaWeekStartDateKey(date));
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 7);

  return formatJakartaDateKey(currentWeekStart);
}

export function getJakartaWeekWindow(weekStartDate: string) {
  const startsAt = dateKeyToJakartaStart(weekStartDate);
  const endsAt = new Date(startsAt);

  endsAt.setUTCDate(endsAt.getUTCDate() + 7);

  return { startsAt, endsAt };
}

export async function finalisePreviousWeeklyLeaderboard() {
  return finaliseWeeklyLeaderboard(getPreviousJakartaWeekStartDateKey());
}

export async function finaliseWeeklyLeaderboard(weekStartDate: string) {
  const existingSnapshot = await getWeeklyLeaderboardSnapshot(weekStartDate);

  if (existingSnapshot) {
    return awardTopNBadgesFromSnapshot(existingSnapshot.id, weekStartDate);
  }

  const threshold = getWeeklyParticipantThreshold();
  const rankedStudents = await listRankedStudentsForWeek(weekStartDate);
  const snapshot = await createWeeklyLeaderboardSnapshot({
    weekStartDate,
    rankedStudents,
    participantThreshold: threshold,
  });

  return awardTopNBadgesFromSnapshot(snapshot.id, weekStartDate);
}

async function getWeeklyLeaderboardSnapshot(weekStartDate: string) {
  const [snapshot] = await db
    .select({ id: weeklyLeaderboardSnapshots.id })
    .from(weeklyLeaderboardSnapshots)
    .where(eq(weeklyLeaderboardSnapshots.weekStartDate, weekStartDate))
    .limit(1);

  return snapshot ?? null;
}

async function listRankedStudentsForWeek(weekStartDate: string): Promise<RankedStudent[]> {
  const { startsAt, endsAt } = getJakartaWeekWindow(weekStartDate);

  const rows = await db
    .select({
      studentUserId: attempts.studentUserId,
      xp: sql<number>`sum(${attempts.xpEarned})`,
      lastXpAttemptSubmittedAt: sql<Date>`max(${attempts.submittedAt})`,
    })
    .from(attempts)
    .innerJoin(user, eq(user.id, attempts.studentUserId))
    .innerJoin(studentProfiles, eq(studentProfiles.userId, user.id))
    .where(and(
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      gte(attempts.submittedAt, startsAt),
      lt(attempts.submittedAt, endsAt),
      sql`${attempts.xpEarned} > 0`,
      eq(attempts.isImpersonatedSubmission, false),
      eq(studentProfiles.status, "active"),
      sql`not exists (
        select 1
        from ${adminMembers}
        where ${adminMembers.email} = ${user.email}
          and ${adminMembers.removedAt} is null
      )`,
    ))
    .groupBy(attempts.studentUserId)
    .orderBy(
      desc(sql`sum(${attempts.xpEarned})`),
      asc(sql`max(${attempts.submittedAt})`),
      asc(attempts.studentUserId),
    );

  return rows.map((row) => ({
    studentUserId: row.studentUserId,
    xp: Number(row.xp),
    lastXpAttemptSubmittedAt: row.lastXpAttemptSubmittedAt,
  }));
}

async function createWeeklyLeaderboardSnapshot({
  weekStartDate,
  rankedStudents,
  participantThreshold,
}: {
  weekStartDate: string;
  rankedStudents: RankedStudent[];
  participantThreshold: number;
}) {
  return db.transaction(async (tx) => {
    const [snapshot] = await tx
      .insert(weeklyLeaderboardSnapshots)
      .values({
        weekStartDate,
        participantThreshold,
        rankedStudentCount: rankedStudents.length,
        thresholdMet: rankedStudents.length >= participantThreshold,
      })
      .onConflictDoNothing({ target: weeklyLeaderboardSnapshots.weekStartDate })
      .returning({ id: weeklyLeaderboardSnapshots.id });

    if (!snapshot) {
      const [existingSnapshot] = await tx
        .select({ id: weeklyLeaderboardSnapshots.id })
        .from(weeklyLeaderboardSnapshots)
        .where(eq(weeklyLeaderboardSnapshots.weekStartDate, weekStartDate))
        .limit(1);

      if (!existingSnapshot) {
        throw new Error(`Weekly leaderboard snapshot was not created for ${weekStartDate}.`);
      }

      return existingSnapshot;
    }

    if (rankedStudents.length === 0) return snapshot;

    await tx.insert(weeklyLeaderboardEntries).values(
      rankedStudents.map((student, index) => ({
        snapshotId: snapshot.id,
        weekStartDate,
        studentUserId: student.studentUserId,
        rank: index + 1,
        xp: student.xp,
        lastXpAttemptSubmittedAt: student.lastXpAttemptSubmittedAt,
      })),
    );

    return snapshot;
  });
}

async function awardTopNBadgesFromSnapshot(snapshotId: string, weekStartDate: string) {
  const [snapshot] = await db
    .select({
      thresholdMet: weeklyLeaderboardSnapshots.thresholdMet,
      rankedStudentCount: weeklyLeaderboardSnapshots.rankedStudentCount,
    })
    .from(weeklyLeaderboardSnapshots)
    .where(eq(weeklyLeaderboardSnapshots.id, snapshotId))
    .limit(1);

  if (!snapshot) {
    throw new Error(`Weekly leaderboard snapshot ${snapshotId} was not found.`);
  }

  if (!snapshot.thresholdMet) {
    return {
      weekStartDate,
      rankedStudentCount: snapshot.rankedStudentCount,
      awardedBadgeCount: 0,
    };
  }

  const entries = await db
    .select({
      id: weeklyLeaderboardEntries.id,
      studentUserId: weeklyLeaderboardEntries.studentUserId,
      rank: weeklyLeaderboardEntries.rank,
      badgesAwarded: weeklyLeaderboardEntries.badgesAwarded,
    })
    .from(weeklyLeaderboardEntries)
    .where(eq(weeklyLeaderboardEntries.snapshotId, snapshotId))
    .orderBy(asc(weeklyLeaderboardEntries.rank));

  let awardedBadgeCount = 0;

  for (const entry of entries) {
    const eligibleBadges = TOP_N_BADGES.filter((badge) => entry.rank <= badge.maxRank);
    const awardedBadgeCodes: string[] = [];

    for (const badge of eligibleBadges) {
      const awarded = await awardStudentBadge({
        studentUserId: entry.studentUserId,
        badgeCode: badge.badgeCode,
        rewardXp: badge.rewardXp,
        weekStartDate,
        rank: entry.rank,
      });

      if (!awarded) continue;

      awardedBadgeCount += 1;
      awardedBadgeCodes.push(badge.badgeCode);
    }

    if (awardedBadgeCodes.length === 0) continue;

    const existingBadges = Array.isArray(entry.badgesAwarded)
      ? entry.badgesAwarded.filter((value): value is string => typeof value === "string")
      : [];
    const badgesAwarded = Array.from(new Set([...existingBadges, ...awardedBadgeCodes]));

    await db
      .update(weeklyLeaderboardEntries)
      .set({
        badgesAwarded,
        updatedAt: new Date(),
      })
      .where(eq(weeklyLeaderboardEntries.id, entry.id));
  }

  return {
    weekStartDate,
    rankedStudentCount: snapshot.rankedStudentCount,
    awardedBadgeCount,
  };
}

async function awardStudentBadge({
  studentUserId,
  badgeCode,
  rewardXp,
  weekStartDate,
  rank,
}: {
  studentUserId: string;
  badgeCode: string;
  rewardXp: number;
  weekStartDate: string;
  rank: number;
}) {
  return db.transaction(async (tx) => {
    const [badge] = await tx
      .insert(studentBadges)
      .values({
        studentUserId,
        badgeCode,
        awardSource: "weekly_leaderboard",
        sourceWeekKey: weekStartDate,
        rewardXp,
        metadata: { rank },
      })
      .onConflictDoNothing({
        target: [studentBadges.studentUserId, studentBadges.badgeCode],
      })
      .returning({ id: studentBadges.id });

    if (!badge) return false;
    if (rewardXp <= 0) return true;

    await tx
      .insert(studentExpLedger)
      .values({
        studentUserId,
        sourceType: "badge_reward",
        sourceId: badge.id,
        xpAmount: rewardXp,
        metadata: {
          badgeCode,
          weekStartDate,
          rank,
        },
      })
      .onConflictDoNothing({
        target: [studentExpLedger.sourceType, studentExpLedger.sourceId],
      });

    return true;
  });
}

function dateKeyToJakartaStart(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

function formatJakartaDateKey(date: Date) {
  const jakartaDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return formatUtcDateKey(jakartaDate);
}

function formatUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

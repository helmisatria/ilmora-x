import { and, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  attempts,
  studentBadges,
  studentExpLedger,
} from "../../lib/db/schema";
import { badgeCodeToId, calculateCurrentStreak, getNextEligibleDailyBadge } from "./engagement-surface-model";

export { badgeCodeToId, calculateCurrentStreak };

export async function awardDailyBadges(studentUserId: string) {
  const submittedAttempts = await db
    .select({
      id: attempts.id,
      tryoutId: attempts.tryoutId,
      attemptNumber: attempts.attemptNumber,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      deadlineAt: attempts.deadlineAt,
      score: attempts.score,
      totalQuestions: attempts.totalQuestions,
      xpEarned: attempts.xpEarned,
      autoSubmitReason: attempts.autoSubmitReason,
    })
    .from(attempts)
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ));

  if (submittedAttempts.length === 0) return [];

  const [badgeRewardRow] = await db
    .select({
      xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
    })
    .from(studentExpLedger)
    .where(and(
      eq(studentExpLedger.studentUserId, studentUserId),
      eq(studentExpLedger.sourceType, "badge_reward"),
    ));
  const awardedBadgeRows = await db
    .select({ badgeCode: studentBadges.badgeCode })
    .from(studentBadges)
    .where(eq(studentBadges.studentUserId, studentUserId));

  const awardedBadgeIds = new Set(
    awardedBadgeRows
      .map((badge) => badgeCodeToId(badge.badgeCode))
      .filter((badgeId): badgeId is number => badgeId !== null),
  );
  const attemptXp = submittedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
  let totalXp = attemptXp + Number(badgeRewardRow?.xp ?? 0);
  const awardedBadges: Array<{ badgeId: number; rewardXp: number }> = [];

  for (;;) {
    const eligibleBadge = getNextEligibleDailyBadge({
      awardedBadgeIds,
      submittedAttempts,
      totalXp,
    });

    if (!eligibleBadge) return awardedBadges;

    const awardedBadge = await awardBadgeReward({
      studentUserId,
      badgeId: eligibleBadge.id,
      rewardXp: eligibleBadge.xpReward,
      metadata: {
        badgeName: eligibleBadge.name,
        awardReason: eligibleBadge.task,
      },
    });

    awardedBadgeIds.add(eligibleBadge.id);

    if (!awardedBadge) continue;

    totalXp += awardedBadge.rewardXp;
    awardedBadges.push(awardedBadge);
  }
}

function badgeIdToCode(badgeId: number) {
  return `BADGE-${String(badgeId).padStart(3, "0")}`;
}

async function awardBadgeReward({
  studentUserId,
  badgeId,
  rewardXp,
  metadata,
}: {
  studentUserId: string;
  badgeId: number;
  rewardXp: number;
  metadata: Record<string, unknown>;
}) {
  return db.transaction(async (tx) => {
    const badgeCode = badgeIdToCode(badgeId);
    const [badge] = await tx
      .insert(studentBadges)
      .values({
        studentUserId,
        badgeCode,
        awardSource: "daily_evaluation",
        rewardXp,
        metadata,
      })
      .onConflictDoNothing({
        target: [studentBadges.studentUserId, studentBadges.badgeCode],
      })
      .returning({ id: studentBadges.id });

    if (!badge) return null;
    if (rewardXp <= 0) return { badgeId, rewardXp: 0 };

    await tx
      .insert(studentExpLedger)
      .values({
        studentUserId,
        sourceType: "badge_reward",
        sourceId: badge.id,
        xpAmount: rewardXp,
        metadata: {
          badgeCode,
          ...metadata,
        },
      })
      .onConflictDoNothing({
        target: [studentExpLedger.sourceType, studentExpLedger.sourceId],
      });

    return { badgeId, rewardXp };
  });
}

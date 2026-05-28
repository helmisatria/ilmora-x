import { and, eq, sql } from "drizzle-orm";
import { badges } from "./badge-catalog";
import { getLevelForXp } from "./level-catalog";
import { db } from "../../lib/db/client";
import {
  attempts,
  studentBadges,
  studentExpLedger,
} from "../../lib/db/schema";
import { badgeCodeToId, calculateCurrentStreak } from "./engagement-surface-model";

export { badgeCodeToId, calculateCurrentStreak };

export async function awardDailyBadges(studentUserId: string) {
  const submittedAttempts = await db
    .select({
      id: attempts.id,
      tryoutId: attempts.tryoutId,
      submittedAt: attempts.submittedAt,
      deadlineAt: attempts.deadlineAt,
      score: attempts.score,
      correctCount: attempts.correctCount,
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
  const totalQuestions = submittedAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const totalCorrect = submittedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0);
  const attemptXp = submittedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
  let totalXp = attemptXp + Number(badgeRewardRow?.xp ?? 0);
  const awardedBadges: Array<{ badgeId: number; rewardXp: number }> = [];

  for (;;) {
    const eligibleBadge = getNextEligibleDailyBadge({
      awardedBadgeIds,
      submittedAttempts,
      totalQuestions,
      totalCorrect,
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

function getNextEligibleDailyBadge({
  awardedBadgeIds,
  submittedAttempts,
  totalQuestions,
  totalCorrect,
  totalXp,
}: {
  awardedBadgeIds: Set<number>;
  submittedAttempts: Array<{
    tryoutId: string;
    submittedAt: Date | null;
    deadlineAt: Date;
    score: number | null;
    totalQuestions: number;
    autoSubmitReason: string | null;
  }>;
  totalQuestions: number;
  totalCorrect: number;
  totalXp: number;
}) {
  const level = getLevelForXp(totalXp).level;
  const streak = calculateCurrentStreak(submittedAttempts.map((attempt) => attempt.submittedAt));
  const uniqueTryoutCount = new Set(submittedAttempts.map((attempt) => attempt.tryoutId)).size;
  const failedAttemptCount = submittedAttempts.filter((attempt) => (attempt.score ?? 0) < 70).length;
  const accuracy = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;
  const hasSpeedRunnerAttempt = submittedAttempts.some((attempt) => {
    if ((attempt.score ?? 0) <= 80) return false;
    if (!attempt.submittedAt) return false;
    if (attempt.autoSubmitReason) return false;

    return attempt.submittedAt <= attempt.deadlineAt;
  });
  const hasPerfectScoreAttempt = submittedAttempts.some((attempt) => (attempt.score ?? 0) >= 100);

  return badges.find((badge) => {
    if (awardedBadgeIds.has(badge.id)) return false;
    if (badge.task.toLowerCase().includes("leaderboard")) return false;

    const levelMatch = badge.task.match(/Reach Level (\d+)/i);
    const streakMatch = badge.task.match(/(\d+)[-\s]Days/i);
    const tryoutMatch = badge.task.match(/Complete (\d+) unique tryouts/i);

    if (badge.id === 1) return submittedAttempts.length > 0;
    if (levelMatch) return level >= Number(levelMatch[1]);
    if (streakMatch) return streak >= Number(streakMatch[1]);
    if (tryoutMatch) return uniqueTryoutCount >= Number(tryoutMatch[1]);
    if (badge.name === "Speed Runner") return hasSpeedRunnerAttempt;
    if (badge.name === "Fail Legend") return failedAttemptCount >= 5;
    if (badge.name === "100% Club") return hasPerfectScoreAttempt || accuracy >= 100;

    return false;
  }) ?? null;
}

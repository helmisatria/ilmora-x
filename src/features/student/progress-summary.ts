import { isFailLegendAttempt } from "../engagement-surface/engagement-surface-model";
import type { StudentEvaluation } from "../student-evaluation/student-evaluation-model";

// Free Students only get totals and top-level Category scores.
// Attempt history and Sub-category/Topic breakdowns require premium Evaluation access.
export function buildProgressSummary(evaluation: StudentEvaluation, hasPremiumEvaluation: boolean) {
  const attempts = hasPremiumEvaluation ? evaluation.attempts : [];

  return {
    hasPremiumEvaluation,
    xp: evaluation.summary.xp,
    attemptXp: evaluation.summary.attemptXp,
    badgeRewardXp: evaluation.summary.badgeRewardXp,
    streak: evaluation.summary.streak,
    totalAttempts: evaluation.summary.totalAttempts,
    // Badge progress counts are not premium-gated, so compute them before hiding Attempt history.
    uniqueTryoutCount: evaluation.summary.uniqueTryoutCount,
    failLegendAttemptCount: evaluation.attempts.filter(isFailLegendAttempt).length,
    totalQuestions: evaluation.summary.totalQuestions,
    totalCorrect: evaluation.summary.totalCorrect,
    awardedBadgeIds: evaluation.summary.awardedBadgeIds,
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      tryoutTitle: attempt.tryoutTitle,
      attemptNumber: attempt.attemptNumber,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      xpEarned: attempt.xpEarned,
    })),
    categories: evaluation.categories.map((category) => ({
      ...category,
      subCategories: hasPremiumEvaluation ? category.subCategories : [],
    })),
  };
}

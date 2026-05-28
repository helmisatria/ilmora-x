import { createServerFn } from "@tanstack/react-start";
import { getStudentEvaluation } from "../student-evaluation/student-evaluation";
import { getStudentViewer } from "./student-viewer.server";

export const listProgressSummary = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();
  const evaluation = await getStudentEvaluation(viewer.userId);

  return {
    xp: evaluation.summary.xp,
    attemptXp: evaluation.summary.attemptXp,
    badgeRewardXp: evaluation.summary.badgeRewardXp,
    streak: evaluation.summary.streak,
    totalQuestions: evaluation.summary.totalQuestions,
    totalCorrect: evaluation.summary.totalCorrect,
    awardedBadgeIds: evaluation.summary.awardedBadgeIds,
    attempts: evaluation.attempts.map((attempt) => ({
      id: attempt.id,
      tryoutTitle: attempt.tryoutTitle,
      attemptNumber: attempt.attemptNumber,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      xpEarned: attempt.xpEarned,
    })),
    categories: evaluation.categories,
  };
});

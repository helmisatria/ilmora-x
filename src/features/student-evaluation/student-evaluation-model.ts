import { badgeCodeToId, calculateCurrentStreak } from "../engagement-surface/engagement-surface-model";

export type StudentEvaluationAttempt = {
  id: string;
  tryoutTitle: string;
  attemptNumber: number;
  status: "submitted" | "auto_submitted";
  startedAt: Date;
  submittedAt: Date | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  xpEarned: number;
};

export type StudentEvaluationCategory = {
  id: string;
  name: string;
  color: string;
  total: number;
  correct: number;
  subCategories: Array<{
    id: string;
    name: string;
    total: number;
    correct: number;
    topics: Array<{
      id: string;
      name: string;
      total: number;
      correct: number;
    }>;
  }>;
};

export type StudentEvaluation = {
  summary: {
    xp: number;
    attemptXp: number;
    badgeRewardXp: number;
    streak: number;
    totalAttempts: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    accuracy: number;
    awardedBadgeIds: number[];
  };
  attempts: StudentEvaluationAttempt[];
  categories: StudentEvaluationCategory[];
};

export type StudentEvaluationAttemptRow = {
  id: string;
  tryoutTitle: string;
  attemptNumber: number;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  correctCount: number | null;
  wrongCount?: number | null;
  totalQuestions: number;
  xpEarned: number;
};

export type StudentEvaluationCategoryRow = {
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  total: number | string | null;
  correct: number | string | null;
};

export type StudentEvaluationSubCategoryRow = {
  categoryId: string;
  subCategoryId: string;
  subCategoryName: string;
  total: number | string | null;
  correct: number | string | null;
};

export type StudentEvaluationTopicRow = {
  categoryId: string;
  subCategoryId: string;
  topicId: string;
  topicName: string;
  total: number | string | null;
  correct: number | string | null;
};

export function buildStudentEvaluation({
  submittedAttempts,
  categoryRows,
  subCategoryRows,
  topicRows,
  badgeRewardXp,
  badgeCodes,
}: {
  submittedAttempts: StudentEvaluationAttemptRow[];
  categoryRows: StudentEvaluationCategoryRow[];
  subCategoryRows: StudentEvaluationSubCategoryRow[];
  topicRows: StudentEvaluationTopicRow[];
  badgeRewardXp: number;
  badgeCodes: string[];
}): StudentEvaluation {
  const topicsBySubCategoryId = groupTopicsBySubCategoryId(topicRows);
  const attempts = submittedAttempts.map(toStudentEvaluationAttempt);
  const totalQuestions = attempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const totalCorrect = attempts.reduce((total, attempt) => total + attempt.correctCount, 0);
  const attemptXp = attempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
  const xp = attemptXp + badgeRewardXp;
  const totalWrong = Math.max(totalQuestions - totalCorrect, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    summary: {
      xp,
      attemptXp,
      badgeRewardXp,
      streak: calculateCurrentStreak(attempts.map((attempt) => attempt.submittedAt)),
      totalAttempts: attempts.length,
      totalQuestions,
      totalCorrect,
      totalWrong,
      accuracy,
      awardedBadgeIds: badgeCodes
        .map((badgeCode) => badgeCodeToId(badgeCode))
        .filter((badgeId): badgeId is number => badgeId !== null),
    },
    attempts,
    categories: categoryRows.map((row) => ({
      id: row.categoryId,
      name: row.categoryName,
      color: row.categoryColor ?? "#205072",
      total: toNumber(row.total),
      correct: toNumber(row.correct),
      subCategories: subCategoryRows
        .filter((subCategory) => subCategory.categoryId === row.categoryId)
        .map((subCategory) => ({
          id: subCategory.subCategoryId,
          name: subCategory.subCategoryName,
          total: toNumber(subCategory.total),
          correct: toNumber(subCategory.correct),
          topics: topicsBySubCategoryId.get(subCategory.subCategoryId) ?? [],
        })),
    })),
  };
}

function groupTopicsBySubCategoryId(topicRows: StudentEvaluationTopicRow[]) {
  const topicsBySubCategoryId = new Map<string, StudentEvaluationCategory["subCategories"][number]["topics"]>();

  for (const topic of topicRows) {
    const topics = topicsBySubCategoryId.get(topic.subCategoryId) ?? [];

    topics.push({
      id: topic.topicId,
      name: topic.topicName,
      total: toNumber(topic.total),
      correct: toNumber(topic.correct),
    });

    topicsBySubCategoryId.set(topic.subCategoryId, topics);
  }

  return topicsBySubCategoryId;
}

function toStudentEvaluationAttempt(row: StudentEvaluationAttemptRow): StudentEvaluationAttempt {
  const correctCount = row.correctCount ?? 0;

  return {
    id: row.id,
    tryoutTitle: row.tryoutTitle,
    attemptNumber: row.attemptNumber,
    status: row.status as "submitted" | "auto_submitted",
    startedAt: row.startedAt,
    submittedAt: row.submittedAt,
    score: row.score ?? 0,
    correctCount,
    wrongCount: row.wrongCount ?? Math.max(row.totalQuestions - correctCount, 0),
    totalQuestions: row.totalQuestions,
    xpEarned: row.xpEarned,
  };
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

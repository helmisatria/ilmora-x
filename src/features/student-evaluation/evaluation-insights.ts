export const STRONG_ACCURACY = 70;
export const WEAK_ACCURACY = 50;
export const TREND_ATTEMPT_LIMIT = 8;

export type AccuracyTone = "strong" | "medium" | "weak";

type Score = { total: number; correct: number };

type InsightCategory = Score & {
  id: string;
  name: string;
  color: string;
  subCategories: Array<Score & {
    id: string;
    name: string;
    topics: Array<Score & { id: string; name: string }>;
  }>;
};

type InsightAttempt = { score: number };

export type FocusTopic = {
  id: string;
  name: string;
  subCategoryName: string;
  categoryName: string;
  color: string;
  correct: number;
  total: number;
  pct: number;
};

export function getAccuracyPct({ correct, total }: Score) {
  if (total <= 0) return 0;

  return Math.round((correct / total) * 100);
}

export function getAccuracyTone(pct: number): AccuracyTone {
  if (pct >= STRONG_ACCURACY) return "strong";
  if (pct < WEAK_ACCURACY) return "weak";

  return "medium";
}

// Weakest first. Categories without answered questions are left out.
export function sortCategoriesByWeakness<T extends Score>(categories: T[]) {
  return categories
    .filter((category) => category.total > 0)
    .sort((a, b) => getAccuracyPct(a) - getAccuracyPct(b) || b.total - a.total);
}

// Topics below the strong threshold, weakest first. More answered questions win a tie.
export function getFocusTopics(categories: InsightCategory[], limit = 3): FocusTopic[] {
  return categories
    .flatMap((category) => category.subCategories.flatMap((subCategory) => (
      subCategory.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        subCategoryName: subCategory.name,
        categoryName: category.name,
        color: category.color,
        correct: topic.correct,
        total: topic.total,
        pct: getAccuracyPct(topic),
      }))
    )))
    .filter((topic) => topic.total > 0 && topic.pct < STRONG_ACCURACY)
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
    .slice(0, limit);
}

// Attempts arrive newest first. Returns scores oldest to newest and the change from the previous Attempt.
export function getScoreTrend(attempts: InsightAttempt[], limit = TREND_ATTEMPT_LIMIT) {
  const scores = attempts.slice(0, limit).map((attempt) => attempt.score).reverse();
  const [latest, previous] = attempts;

  return {
    scores,
    delta: latest && previous ? latest.score - previous.score : null,
  };
}

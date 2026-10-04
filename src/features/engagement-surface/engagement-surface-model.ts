import { badges, type Badge } from "./badge-catalog";
import { getLevelForXp } from "./level-catalog";

// 100% Club, Speed Runner and Fail Legend give large XP rewards, so they only count
// first attempts of full-size tryouts. Retakes and short quizzes are too easy to farm.
export const MIN_QUESTIONS_FOR_PERFORMANCE_BADGE = 20;
export const FAIL_LEGEND_MAX_SCORE = 70;
export const FAIL_LEGEND_REQUIRED_FAILS = 5;
export const SPEED_RUNNER_MIN_SCORE = 80;
export const SPEED_RUNNER_MAX_TIME_SHARE = 0.5;

export type DailyBadgeAttempt = {
  tryoutId: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt: Date | null;
  deadlineAt: Date;
  score: number | null;
  totalQuestions: number;
  autoSubmitReason: string | null;
};

export function isPerformanceBadgeAttempt(attempt: Pick<DailyBadgeAttempt, "attemptNumber" | "totalQuestions">) {
  return attempt.attemptNumber === 1 && attempt.totalQuestions >= MIN_QUESTIONS_FOR_PERFORMANCE_BADGE;
}

export function isFailLegendAttempt(attempt: Pick<DailyBadgeAttempt, "attemptNumber" | "totalQuestions" | "score">) {
  if (!isPerformanceBadgeAttempt(attempt)) return false;

  return (attempt.score ?? 0) < FAIL_LEGEND_MAX_SCORE;
}

export function isPerfectScoreAttempt(attempt: DailyBadgeAttempt) {
  if (!isPerformanceBadgeAttempt(attempt)) return false;

  return (attempt.score ?? 0) >= 100;
}

export function isSpeedRunnerAttempt(attempt: DailyBadgeAttempt) {
  if (!isPerformanceBadgeAttempt(attempt)) return false;
  if ((attempt.score ?? 0) <= SPEED_RUNNER_MIN_SCORE) return false;
  if (!attempt.submittedAt) return false;
  if (attempt.autoSubmitReason) return false;

  const allowedMs = attempt.deadlineAt.getTime() - attempt.startedAt.getTime();
  const usedMs = attempt.submittedAt.getTime() - attempt.startedAt.getTime();

  return usedMs <= allowedMs * SPEED_RUNNER_MAX_TIME_SHARE;
}

export function getNextEligibleDailyBadge<TBadge extends Badge = Badge>({
  awardedBadgeIds,
  submittedAttempts,
  totalXp,
  badgeList = badges as TBadge[],
}: {
  awardedBadgeIds: Set<number>;
  submittedAttempts: DailyBadgeAttempt[];
  totalXp: number;
  badgeList?: TBadge[];
}) {
  const level = getLevelForXp(totalXp).level;
  const streak = calculateCurrentStreak(submittedAttempts.map((attempt) => attempt.submittedAt));
  const uniqueTryoutCount = new Set(submittedAttempts.map((attempt) => attempt.tryoutId)).size;
  const failedAttemptCount = submittedAttempts.filter(isFailLegendAttempt).length;
  const hasSpeedRunnerAttempt = submittedAttempts.some(isSpeedRunnerAttempt);
  const hasPerfectScoreAttempt = submittedAttempts.some(isPerfectScoreAttempt);

  return badgeList.find((badge) => {
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
    if (badge.name === "Fail Legend") return failedAttemptCount >= FAIL_LEGEND_REQUIRED_FAILS;
    if (badge.name === "100% Club") return hasPerfectScoreAttempt;

    return false;
  }) ?? null;
}

export function calculateCurrentStreak(submittedDates: Array<Date | null>) {
  const submittedDayKeys = new Set(
    submittedDates
      .filter((date): date is Date => date !== null)
      .map(getJakartaDateKey),
  );

  if (submittedDayKeys.size === 0) return 0;

  const cursor = new Date();
  const todayKey = getJakartaDateKey(cursor);

  if (!submittedDayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);

    const yesterdayKey = getJakartaDateKey(cursor);

    if (!submittedDayKeys.has(yesterdayKey)) return 0;
  }

  let streak = 0;

  for (;;) {
    const dayKey = getJakartaDateKey(cursor);

    if (!submittedDayKeys.has(dayKey)) return streak;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
}

export function badgeCodeToId(badgeCode: string) {
  const match = badgeCode.match(/^BADGE-(\d+)$/);

  if (!match) return null;

  return Number(match[1]);
}

function getJakartaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// The IlmoraX level curve assumes 4 XP per correct answer
// (experience_required / 4 = total_right_questions_estimate in the reference).
export const XP_PER_CORRECT_ANSWER = 4;
export const RETAKE_XP_RATE = 0.25;

export function calculateAttemptXp({
  correctCount,
  attemptNumber,
  isExtraPractice,
  xpBonusPercent = 0,
}: {
  correctCount: number;
  attemptNumber: number;
  isExtraPractice: boolean;
  xpBonusPercent?: number;
}) {
  if (isExtraPractice) return 0;

  const baseXp = Math.max(correctCount, 0) * XP_PER_CORRECT_ANSWER;
  const attemptRate = attemptNumber === 1 ? 1 : RETAKE_XP_RATE;

  return Math.round(baseXp * attemptRate * (1 + xpBonusPercent / 100));
}

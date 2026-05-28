export const DAILY_ATTEMPT_RESET_TIME_ZONE = "Asia/Jakarta";

const JAKARTA_UTC_OFFSET_HOURS = 7;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function getDailyAttemptWindow(referenceDate: Date) {
  const resetOffsetMs = JAKARTA_UTC_OFFSET_HOURS * HOUR_MS;
  const localDate = new Date(referenceDate.getTime() + resetOffsetMs);
  const localMidnightUtcMs = Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
  );
  const startsAt = new Date(localMidnightUtcMs - resetOffsetMs);
  const endsAt = new Date(startsAt.getTime() + DAY_MS);

  return { startsAt, endsAt };
}

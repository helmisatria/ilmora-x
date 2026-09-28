const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getJakartaWeekStartDateKey(date = new Date()) {
  const jakartaDate = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const day = jakartaDate.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  jakartaDate.setUTCDate(jakartaDate.getUTCDate() - daysSinceMonday);

  return formatUtcDateKey(jakartaDate);
}

export function getPreviousJakartaWeekStartDateKey(date = new Date()) {
  return shiftWeekStartDateKey(getJakartaWeekStartDateKey(date), -1);
}

export function getJakartaWeekWindow(weekStartDate: string) {
  const startsAt = dateKeyToJakartaStart(weekStartDate);
  const endsAt = new Date(startsAt);

  endsAt.setUTCDate(endsAt.getUTCDate() + 7);

  return { startsAt, endsAt };
}

// Most recent closed week first.
export function listClosedJakartaWeekStartDateKeys(count: number, date = new Date()) {
  const previousWeek = getPreviousJakartaWeekStartDateKey(date);

  return Array.from({ length: count }, (_, index) => shiftWeekStartDateKey(previousWeek, -index));
}

// A week can be finalized only once it has ended, and only by its Monday start date.
export function isClosedJakartaWeekStartDateKey(weekStartDate: string, date = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) return false;

  const startsAt = dateKeyToJakartaStart(weekStartDate);

  if (Number.isNaN(startsAt.getTime())) return false;
  if (getJakartaWeekStartDateKey(startsAt) !== weekStartDate) return false;

  return weekStartDate < getJakartaWeekStartDateKey(date);
}

function shiftWeekStartDateKey(weekStartDate: string, weeks: number) {
  const startsAt = dateKeyToJakartaStart(weekStartDate);

  startsAt.setUTCDate(startsAt.getUTCDate() + weeks * 7);

  return formatUtcDateKey(new Date(startsAt.getTime() + JAKARTA_OFFSET_MS));
}

function dateKeyToJakartaStart(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

function formatUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

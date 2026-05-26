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

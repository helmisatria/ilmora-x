export type WeeklyLeaderboardRankingRow = {
  studentUserId: string;
  xp: number;
  lastXpAttemptSubmittedAt: Date;
};

export type WeeklyLeaderboardRankedRow<TRow extends WeeklyLeaderboardRankingRow> = TRow & {
  rank: number;
};

export function rankWeeklyLeaderboardRows<TRow extends WeeklyLeaderboardRankingRow>(
  rows: TRow[],
): Array<WeeklyLeaderboardRankedRow<TRow>> {
  return [...rows]
    .sort(compareWeeklyLeaderboardRows)
    .map((row, index) => ({
      ...row,
      xp: Number(row.xp),
      rank: index + 1,
    }));
}

function compareWeeklyLeaderboardRows(
  first: WeeklyLeaderboardRankingRow,
  second: WeeklyLeaderboardRankingRow,
) {
  if (second.xp !== first.xp) return second.xp - first.xp;

  const submittedAtDelta = first.lastXpAttemptSubmittedAt.getTime() - second.lastXpAttemptSubmittedAt.getTime();

  if (submittedAtDelta !== 0) return submittedAtDelta;

  return first.studentUserId.localeCompare(second.studentUserId);
}

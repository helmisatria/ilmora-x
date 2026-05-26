import assert from "node:assert/strict";
import { test } from "node:test";
import { rankWeeklyLeaderboardRows } from "./weekly-leaderboard-ranking";

test("ranks weekly Leaderboard rows by XP, submission time, then Student id", () => {
  const ranked = rankWeeklyLeaderboardRows([
    {
      studentUserId: "student-c",
      xp: 120,
      lastXpAttemptSubmittedAt: new Date("2026-05-18T04:00:00.000Z"),
    },
    {
      studentUserId: "student-b",
      xp: 180,
      lastXpAttemptSubmittedAt: new Date("2026-05-18T05:00:00.000Z"),
    },
    {
      studentUserId: "student-a",
      xp: 180,
      lastXpAttemptSubmittedAt: new Date("2026-05-18T03:00:00.000Z"),
    },
    {
      studentUserId: "student-d",
      xp: 180,
      lastXpAttemptSubmittedAt: new Date("2026-05-18T03:00:00.000Z"),
    },
  ]);

  assert.deepEqual(
    ranked.map((row) => ({ rank: row.rank, studentUserId: row.studentUserId })),
    [
      { rank: 1, studentUserId: "student-a" },
      { rank: 2, studentUserId: "student-d" },
      { rank: 3, studentUserId: "student-b" },
      { rank: 4, studentUserId: "student-c" },
    ],
  );
});

test("does not mutate weekly Leaderboard input rows", () => {
  const rows = [
    {
      studentUserId: "student-b",
      xp: 10,
      lastXpAttemptSubmittedAt: new Date("2026-05-18T05:00:00.000Z"),
    },
    {
      studentUserId: "student-a",
      xp: 20,
      lastXpAttemptSubmittedAt: new Date("2026-05-18T05:00:00.000Z"),
    },
  ];

  rankWeeklyLeaderboardRows(rows);

  assert.deepEqual(
    rows.map((row) => row.studentUserId),
    ["student-b", "student-a"],
  );
});

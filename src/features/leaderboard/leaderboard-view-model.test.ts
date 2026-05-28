import assert from "node:assert/strict";
import test from "node:test";
import {
  getLeaderboardLeaderGap,
  getProfileParams,
  getProfileTo,
  getRankSymbol,
  getRankTone,
  isLeaderboardEntry,
  toLeaderboardEntryViews,
} from "./leaderboard-view-model";

test("builds Leaderboard entry view data", () => {
  const [entry] = toLeaderboardEntryViews([
    {
      rank: 1,
      userId: "student-1",
      name: "Ari",
      xp: 120,
      avatar: "AR",
      photoUrl: null,
      me: true,
    },
  ]);

  assert.equal(entry.r, 1);
  assert.equal(entry.n, "Ari");
  assert.equal(entry.level, 3);
  assert.equal(entry.grade, "Pharmacy Novice");
  assert.equal(entry.ch, "up");
});

test("calculates Leaderboard leader gap and profile links", () => {
  const [leader, viewer] = toLeaderboardEntryViews([
    { rank: 1, userId: "leader", name: "Leader", xp: 500, avatar: "LE", me: false },
    { rank: 2, userId: "viewer", name: "Viewer", xp: 350, avatar: "VI", me: true },
  ]);

  assert.equal(getLeaderboardLeaderGap(viewer, leader), 150);
  assert.equal(getProfileTo(viewer), "/profile");
  assert.equal(getProfileParams(viewer), undefined);
  assert.equal(getProfileTo(leader), "/profile/$userId");
  assert.deepEqual(getProfileParams(leader), { userId: "leader" });
});

test("resolves Leaderboard rank display helpers", () => {
  assert.equal(isLeaderboardEntry(undefined), false);
  assert.equal(getRankTone(1), "#f59e0b");
  assert.equal(getRankTone(4), "#205072");
  assert.equal(getRankSymbol(2), "II");
  assert.equal(getRankSymbol(10), "+");
});

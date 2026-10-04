import assert from "node:assert/strict";
import test from "node:test";
import { getBadgeProgress, type BadgeProgressInput } from "./badge-progress";
import { mergeBadgeSettings } from "./badge-settings";

const newStudent: BadgeProgressInput = {
  xp: 0,
  streak: 0,
  totalAttempts: 0,
  uniqueTryoutCount: 0,
  failLegendAttemptCount: 0,
  awardedBadgeIds: [],
};

const activeCatalog = mergeBadgeSettings([]);

function progressFor(badgeId: number, summary: Partial<BadgeProgressInput>, catalog = activeCatalog) {
  return getBadgeProgress(catalog, { ...newStudent, ...summary }).find((item) => item.badgeId === badgeId);
}

test("a badge is unlocked only when it has an award record", () => {
  assert.deepEqual(progressFor(1, { totalAttempts: 1, awardedBadgeIds: [1] }), {
    badgeId: 1,
    progress: 1,
    total: 1,
    unlocked: true,
    pending: false,
  });
  assert.equal(progressFor(1, { totalAttempts: 1 })?.unlocked, false);
});

test("meeting the target without an award record is pending, not unlocked", () => {
  const firstSteps = progressFor(1, { totalAttempts: 1 });
  const dedicated = progressFor(22, { uniqueTryoutCount: 20 });

  assert.deepEqual(firstSteps, { badgeId: 1, progress: 1, total: 1, unlocked: false, pending: true });
  assert.deepEqual(dedicated, { badgeId: 22, progress: 15, total: 15, unlocked: false, pending: true });
});

test("partial progress is neither unlocked nor pending", () => {
  assert.deepEqual(progressFor(18, { streak: 3 }), {
    badgeId: 18,
    progress: 3,
    total: 7,
    unlocked: false,
    pending: false,
  });
});

test("server-judged badges are never pending", () => {
  const leaderboardAndSpecial = getBadgeProgress(activeCatalog, newStudent).filter((item) => [13, 25, 27].includes(item.badgeId));

  assert.ok(leaderboardAndSpecial.every((item) => !item.pending && !item.unlocked));
});

test("awarded server-judged badges show as unlocked", () => {
  assert.equal(progressFor(13, { awardedBadgeIds: [13] })?.unlocked, true);
});

test("an inactive badge is never pending, because awarding skips it", () => {
  const catalog = mergeBadgeSettings([
    { badgeCode: "BADGE-022", displayName: null, requirementText: null, xpReward: null, active: false },
  ]);

  assert.deepEqual(progressFor(22, { uniqueTryoutCount: 20 }, catalog), {
    badgeId: 22,
    progress: 15,
    total: 15,
    unlocked: false,
    pending: false,
  });
  assert.equal(progressFor(22, { uniqueTryoutCount: 20, awardedBadgeIds: [22] }, catalog)?.unlocked, true);
});

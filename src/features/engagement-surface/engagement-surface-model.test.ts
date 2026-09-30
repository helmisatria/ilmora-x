import assert from "node:assert/strict";
import test from "node:test";
import { badges } from "./badge-catalog";
import { mergeBadgeSettings } from "./badge-settings";
import {
  getNextEligibleDailyBadge,
  isFailLegendAttempt,
  isPerfectScoreAttempt,
  isSpeedRunnerAttempt,
  type DailyBadgeAttempt,
} from "./engagement-surface-model";
import { getLevelForXp } from "./level-catalog";
import { calculateAttemptXp } from "../tryout-attempt/attempt-xp";

const MINUTE = 60 * 1000;

function makeAttempt(overrides: Partial<DailyBadgeAttempt> = {}): DailyBadgeAttempt {
  const startedAt = new Date();

  return {
    tryoutId: "tryout-1",
    attemptNumber: 1,
    startedAt,
    submittedAt: new Date(startedAt.getTime() + 90 * MINUTE),
    deadlineAt: new Date(startedAt.getTime() + 100 * MINUTE),
    score: 100,
    totalQuestions: 100,
    autoSubmitReason: null,
    ...overrides,
  };
}

// Runs the same award loop as awardDailyBadges, without the database.
function awardAllBadges(submittedAttempts: DailyBadgeAttempt[], attemptXp: number) {
  const awardedBadgeIds = new Set<number>();
  let totalXp = attemptXp;

  for (;;) {
    const badge = getNextEligibleDailyBadge({ awardedBadgeIds, submittedAttempts, totalXp });

    if (!badge) return { awardedBadgeIds, totalXp };

    awardedBadgeIds.add(badge.id);
    totalXp += badge.xpReward;
  }
}

test("100% Club needs a perfect first attempt on a 20+ question tryout", () => {
  assert.equal(isPerfectScoreAttempt(makeAttempt()), true);
  assert.equal(isPerfectScoreAttempt(makeAttempt({ totalQuestions: 19 })), false);
  assert.equal(isPerfectScoreAttempt(makeAttempt({ attemptNumber: 2 })), false);
  assert.equal(isPerfectScoreAttempt(makeAttempt({ score: 99 })), false);
});

test("Speed Runner needs a first attempt finished in half the time with more than 80%", () => {
  const startedAt = new Date("2026-09-28T01:00:00.000Z");
  const fastAttempt = {
    startedAt,
    deadlineAt: new Date(startedAt.getTime() + 100 * MINUTE),
    submittedAt: new Date(startedAt.getTime() + 50 * MINUTE),
    score: 85,
  };

  assert.equal(isSpeedRunnerAttempt(makeAttempt(fastAttempt)), true);
  assert.equal(isSpeedRunnerAttempt(makeAttempt({ ...fastAttempt, submittedAt: new Date(startedAt.getTime() + 51 * MINUTE) })), false);
  assert.equal(isSpeedRunnerAttempt(makeAttempt({ ...fastAttempt, score: 80 })), false);
  assert.equal(isSpeedRunnerAttempt(makeAttempt({ ...fastAttempt, attemptNumber: 2 })), false);
  assert.equal(isSpeedRunnerAttempt(makeAttempt({ ...fastAttempt, totalQuestions: 10 })), false);
  assert.equal(isSpeedRunnerAttempt(makeAttempt({ ...fastAttempt, autoSubmitReason: "deadline_reached" })), false);
});

test("a perfect 1-question quiz only earns First Steps", () => {
  const attempt = makeAttempt({ totalQuestions: 1 });
  const { awardedBadgeIds, totalXp } = awardAllBadges([attempt], calculateAttemptXp({
    correctCount: 1,
    attemptNumber: 1,
    isExtraPractice: false,
  }));

  assert.deepEqual([...awardedBadgeIds], [1]);
  assert.equal(totalXp, 14);
  assert.equal(getLevelForXp(totalXp).level, 1);
});

test("a normal-paced perfect 100-question tryout does not jump a new student past level 21", () => {
  const attempt = makeAttempt();
  const attemptXp = calculateAttemptXp({ correctCount: 100, attemptNumber: 1, isExtraPractice: false });
  const { awardedBadgeIds, totalXp } = awardAllBadges([attempt], attemptXp);
  const hundredPercentClub = badges.find((badge) => badge.name === "100% Club");

  assert.ok(hundredPercentClub && awardedBadgeIds.has(hundredPercentClub.id));
  assert.equal(awardedBadgeIds.has(25), false);
  assert.ok(getLevelForXp(totalXp).level <= 21, `reached level ${getLevelForXp(totalXp).level} with ${totalXp} XP`);
});

test("level badges follow the reference level thresholds", () => {
  const attempt = makeAttempt({ score: 50 });
  const { awardedBadgeIds } = awardAllBadges([attempt], 220);

  assert.equal(awardedBadgeIds.has(2), true);
  assert.equal(awardedBadgeIds.has(3), false);
});

test("Fail Legend only counts failed first attempts on 20+ question tryouts", () => {
  assert.equal(isFailLegendAttempt(makeAttempt({ score: 69 })), true);
  assert.equal(isFailLegendAttempt(makeAttempt({ score: 70 })), false);
  assert.equal(isFailLegendAttempt(makeAttempt({ score: 0, attemptNumber: 2 })), false);
  assert.equal(isFailLegendAttempt(makeAttempt({ score: 0, totalQuestions: 5 })), false);
});

test("failing the same tryout 5 times does not earn Fail Legend", () => {
  const retakes = [1, 2, 3, 4, 5].map((attemptNumber) => makeAttempt({ attemptNumber, score: 10 }));
  const { awardedBadgeIds } = awardAllBadges(retakes, 0);

  assert.equal(awardedBadgeIds.has(26), false);
});

test("failing 5 different full tryouts earns Fail Legend", () => {
  const fails = [1, 2, 3, 4, 5].map((index) => makeAttempt({ tryoutId: `tryout-${index}`, score: 10 }));
  const { awardedBadgeIds } = awardAllBadges(fails, 0);

  assert.equal(awardedBadgeIds.has(26), true);
});

test("turned-off badges are skipped and the next eligible badge is awarded instead", () => {
  const badgeList = mergeBadgeSettings([
    { badgeCode: "BADGE-001", displayName: null, requirementText: null, xpReward: null, active: false },
    { badgeCode: "BADGE-017", displayName: null, requirementText: null, xpReward: 42, active: true },
  ]).filter((badge) => badge.active);
  const badge = getNextEligibleDailyBadge({
    awardedBadgeIds: new Set(),
    submittedAttempts: [makeAttempt({ score: 50, totalQuestions: 10 })],
    totalXp: 0,
    badgeList,
  });

  assert.equal(badge, null);

  const today = new Date();
  const streakAttempts = [0, 1, 2].map((daysAgo) => {
    const startedAt = new Date(today.getTime() - daysAgo * 24 * 60 * MINUTE);

    return makeAttempt({ startedAt, submittedAt: startedAt, score: 50, totalQuestions: 10 });
  });
  const streakBadge = getNextEligibleDailyBadge({
    awardedBadgeIds: new Set(),
    submittedAttempts: streakAttempts,
    totalXp: 0,
    badgeList,
  });

  assert.equal(streakBadge?.code, "BADGE-017");
  assert.equal(streakBadge?.xpReward, 42);
});

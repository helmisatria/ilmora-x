import assert from "node:assert/strict";
import test from "node:test";
import { calculateAttemptXp } from "./attempt-xp";

test("gives 4 XP per correct answer on a first attempt", () => {
  assert.equal(calculateAttemptXp({ correctCount: 100, attemptNumber: 1, isExtraPractice: false }), 400);
  assert.equal(calculateAttemptXp({ correctCount: 25, attemptNumber: 1, isExtraPractice: false }), 100);
});

test("gives no XP for a blank submission", () => {
  assert.equal(calculateAttemptXp({ correctCount: 0, attemptNumber: 1, isExtraPractice: false }), 0);
});

test("gives 25% XP on retakes", () => {
  assert.equal(calculateAttemptXp({ correctCount: 100, attemptNumber: 2, isExtraPractice: false }), 100);
  assert.equal(calculateAttemptXp({ correctCount: 3, attemptNumber: 3, isExtraPractice: false }), 3);
});

test("gives no XP for extra practice attempts", () => {
  assert.equal(calculateAttemptXp({ correctCount: 100, attemptNumber: 1, isExtraPractice: true }), 0);
});

test("applies the permanent level badge bonus", () => {
  assert.equal(calculateAttemptXp({ correctCount: 100, attemptNumber: 1, isExtraPractice: false, xpBonusPercent: 5 }), 420);
  assert.equal(calculateAttemptXp({ correctCount: 100, attemptNumber: 2, isExtraPractice: false, xpBonusPercent: 40 }), 140);
  assert.equal(calculateAttemptXp({ correctCount: 100, attemptNumber: 1, isExtraPractice: true, xpBonusPercent: 40 }), 0);
});

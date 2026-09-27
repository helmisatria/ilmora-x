import assert from "node:assert/strict";
import test from "node:test";
import { getPermanentXpBonusPercent } from "./badge-catalog";

test("level badges give the reference permanent XP bonus", () => {
  assert.equal(getPermanentXpBonusPercent([]), 0);
  assert.equal(getPermanentXpBonusPercent([1, 2, 3]), 0);
  assert.equal(getPermanentXpBonusPercent([4]), 5);
  assert.equal(getPermanentXpBonusPercent([11]), 40);
  assert.equal(getPermanentXpBonusPercent([12]), 0);
});

test("only the highest permanent XP bonus counts", () => {
  assert.equal(getPermanentXpBonusPercent([4, 5, 6]), 15);
  assert.equal(getPermanentXpBonusPercent([4, 5, 6, 7, 8, 9, 10, 11]), 40);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPreviousJakartaWeekStartDateKey,
  isClosedJakartaWeekStartDateKey,
  listClosedJakartaWeekStartDateKeys,
} from "./leaderboard-weeks";

// Monday 2026-09-28 00:30 WIB, shortly after the week boundary.
const justAfterBoundary = new Date("2026-09-27T17:30:00.000Z");
// Sunday 2026-09-27 23:30 WIB, shortly before the week boundary.
const justBeforeBoundary = new Date("2026-09-27T16:30:00.000Z");

test("previous week follows the Monday 00:00 WIB boundary", () => {
  assert.equal(getPreviousJakartaWeekStartDateKey(justAfterBoundary), "2026-09-21");
  assert.equal(getPreviousJakartaWeekStartDateKey(justBeforeBoundary), "2026-09-14");
});

test("lists closed weeks newest first, across a month boundary", () => {
  assert.deepEqual(listClosedJakartaWeekStartDateKeys(3, justAfterBoundary), [
    "2026-09-21",
    "2026-09-14",
    "2026-09-07",
  ]);
  assert.deepEqual(listClosedJakartaWeekStartDateKeys(2, new Date("2026-03-03T03:00:00.000Z")), [
    "2026-02-23",
    "2026-02-16",
  ]);
});

test("only closed Monday week keys can be finalized", () => {
  assert.equal(isClosedJakartaWeekStartDateKey("2026-09-21", justAfterBoundary), true);
  assert.equal(isClosedJakartaWeekStartDateKey("2026-09-21", justBeforeBoundary), false);
  assert.equal(isClosedJakartaWeekStartDateKey("2026-09-28", justAfterBoundary), false);
  assert.equal(isClosedJakartaWeekStartDateKey("2026-10-05", justAfterBoundary), false);
  assert.equal(isClosedJakartaWeekStartDateKey("2026-09-22", justAfterBoundary), false);
  assert.equal(isClosedJakartaWeekStartDateKey("2026-02-30", justAfterBoundary), false);
  assert.equal(isClosedJakartaWeekStartDateKey("21-09-2026", justAfterBoundary), false);
});

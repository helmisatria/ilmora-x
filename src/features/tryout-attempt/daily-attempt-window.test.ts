import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DAILY_ATTEMPT_RESET_TIME_ZONE,
  getDailyAttemptWindow,
} from "./daily-attempt-window";

function iso(value: Date) {
  return value.toISOString();
}

test("daily attempts reset on Jakarta midnight", () => {
  const referenceDate = new Date("2026-05-18T12:08:04.587Z");
  const window = getDailyAttemptWindow(referenceDate);

  assert.equal(DAILY_ATTEMPT_RESET_TIME_ZONE, "Asia/Jakarta");
  assert.equal(iso(window.startsAt), "2026-05-17T17:00:00.000Z");
  assert.equal(iso(window.endsAt), "2026-05-18T17:00:00.000Z");
});

test("Jakarta midnight belongs to the new daily attempt window", () => {
  const referenceDate = new Date("2026-05-17T17:00:00.000Z");
  const window = getDailyAttemptWindow(referenceDate);

  assert.equal(iso(window.startsAt), "2026-05-17T17:00:00.000Z");
  assert.equal(iso(window.endsAt), "2026-05-18T17:00:00.000Z");
});

test("the moment before Jakarta midnight stays in the previous window", () => {
  const referenceDate = new Date("2026-05-17T16:59:59.999Z");
  const window = getDailyAttemptWindow(referenceDate);

  assert.equal(iso(window.startsAt), "2026-05-16T17:00:00.000Z");
  assert.equal(iso(window.endsAt), "2026-05-17T17:00:00.000Z");
});

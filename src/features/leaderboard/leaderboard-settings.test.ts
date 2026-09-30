import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveWeeklyParticipantThreshold } from "./leaderboard-settings";

test("admin setting wins over the env var", () => {
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: 25, envValue: "5" }),
    { value: 25, source: "admin" },
  );
});

test("env var applies when no admin setting is saved", () => {
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: null, envValue: "5" }),
    { value: 5, source: "env" },
  );
});

test("default applies when neither is set", () => {
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: undefined, envValue: undefined }),
    { value: 10, source: "default" },
  );
});

test("invalid values are skipped", () => {
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: 0, envValue: "abc" }),
    { value: 10, source: "default" },
  );
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: null, envValue: "2.5" }),
    { value: 10, source: "default" },
  );
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: null, envValue: "" }),
    { value: 10, source: "default" },
  );
  assert.deepEqual(
    resolveWeeklyParticipantThreshold({ adminValue: -3, envValue: "12" }),
    { value: 12, source: "env" },
  );
});

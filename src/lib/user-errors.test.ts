import assert from "node:assert/strict";
import test from "node:test";
import { isSessionEndedError } from "./user-errors";

test("recognizes the error returned when the session no longer exists", () => {
  assert.equal(isSessionEndedError(new Error("Authentication is required.")), true);
  assert.equal(isSessionEndedError({ message: "Authentication is required." }), true);
});

test("ignores other errors", () => {
  assert.equal(isSessionEndedError(new Error("This Student account is suspended.")), false);
  assert.equal(isSessionEndedError(undefined), false);
});

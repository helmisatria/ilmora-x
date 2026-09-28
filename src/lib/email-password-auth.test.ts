import assert from "node:assert/strict";
import test from "node:test";
import { isEmailPasswordAuthEnabled } from "./email-password-auth";

test("email/password auth is available only in local development and Railway staging", () => {
  assert.equal(isEmailPasswordAuthEnabled({ NODE_ENV: "development" }), true);
  assert.equal(
    isEmailPasswordAuthEnabled({ NODE_ENV: "production", RAILWAY_ENVIRONMENT_NAME: "staging" }),
    true,
  );
  assert.equal(
    isEmailPasswordAuthEnabled({ NODE_ENV: "development", RAILWAY_ENVIRONMENT_NAME: "production" }),
    false,
  );
  assert.equal(isEmailPasswordAuthEnabled({ NODE_ENV: "production" }), false);
});

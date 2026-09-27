import assert from "node:assert/strict";
import test from "node:test";
import { getLoginCallbackUrl } from "./product-analytics";
import { getPostLoginRedirectForPath } from "./post-login-redirect";

test("keeps premium as a safe post-login destination", () => {
  assert.equal(getPostLoginRedirectForPath("/premium"), "/premium");
});

test("keeps the try-out catalog as a safe post-login destination", () => {
  assert.equal(getPostLoginRedirectForPath("/tryout"), "/tryout");
});

test("rejects paths that are not approved post-login destinations", () => {
  assert.equal(getPostLoginRedirectForPath("https://example.com"), undefined);
  assert.equal(getPostLoginRedirectForPath("/admin"), undefined);
});

test("includes the premium destination in the Google callback URL", () => {
  assert.equal(
    getLoginCallbackUrl(undefined, "/premium"),
    "/auth/complete-profile?redirectTo=%2Fpremium",
  );
  assert.equal(
    getLoginCallbackUrl("home_signup", "/premium"),
    "/auth/complete-profile?intent=home_signup&redirectTo=%2Fpremium",
  );
});

test("includes the try-out catalog in the Google callback URL", () => {
  assert.equal(
    getLoginCallbackUrl("home_tryout", "/tryout"),
    "/auth/complete-profile?intent=home_tryout&redirectTo=%2Ftryout",
  );
});

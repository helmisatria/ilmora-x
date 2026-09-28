import assert from "node:assert/strict";
import { test } from "node:test";
import { getAnnouncementStatus, getPlacementsForSurface, isAnnouncementCtaUrl, isAnnouncementImageUrl } from "./announcement-rules";

const now = new Date("2026-09-28T10:00:00.000Z");

function announcement(overrides: Partial<{ active: boolean; startsAt: string; endsAt: string }> = {}) {
  return {
    active: true,
    startsAt: "2026-09-27T00:00:00.000Z",
    endsAt: "2026-09-30T00:00:00.000Z",
    ...overrides,
  };
}

test("an enabled announcement inside its window is live", () => {
  assert.equal(getAnnouncementStatus(announcement(), now), "live");
});

test("a disabled announcement is never live, even inside its window", () => {
  assert.equal(getAnnouncementStatus(announcement({ active: false }), now), "disabled");
});

test("an enabled announcement before its start time is scheduled", () => {
  assert.equal(getAnnouncementStatus(announcement({ startsAt: "2026-09-29T00:00:00.000Z" }), now), "scheduled");
});

test("an enabled announcement stops at its end time", () => {
  assert.equal(getAnnouncementStatus(announcement({ endsAt: now.toISOString() }), now), "expired");
});

test("each surface also shows announcements placed on all surfaces", () => {
  assert.deepEqual(getPlacementsForSurface("landing"), ["all", "landing"]);
  assert.deepEqual(getPlacementsForSurface("app"), ["all", "app"]);
});

test("button links must be an app path or an https URL", () => {
  assert.equal(isAnnouncementCtaUrl("/premium"), true);
  assert.equal(isAnnouncementCtaUrl("https://ilmorax.com/promo"), true);
  assert.equal(isAnnouncementCtaUrl("//evil.test"), false);
  assert.equal(isAnnouncementCtaUrl("//["), false);
  assert.equal(isAnnouncementCtaUrl("/\\evil.test"), false);
  assert.equal(isAnnouncementCtaUrl("/\n/evil.test"), false);
  assert.equal(isAnnouncementCtaUrl("javascript:alert(1)"), false);
  assert.equal(isAnnouncementCtaUrl("http://ilmorax.com"), false);
});

test("images must be an app path or an http(s) URL", () => {
  assert.equal(isAnnouncementImageUrl("/api/media/abc"), true);
  assert.equal(isAnnouncementImageUrl("http://localhost:8090/api/media/abc"), true);
  assert.equal(isAnnouncementImageUrl("https://ilmorax.com/api/media/abc"), true);
  assert.equal(isAnnouncementImageUrl("//evil.test/a.png"), false);
  assert.equal(isAnnouncementImageUrl("//["), false);
  assert.equal(isAnnouncementImageUrl("/\\evil.test/a.png"), false);
  assert.equal(isAnnouncementImageUrl("/\n/evil.test/a.png"), false);
  assert.equal(isAnnouncementImageUrl("javascript:alert(1)"), false);
});

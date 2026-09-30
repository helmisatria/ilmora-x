import assert from "node:assert/strict";
import { test } from "node:test";
import { badges, getBadgeRequirementText } from "./badge-catalog";
import { badgeIdToCode, mergeBadgeSettings } from "./badge-settings";

const override = {
  badgeCode: "BADGE-017",
  displayName: null,
  requirementText: null,
  xpReward: null,
  active: true,
};

function findMerged(overrides: Parameters<typeof mergeBadgeSettings>[0], code: string) {
  return mergeBadgeSettings(overrides).find((badge) => badge.code === code)!;
}

test("badge codes are zero-padded catalog ids", () => {
  assert.equal(badgeIdToCode(1), "BADGE-001");
  assert.equal(badgeIdToCode(27), "BADGE-027");
});

test("without overrides every badge keeps its catalog values and stays active", () => {
  const merged = mergeBadgeSettings([]);

  assert.equal(merged.length, badges.length);

  for (const [index, badge] of merged.entries()) {
    assert.equal(badge.displayName, badges[index].name);
    assert.equal(badge.requirementText, getBadgeRequirementText(badges[index]));
    assert.equal(badge.requirementOverride, null);
    assert.equal(badge.xpReward, badges[index].xpReward);
    assert.equal(badge.active, true);
  }
});

test("overrides change display text, reward and active state but not the rule fields", () => {
  const badge = findMerged([{
    ...override,
    displayName: "  Api Tiga Hari ",
    requirementText: "Belajar 3 hari berturut-turut.",
    xpReward: 150,
    active: false,
  }], "BADGE-017");

  assert.equal(badge.displayName, "Api Tiga Hari");
  assert.equal(badge.requirementText, "Belajar 3 hari berturut-turut.");
  assert.equal(badge.requirementOverride, "Belajar 3 hari berturut-turut.");
  assert.equal(badge.xpReward, 150);
  assert.equal(badge.defaultXpReward, 300);
  assert.equal(badge.active, false);
  assert.equal(badge.name, "3-Days Streak");
  assert.equal(badge.task, "Complete tryout every day for 3 days");
});

test("blank text falls back to the catalog and a zero reward is kept", () => {
  const badge = findMerged([{ ...override, displayName: " ", requirementText: "", xpReward: 0 }], "BADGE-017");

  assert.equal(badge.displayName, "3-Days Streak");
  assert.equal(badge.requirementOverride, null);
  assert.equal(badge.xpReward, 0);
});

test("badges with a permanent EXP bonus stay active even if an override says otherwise", () => {
  const badge = findMerged([{ ...override, badgeCode: "BADGE-004", active: false }], "BADGE-004");

  assert.equal(badge.permanentXpBonusPercent, 5);
  assert.equal(badge.active, true);
});

test("overrides for unknown codes are ignored", () => {
  const merged = mergeBadgeSettings([{ ...override, badgeCode: "BADGE-021", active: false }]);

  assert.equal(merged.some((badge) => badge.code === "BADGE-021"), false);
});

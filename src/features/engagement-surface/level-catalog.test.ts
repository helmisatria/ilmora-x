import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getLevelForXp, getLevelTier, getNextLevel, getXpProgress, levels } from "./level-catalog";

const referencePath = new URL("../../../docs/IlmoraX - Structured Reference.md", import.meta.url);

function readReferenceLevels() {
  const reference = readFileSync(referencePath, "utf8");

  return [...reference.matchAll(/^\| (\d+) \| (Pharmacy[^|]*?) \| (\d+) \|/gm)].map((match) => ({
    level: Number(match[1]),
    title: match[2].trim(),
    xp: Number(match[3]),
  }));
}

test("matches all 50 levels in the IlmoraX reference", () => {
  const referenceLevels = readReferenceLevels();

  assert.equal(referenceLevels.length, 50);
  assert.deepEqual(levels, referenceLevels);
});

test("maps XP to a level at the exact thresholds", () => {
  assert.equal(getLevelForXp(0).level, 1);
  assert.equal(getLevelForXp(99).level, 1);
  assert.equal(getLevelForXp(100).level, 2);
  assert.equal(getLevelForXp(219).level, 2);
  assert.equal(getLevelForXp(220).level, 3);
  assert.equal(getLevelForXp(42_279).level, 49);
  assert.equal(getLevelForXp(42_280).level, 50);
  assert.equal(getLevelForXp(1_000_000).level, 50);
});

test("maps every threshold and the EXP just below it", () => {
  for (const [index, entry] of levels.entries()) {
    assert.equal(getLevelForXp(entry.xp).level, entry.level);
    if (index === 0) continue;

    assert.equal(getLevelForXp(entry.xp - 1).level, levels[index - 1].level);
  }
});

test("reports the next level and progress toward it", () => {
  assert.equal(getNextLevel(0)?.level, 2);
  assert.equal(getNextLevel(42_280), null);
  assert.equal(getXpProgress(50), 50);
  assert.equal(getXpProgress(42_280), 100);
});

test("derives the grade tier from the level title", () => {
  assert.equal(getLevelTier(1), "Pharmacy Newbie");
  assert.equal(getLevelTier(5), "Pharmacy Novice");
  assert.equal(getLevelTier(21), "Pharmacy Specialist");
  assert.equal(getLevelTier(36), "Pharmacy Master");
  assert.equal(getLevelTier(41), "Pharmacy Grand-Master");
  assert.equal(getLevelTier(49), "Pharmacy Authority");
  assert.equal(getLevelTier(50), "Pharmacy Legendary");
});

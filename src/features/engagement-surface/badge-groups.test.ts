import assert from "node:assert/strict";
import test from "node:test";
import { badges } from "./badge-catalog";
import { getBadgeGroupKey, getNextBadges, hasMeasurableProgress, type BadgeProgressView } from "./badge-groups";

function namesInGroup(key: string) {
  return badges.filter((badge) => getBadgeGroupKey(badge) === key).map((badge) => badge.name);
}

test("badges are grouped by what the student does", () => {
  assert.deepEqual(namesInGroup("start"), ["First Steps"]);
  assert.equal(namesInGroup("level").length, 11);
  assert.deepEqual(namesInGroup("streak"), ["3-Days Streak", "7-Days Streak", "14-Days Streak", "30-Days Warrior"]);
  assert.deepEqual(namesInGroup("tryouts"), ["Dedicated", "Master", "Legendary"]);
  assert.deepEqual(namesInGroup("leaderboard"), ["Top 10", "Top 5", "Top 3", "Top 1"]);
  assert.deepEqual(namesInGroup("special"), ["Speed Runner", "Fail Legend", "100% Club"]);
});

test("server-judged badges have no measurable progress", () => {
  const unmeasurable = badges.filter((badge) => !hasMeasurableProgress(badge)).map((badge) => badge.name);

  assert.deepEqual(unmeasurable, ["Top 10", "Top 5", "Top 3", "Top 1", "Speed Runner", "100% Club"]);
});

test("next badges are the locked, measurable ones closest to unlocking, one per group", () => {
  const progress: BadgeProgressView[] = badges.map((badge) => ({
    badgeId: badge.id,
    progress: 0,
    total: 5,
    unlocked: false,
  }));
  const set = (id: number, value: Partial<BadgeProgressView>) =>
    Object.assign(progress.find((item) => item.badgeId === id)!, value);

  set(1, { progress: 1, total: 1, unlocked: true });
  set(2, { progress: 2, total: 3 });
  set(17, { progress: 2, total: 3 });
  set(18, { progress: 2, total: 7 });
  set(13, { progress: 0, total: 1 });
  set(26, { progress: 4, total: 5 });

  const next = getNextBadges(badges, progress).map((item) => item.badge.id);

  assert.deepEqual(next, [2, 17, 22]);
});

test("a brand-new student sees one badge per group, not only Level badges", () => {
  const progress = badges.map((badge) => ({
    badgeId: badge.id,
    progress: getBadgeGroupKey(badge) === "level" ? 1 : 0,
    total: Number(badge.task.match(/\d+/)?.[0] ?? 1),
    unlocked: false,
  }));

  const next = getNextBadges(badges, progress).map((item) => item.badge.name);

  assert.deepEqual(next, ["Pharmacy Novice Badge", "First Steps", "3-Days Streak"]);
});

test("next badges is empty when only server-judged badges are locked", () => {
  const progress = badges.map((badge) => ({
    badgeId: badge.id,
    progress: 1,
    total: 1,
    unlocked: hasMeasurableProgress(badge) && badge.name !== "Fail Legend",
  }));

  assert.deepEqual(getNextBadges(badges, progress), []);
});

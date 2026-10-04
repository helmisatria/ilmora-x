import type { Badge } from "./badge-catalog";
import { hasMeasurableProgress, type BadgeProgressView } from "./badge-groups";
import { getLevelForXp } from "./level-catalog";

export type BadgeProgressInput = {
  xp: number;
  streak: number;
  totalAttempts: number;
  uniqueTryoutCount: number;
  failLegendAttemptCount: number;
  awardedBadgeIds: number[];
};

// Only an award record unlocks a badge. Meeting the target without one is "pending":
// awardDailyBadges grants it on the student's next Try-out submit. It skips inactive
// badges, so those are never pending.
export function getBadgeProgress(
  badges: Array<Badge & { active: boolean }>,
  summary: BadgeProgressInput,
): BadgeProgressView[] {
  const level = getLevelForXp(summary.xp).level;
  const awarded = new Set(summary.awardedBadgeIds);

  return badges.map((badge) => {
    const target = getBadgeTarget(badge);
    const progress = Math.min(getBadgeProgressValue(badge, { level, summary }), target);
    const unlocked = awarded.has(badge.id);

    return {
      badgeId: badge.id,
      progress: unlocked ? target : progress,
      total: target,
      unlocked,
      pending: badge.active && !unlocked && progress >= target,
    };
  });
}

export function getBadgeTarget(badge: Badge) {
  const levelMatch = badge.task.match(/Reach Level (\d+)/i);
  const streakMatch = badge.task.match(/(\d+)[-\s]Days/i);
  const tryoutMatch = badge.task.match(/Complete (\d+) unique tryouts/i);
  const failMatch = badge.task.match(/Reach (\d+)x fail/i);

  if (levelMatch) return Number(levelMatch[1]);
  if (streakMatch) return Number(streakMatch[1]);
  if (tryoutMatch) return Number(tryoutMatch[1]);
  if (failMatch) return Number(failMatch[1]);

  return 1;
}

function getBadgeProgressValue(
  badge: Badge,
  data: { level: number; summary: BadgeProgressInput },
) {
  // Only the server can judge these rules, so they show as unlocked once awarded.
  if (!hasMeasurableProgress(badge)) return 0;
  if (badge.category === "Level") return data.level;
  if (badge.category === "Streak") {
    if (badge.task.includes("unique tryouts")) return data.summary.uniqueTryoutCount;
    return data.summary.streak;
  }
  if (badge.id === 1) return data.summary.totalAttempts > 0 ? 1 : 0;
  if (badge.name === "Fail Legend") return data.summary.failLegendAttemptCount;

  return 0;
}

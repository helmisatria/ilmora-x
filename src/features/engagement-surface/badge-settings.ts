import { badges, getBadgeRequirementText, type Badge } from "./badge-catalog";

export type BadgeSettingOverride = {
  badgeCode: string;
  displayName: string | null;
  requirementText: string | null;
  xpReward: number | null;
  active: boolean;
};

// `name` and `task` stay the catalog values because awarding and progress rules match on them.
// Students see `displayName` and `requirementText`; awarding uses `xpReward` and `active`.
export type EffectiveBadge = Badge & {
  code: string;
  displayName: string;
  requirementText: string;
  requirementOverride: string | null;
  defaultXpReward: number;
  active: boolean;
};

export function badgeIdToCode(badgeId: number) {
  return `BADGE-${String(badgeId).padStart(3, "0")}`;
}

// Turning off a Level badge with a permanent bonus would change the bonus tiers, which stay fixed.
export function canDeactivateBadge(badge: Pick<Badge, "permanentXpBonusPercent">) {
  return !badge.permanentXpBonusPercent;
}

export function mergeBadgeSettings(
  overrides: BadgeSettingOverride[],
  catalog: Badge[] = badges,
): EffectiveBadge[] {
  const overrideByCode = new Map(overrides.map((override) => [override.badgeCode, override]));

  return catalog.map((badge) => {
    const code = badgeIdToCode(badge.id);
    const override = overrideByCode.get(code);
    const requirementOverride = override?.requirementText?.trim() || null;

    return {
      ...badge,
      code,
      displayName: override?.displayName?.trim() || badge.name,
      requirementText: requirementOverride ?? getBadgeRequirementText(badge),
      requirementOverride,
      xpReward: override?.xpReward ?? badge.xpReward,
      defaultXpReward: badge.xpReward,
      active: canDeactivateBadge(badge) ? override?.active ?? true : true,
    };
  });
}

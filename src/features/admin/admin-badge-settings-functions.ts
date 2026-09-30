import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { badgeSettings, studentBadges } from "../../lib/db/schema";
import { badRequest, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { getBadgeRequirementText } from "../engagement-surface/badge-catalog";
import { canDeactivateBadge } from "../engagement-surface/badge-settings";
import { listEffectiveBadges } from "../engagement-surface/engagement-surface";
import { superAdminMiddleware } from "./admin-access";
import { listSettingsAudit, recordSettingsAudit, type SettingsAuditChange } from "./admin-settings-audit";

// Empty text and a null reward mean "use the catalog value".
const badgeSettingsSchema = z.object({
  badgeCode: z.string().trim().regex(/^BADGE-\d{3}$/),
  displayName: z.string().trim().max(60),
  requirementText: z.string().trim().max(240),
  xpReward: z.number().int().min(0).max(100000).nullable(),
  active: z.boolean(),
});

export const listBadgeSettingsAdmin = createServerFn({ method: "GET" })
  .middleware([superAdminMiddleware])
  .handler(async () => {
    const [effectiveBadges, earnedRows, audit] = await Promise.all([
      listEffectiveBadges(),
      db
        .select({
          badgeCode: studentBadges.badgeCode,
          count: sql<number>`count(*)::int`,
        })
        .from(studentBadges)
        .groupBy(studentBadges.badgeCode),
      listSettingsAudit("admin_badge_settings_updated"),
    ]);
    const earnedCountByCode = new Map(earnedRows.map((row) => [row.badgeCode, Number(row.count)]));

    return {
      badges: effectiveBadges.map((badge) => ({
        code: badge.code,
        icon: badge.icon,
        category: badge.category,
        catalogName: badge.name,
        displayName: badge.displayName,
        catalogRequirement: getBadgeRequirementText(badge),
        requirementText: badge.requirementText,
        requirementOverride: badge.requirementOverride,
        xpReward: badge.xpReward,
        defaultXpReward: badge.defaultXpReward,
        permanentXpBonusPercent: badge.permanentXpBonusPercent ?? null,
        active: badge.active,
        canDeactivate: canDeactivateBadge(badge),
        earnedCount: earnedCountByCode.get(badge.code) ?? 0,
      })),
      audit,
    };
  });

export const updateBadgeSettingsAdmin = createServerFn({ method: "POST" })
  .middleware([superAdminMiddleware])
  .inputValidator((input) => parseInput(badgeSettingsSchema, input))
  .handler(async ({ data, context }) => {
    const badge = (await listEffectiveBadges()).find((item) => item.code === data.badgeCode);

    if (!badge) throw notFound("Badge was not found.");

    if (!data.active && !canDeactivateBadge(badge)) {
      throw badRequest("Badges with a permanent EXP bonus cannot be turned off.");
    }

    // Values equal to the catalog are stored as null so a later catalog change still applies.
    const next = {
      displayName: data.displayName && data.displayName !== badge.name ? data.displayName : null,
      requirementText: data.requirementText && data.requirementText !== getBadgeRequirementText(badge) ? data.requirementText : null,
      xpReward: data.xpReward !== null && data.xpReward !== badge.defaultXpReward ? data.xpReward : null,
      active: data.active,
    };

    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          displayName: badgeSettings.displayName,
          requirementText: badgeSettings.requirementText,
          xpReward: badgeSettings.xpReward,
          active: badgeSettings.active,
        })
        .from(badgeSettings)
        .where(eq(badgeSettings.badgeCode, data.badgeCode))
        .for("update");
      const before = current ?? { displayName: null, requirementText: null, xpReward: null, active: true };
      const changes: SettingsAuditChange[] = (Object.keys(next) as Array<keyof typeof next>)
        .filter((field) => before[field] !== next[field])
        .map((field) => ({ field, before: before[field], after: next[field] }));

      if (changes.length === 0) return;

      const values = {
        ...next,
        updatedByAdminUserId: context.viewer.sessionUserId,
        updatedAt: new Date(),
      };

      await tx
        .insert(badgeSettings)
        .values({ badgeCode: data.badgeCode, ...values })
        .onConflictDoUpdate({ target: badgeSettings.badgeCode, set: values });

      await recordSettingsAudit(tx, {
        eventType: "admin_badge_settings_updated",
        admin: context.viewer,
        subject: `${data.badgeCode} ${badge.name}`,
        changes,
      });
    });

    return { ok: true };
  });

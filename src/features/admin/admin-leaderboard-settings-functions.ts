import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { leaderboardSettings, user } from "../../lib/db/schema";
import { parseInput } from "../../lib/http/validation";
import { getWeeklyParticipantThreshold } from "../leaderboard/leaderboard";
import { DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD } from "../leaderboard/leaderboard-settings";
import { adminMiddleware } from "./admin-access";
import { listSettingsAudit, recordSettingsAudit } from "./admin-settings-audit";

const SETTINGS_ROW_ID = "default";

// null removes the Admin value so the env var or default applies again.
const leaderboardSettingsSchema = z.object({
  participantThreshold: z.number().int().min(1).max(10000).nullable(),
});

export const getLeaderboardSettingsAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const [setting] = await db
      .select({
        participantThreshold: leaderboardSettings.participantThreshold,
        updatedAt: leaderboardSettings.updatedAt,
        updatedByEmail: user.email,
      })
      .from(leaderboardSettings)
      .leftJoin(user, eq(user.id, leaderboardSettings.updatedByAdminUserId))
      .limit(1);
    const effective = await getWeeklyParticipantThreshold();
    const envValue = process.env.WEEKLY_LEADERBOARD_PARTICIPANT_THRESHOLD?.trim() || null;

    return {
      effective,
      adminValue: setting?.participantThreshold ?? null,
      adminUpdatedAt: setting?.updatedAt.toISOString() ?? null,
      adminUpdatedByEmail: setting?.updatedByEmail ?? null,
      envValue,
      defaultValue: DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD,
      audit: await listSettingsAudit("admin_leaderboard_settings_updated"),
    };
  });

export const updateLeaderboardSettingsAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(leaderboardSettingsSchema, input))
  .handler(async ({ data, context }) => {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ participantThreshold: leaderboardSettings.participantThreshold })
        .from(leaderboardSettings)
        .where(eq(leaderboardSettings.id, SETTINGS_ROW_ID))
        .for("update");
      const before = current?.participantThreshold ?? null;

      if (before === data.participantThreshold) return;

      if (data.participantThreshold === null) {
        await tx.delete(leaderboardSettings).where(eq(leaderboardSettings.id, SETTINGS_ROW_ID));
      } else {
        const values = {
          participantThreshold: data.participantThreshold,
          updatedByAdminUserId: context.viewer.sessionUserId,
          updatedAt: new Date(),
        };

        await tx
          .insert(leaderboardSettings)
          .values({ id: SETTINGS_ROW_ID, ...values })
          .onConflictDoUpdate({ target: leaderboardSettings.id, set: values });
      }

      await recordSettingsAudit(tx, {
        eventType: "admin_leaderboard_settings_updated",
        admin: context.viewer,
        subject: "Weekly participant threshold",
        changes: [{ field: "participantThreshold", before, after: data.participantThreshold }],
      });
    });

    return { ok: true };
  });

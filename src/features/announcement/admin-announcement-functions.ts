import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { dashboardAnnouncementDismissals, dashboardAnnouncements } from "../../lib/db/schema";
import { badRequest } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "../admin/admin-access";
import {
  announcementPlacements,
  isAnnouncementCtaUrl,
  isAnnouncementImageUrl,
  parseAnnouncementPlacement,
} from "./announcement-rules";

const announcementSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
  ctaLabel: z.string().trim().max(40).optional().nullable(),
  ctaUrl: z.string().trim().max(500).optional().nullable(),
  placement: z.enum(announcementPlacements),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  active: z.boolean(),
});

const announcementIdSchema = z.object({
  announcementId: z.string().trim().min(1),
});

export const listAnnouncementsAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const rows = await db
      .select({
        announcement: dashboardAnnouncements,
        dismissedCount: sql<number>`(
          select count(*) from ${dashboardAnnouncementDismissals}
          where ${dashboardAnnouncementDismissals.announcementId} = ${sql.identifier("dashboard_announcements")}.${dashboardAnnouncements.id}
        )`,
      })
      .from(dashboardAnnouncements)
      .orderBy(desc(dashboardAnnouncements.createdAt));

    return rows.map(({ announcement, dismissedCount }) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      imageUrl: announcement.imageUrl,
      ctaLabel: announcement.ctaLabel,
      ctaUrl: announcement.ctaUrl,
      placement: parseAnnouncementPlacement(announcement.placement),
      startsAt: announcement.startsAt.toISOString(),
      endsAt: announcement.endsAt.toISOString(),
      active: announcement.active,
      dismissedCount: Number(dismissedCount),
      createdAt: announcement.createdAt.toISOString(),
    }));
  });

export const saveAnnouncementAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(announcementSchema, input))
  .handler(async ({ data }) => {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    const imageUrl = data.imageUrl || null;
    const ctaLabel = data.ctaLabel || null;
    const ctaUrl = data.ctaUrl || null;

    if (endsAt <= startsAt) {
      throw badRequest("Announcement end time must be after start time.");
    }

    if (Boolean(ctaLabel) !== Boolean(ctaUrl)) {
      throw badRequest("Fill both the button label and link, or leave both empty.");
    }

    if (imageUrl && !isAnnouncementImageUrl(imageUrl)) {
      throw badRequest("Image link must start with /, http://, or https://.");
    }

    if (ctaUrl && !isAnnouncementCtaUrl(ctaUrl)) {
      throw badRequest("Button link must start with / or https://.");
    }

    const values = {
      title: data.title,
      body: data.body,
      imageUrl,
      ctaLabel,
      ctaUrl,
      placement: data.placement,
      startsAt,
      endsAt,
      active: data.active,
      updatedAt: new Date(),
    };

    await db.transaction(async (tx) => {
      if (data.active) {
        await disableOtherAnnouncements(tx, data.id);
      }

      if (data.id) {
        await tx.update(dashboardAnnouncements).set(values).where(eq(dashboardAnnouncements.id, data.id));
        return;
      }

      await tx.insert(dashboardAnnouncements).values(values);
    });

    return { ok: true };
  });

export const setAnnouncementActiveAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(announcementIdSchema.extend({ active: z.boolean() }), input))
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      if (data.active) {
        await disableOtherAnnouncements(tx, data.announcementId);
      }

      await tx
        .update(dashboardAnnouncements)
        .set({ active: data.active, updatedAt: new Date() })
        .where(eq(dashboardAnnouncements.id, data.announcementId));
    });

    return { ok: true };
  });

export const deleteAnnouncementAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(announcementIdSchema, input))
  .handler(async ({ data }) => {
    await db.delete(dashboardAnnouncements).where(eq(dashboardAnnouncements.id, data.announcementId));

    return { ok: true };
  });

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Only one announcement may be enabled at a time, so enabling one turns the others off.
async function disableOtherAnnouncements(tx: Transaction, keepId?: string) {
  const otherActive = keepId
    ? and(eq(dashboardAnnouncements.active, true), ne(dashboardAnnouncements.id, keepId))
    : eq(dashboardAnnouncements.active, true);

  await tx
    .update(dashboardAnnouncements)
    .set({ active: false, updatedAt: new Date() })
    .where(otherActive);
}

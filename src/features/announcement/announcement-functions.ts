import { createServerFn } from "@tanstack/react-start";
import { and, eq, gt, inArray, lte, notExists } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { dashboardAnnouncementDismissals, dashboardAnnouncements } from "../../lib/db/schema";
import { parseInput } from "../../lib/http/validation";
import { getStudentViewer } from "../student/student-viewer.server";
import { getPlacementsForSurface, type AnnouncementSurface } from "./announcement-rules";

export type LiveAnnouncement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

const dismissSchema = z.object({
  announcementId: z.string().trim().min(1),
});

// Landing visitors may be signed out, so their dismissal is remembered in the browser instead.
export const getLandingAnnouncement = createServerFn({ method: "GET" }).handler(async () => {
  return findLiveAnnouncement("landing");
});

export const getStudentAnnouncement = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();

  return findLiveAnnouncement("app", viewer.userId);
});

export const dismissStudentAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(dismissSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    // An Admin viewing as a Student should not hide the announcement for that Student.
    if (viewer.impersonation) return { ok: true };

    await db
      .insert(dashboardAnnouncementDismissals)
      .values({ announcementId: data.announcementId, studentUserId: viewer.userId })
      .onConflictDoNothing();

    return { ok: true };
  });

async function findLiveAnnouncement(surface: AnnouncementSurface, studentUserId?: string): Promise<LiveAnnouncement | null> {
  const now = new Date();
  const notDismissed = studentUserId
    ? notExists(
        db
          .select({ id: dashboardAnnouncementDismissals.id })
          .from(dashboardAnnouncementDismissals)
          .where(and(
            eq(dashboardAnnouncementDismissals.announcementId, dashboardAnnouncements.id),
            eq(dashboardAnnouncementDismissals.studentUserId, studentUserId),
          )),
      )
    : undefined;

  const [announcement] = await db
    .select({
      id: dashboardAnnouncements.id,
      title: dashboardAnnouncements.title,
      body: dashboardAnnouncements.body,
      imageUrl: dashboardAnnouncements.imageUrl,
      ctaLabel: dashboardAnnouncements.ctaLabel,
      ctaUrl: dashboardAnnouncements.ctaUrl,
    })
    .from(dashboardAnnouncements)
    .where(and(
      eq(dashboardAnnouncements.active, true),
      lte(dashboardAnnouncements.startsAt, now),
      gt(dashboardAnnouncements.endsAt, now),
      inArray(dashboardAnnouncements.placement, getPlacementsForSurface(surface)),
      notDismissed,
    ))
    .limit(1);

  return announcement ?? null;
}

import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { studentBadges } from "../../lib/db/schema";
import { parseInput } from "../../lib/http/validation";
import { getStudentViewer } from "../student/student-viewer.server";
import { listEffectiveBadges } from "./engagement-surface";

const MAX_UNSEEN_BADGES = 20;

const markBadgesSeenSchema = z.object({
  studentBadgeIds: z.array(z.string().trim().min(1)).min(1).max(MAX_UNSEEN_BADGES),
});

// Badges the Student has not acknowledged yet. An Admin impersonating a Student
// gets none, so the Student still sees the celebration on their own next visit.
export const listUnseenStudentBadges = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();

  if (viewer.impersonation) return [];

  const rows = await db
    .select({
      id: studentBadges.id,
      badgeCode: studentBadges.badgeCode,
      awardSource: studentBadges.awardSource,
      sourceWeekKey: studentBadges.sourceWeekKey,
      rewardXp: studentBadges.rewardXp,
      metadata: studentBadges.metadata,
    })
    .from(studentBadges)
    .where(and(
      eq(studentBadges.studentUserId, viewer.userId),
      isNull(studentBadges.seenAt),
    ))
    .orderBy(asc(studentBadges.awardedAt))
    .limit(MAX_UNSEEN_BADGES);
  const badgeByCode = new Map((await listEffectiveBadges()).map((badge) => [badge.code, badge]));

  return rows.map((row) => ({
    id: row.id,
    badgeCode: row.badgeCode,
    awardSource: row.awardSource,
    sourceWeekKey: row.sourceWeekKey,
    rewardXp: row.rewardXp,
    rank: getMetadataRank(row.metadata),
    badge: getBadgeDisplay(badgeByCode.get(row.badgeCode)),
  }));
});

export const markStudentBadgesSeen = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(markBadgesSeenSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    if (viewer.impersonation) return { ok: true };

    await db
      .update(studentBadges)
      .set({ seenAt: new Date() })
      .where(and(
        eq(studentBadges.studentUserId, viewer.userId),
        inArray(studentBadges.id, data.studentBadgeIds),
        isNull(studentBadges.seenAt),
      ));

    return { ok: true };
  });

// Retired Badge codes have no display, so the popup skips them.
function getBadgeDisplay(badge: Awaited<ReturnType<typeof listEffectiveBadges>>[number] | undefined) {
  if (!badge) return null;

  return {
    icon: badge.icon,
    displayName: badge.displayName,
    requirementText: badge.requirementText,
  };
}

function getMetadataRank(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  if (!("rank" in metadata)) return null;

  return typeof metadata.rank === "number" ? metadata.rank : null;
}

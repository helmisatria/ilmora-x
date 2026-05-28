import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { resolveAvatarDisplay } from "../../lib/avatar";
import { db } from "../../lib/db/client";
import {
  attempts,
  studentBadges,
  studentExpLedger,
  studentProfiles,
  user,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { badgeCodeToId, calculateCurrentStreak } from "../engagement-surface/engagement-surface";
import { getStudentViewer } from "../student/student-viewer.server";

const studentUserIdSchema = z.object({
  studentUserId: z.string().trim().min(1),
});

export const getPublicStudentProfile = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(studentUserIdSchema, input))
  .handler(async ({ data }) => {
    await getStudentViewer();

    const [profile] = await db
      .select({
        userId: user.id,
        name: user.name,
        image: user.image,
        joinedAt: user.createdAt,
        avatar: studentProfiles.avatar,
        displayName: studentProfiles.displayName,
        institution: studentProfiles.institution,
        photoUrl: studentProfiles.photoUrl,
      })
      .from(user)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
      .where(eq(user.id, data.studentUserId))
      .limit(1);

    if (!profile) {
      throw notFound("Student profile was not found.");
    }

    const submittedAttempts = await db
      .select({
        submittedAt: attempts.submittedAt,
        totalQuestions: attempts.totalQuestions,
        correctCount: attempts.correctCount,
        xpEarned: attempts.xpEarned,
      })
      .from(attempts)
      .where(and(
        eq(attempts.studentUserId, data.studentUserId),
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      ));

    const [badgeRewardRow] = await db
      .select({
        xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
      })
      .from(studentExpLedger)
      .where(and(
        eq(studentExpLedger.studentUserId, data.studentUserId),
        eq(studentExpLedger.sourceType, "badge_reward"),
      ));
    const badgeRows = await db
      .select({ badgeCode: studentBadges.badgeCode })
      .from(studentBadges)
      .where(eq(studentBadges.studentUserId, data.studentUserId));

    const attemptXp = submittedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
    const xp = attemptXp + Number(badgeRewardRow?.xp ?? 0);

    const avatar = resolveAvatarDisplay({
      avatar: profile.avatar,
      photoUrl: profile.photoUrl,
      googlePhotoUrl: profile.image,
      fallbackName: profile.displayName || profile.name,
    });

    return {
      userId: profile.userId,
      name: profile.displayName || profile.name,
      institution: profile.institution ?? "Belum diisi",
      avatar: avatar.avatar,
      photoUrl: avatar.photoUrl,
      joinedAt: profile.joinedAt.toISOString(),
      xp,
      awardedBadgeIds: badgeRows
        .map((badge) => badgeCodeToId(badge.badgeCode))
        .filter((badgeId): badgeId is number => badgeId !== null),
      streak: calculateCurrentStreak(submittedAttempts.map((attempt) => attempt.submittedAt)),
      totalQuestions: submittedAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0),
      totalCorrect: submittedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0),
      totalTryouts: submittedAttempts.length,
    };
  });

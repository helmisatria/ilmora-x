import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, asc, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { resolveAvatarDisplay } from "./avatar";
import { getCurrentViewerFromHeaders } from "./auth-functions";
import { badges } from "../data/badges";
import { getLevelForXp } from "../data/levels";
import { db } from "./db/client";
import {
  activityEvents,
  adminMembers,
  attemptAnswers,
  attemptMarkedQuestions,
  attemptQuestionSnapshots,
  attempts,
  categories,
  materi,
  questionReports,
  questions,
  subCategories,
  studentBadges,
  studentExpLedger,
  studentProfiles,
  tryoutQuestions,
  tryouts,
  user,
} from "./db/schema";
import { assertActiveStudent, assertAttemptOwner } from "./domain/access";
import { getJakartaWeekStartDateKey, getJakartaWeekWindow } from "./domain/leaderboard";
import { conflict, notFound } from "./http/errors";
import { parseInput } from "./http/validation";

const optionLetters = ["A", "B", "C", "D", "E"] as const;
const DEFAULT_DAILY_TRYOUT_ATTEMPT_LIMIT = 3;

const tryoutIdSchema = z.object({
  tryoutId: z.string().trim().min(1),
});

const attemptIdSchema = z.object({
  attemptId: z.string().trim().min(1),
});

const studentUserIdSchema = z.object({
  studentUserId: z.string().trim().min(1),
});

const saveAttemptSchema = z.object({
  attemptId: z.string().trim().min(1),
  lastQuestionIndex: z.number().int().min(0).max(1000),
  answers: z.array(z.object({
    snapshotId: z.string().trim().min(1),
    selectedOption: z.enum(optionLetters).nullable(),
  })).max(500),
  markedSnapshotIds: z.array(z.string().trim().min(1)).max(500),
});

const submitAttemptSchema = saveAttemptSchema.extend({
  autoSubmitReason: z.string().trim().max(120).optional(),
});

const reportQuestionSchema = z.object({
  attemptId: z.string().trim().min(1),
  snapshotId: z.string().trim().min(1),
  reason: z.enum(["answer_key_wrong", "explanation_wrong", "question_unclear", "typo", "other"]),
  note: z.string().trim().max(1000).optional(),
});

async function getStudentViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  return assertActiveStudent(viewer);
}

function getImpersonationMetadata(viewer: Awaited<ReturnType<typeof getStudentViewer>>) {
  if (!viewer.impersonation) return {};

  return {
    impersonatedByAdminUserId: viewer.impersonation.adminUserId,
    impersonatedByAdminEmail: viewer.impersonation.adminEmail,
  };
}

function toOptionIndex(option: string | null) {
  if (!option) return null;

  const index = optionLetters.findIndex((letter) => letter === option);

  if (index < 0) return null;

  return index;
}

function toOptions(row: {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | null;
}) {
  const options = [row.optionA, row.optionB, row.optionC, row.optionD];

  if (row.optionE) {
    options.push(row.optionE);
  }

  return options;
}

function calculateXp(correctCount: number, attemptNumber: number) {
  const baseXp = 50 + correctCount * 20;

  if (attemptNumber === 1) return baseXp;

  return Math.round(baseXp * 0.25);
}

function calculateAttemptXp({
  correctCount,
  attemptNumber,
  isExtraPractice,
}: {
  correctCount: number;
  attemptNumber: number;
  isExtraPractice: boolean;
}) {
  if (isExtraPractice) return 0;

  return calculateXp(correctCount, attemptNumber);
}

function getJakartaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function calculateCurrentStreak(submittedDates: Array<Date | null>) {
  const submittedDayKeys = new Set(
    submittedDates
      .filter((date): date is Date => date !== null)
      .map(getJakartaDateKey),
  );

  if (submittedDayKeys.size === 0) return 0;

  const cursor = new Date();
  const todayKey = getJakartaDateKey(cursor);

  if (!submittedDayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);

    const yesterdayKey = getJakartaDateKey(cursor);

    if (!submittedDayKeys.has(yesterdayKey)) return 0;
  }

  let streak = 0;

  for (;;) {
    const dayKey = getJakartaDateKey(cursor);

    if (!submittedDayKeys.has(dayKey)) return streak;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
}

function badgeIdToCode(badgeId: number) {
  return `BADGE-${String(badgeId).padStart(3, "0")}`;
}

function badgeCodeToId(badgeCode: string) {
  const match = badgeCode.match(/^BADGE-(\d+)$/);

  if (!match) return null;

  return Number(match[1]);
}

function getStartOfJakartaWeekSql() {
  return sql`date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
}

function getStartOfJakartaDaySql() {
  return sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
}

function getDailyTryoutAttemptLimit() {
  const configuredLimit = Number(process.env.DAILY_TRYOUT_ATTEMPT_LIMIT);

  if (!Number.isInteger(configuredLimit)) return DEFAULT_DAILY_TRYOUT_ATTEMPT_LIMIT;
  if (configuredLimit < 1) return DEFAULT_DAILY_TRYOUT_ATTEMPT_LIMIT;

  return configuredLimit;
}

async function countTodayTryoutAttempts(studentUserId: string, tryoutId: string) {
  const dayStart = getStartOfJakartaDaySql();
  const dayEnd = sql`${dayStart} + interval '1 day'`;

  const [row] = await db
    .select({
      count: sql<number>`count(${attempts.id})`,
    })
    .from(attempts)
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      eq(attempts.tryoutId, tryoutId),
      gte(attempts.startedAt, dayStart),
      lt(attempts.startedAt, dayEnd),
    ));

  return Number(row?.count ?? 0);
}

function hasExtendedPracticeAccess(accessLevel: string) {
  if (accessLevel === "free") return false;

  return true;
}

function getVisibleDailyAttemptLimit(hasExtendedPractice: boolean, dailyAttemptLimit: number) {
  if (hasExtendedPractice) return null;

  return dailyAttemptLimit;
}

async function isExtraPracticeAttempt(attempt: typeof attempts.$inferSelect, dailyAttemptLimit: number) {
  const dayStart = sql`date_trunc('day', ${attempt.startedAt} at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
  const dayEnd = sql`${dayStart} + interval '1 day'`;

  const [row] = await db
    .select({
      count: sql<number>`count(${attempts.id})`,
    })
    .from(attempts)
    .where(and(
      eq(attempts.studentUserId, attempt.studentUserId),
      eq(attempts.tryoutId, attempt.tryoutId),
      gte(attempts.startedAt, dayStart),
      lt(attempts.startedAt, dayEnd),
      lte(attempts.startedAt, attempt.startedAt),
    ));

  return Number(row?.count ?? 0) > dailyAttemptLimit;
}

async function getAttemptForStudent(attemptId: string) {
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);

  if (attempt) return attempt;

  throw notFound("Attempt was not found.");
}

async function ensureAttemptCanBeEdited(attemptId: string, studentUserId: string) {
  const attempt = await getAttemptForStudent(attemptId);

  if (attempt.studentUserId !== studentUserId) {
    throw notFound("Attempt was not found.");
  }

  if (attempt.status !== "in_progress") {
    throw conflict("Attempt has already been submitted.");
  }

  return attempt;
}

async function saveAttemptProgress(
  attemptId: string,
  data: z.infer<typeof saveAttemptSchema>,
) {
  const snapshots = await db
    .select({
      id: attemptQuestionSnapshots.id,
      correctOption: attemptQuestionSnapshots.correctOption,
    })
    .from(attemptQuestionSnapshots)
    .where(eq(attemptQuestionSnapshots.attemptId, attemptId));
  const snapshotIds = new Set(snapshots.map((snapshot) => snapshot.id));

  for (const answer of data.answers) {
    if (!snapshotIds.has(answer.snapshotId)) {
      throw conflict("Answer references a Question outside this Attempt.");
    }
  }

  for (const snapshotId of data.markedSnapshotIds) {
    if (!snapshotIds.has(snapshotId)) {
      throw conflict("Marked Question is outside this Attempt.");
    }
  }

  await db.transaction(async (tx) => {
    for (const answer of data.answers) {
      const snapshot = snapshots.find((item) => item.id === answer.snapshotId);
      const isCorrect = answer.selectedOption
        ? snapshot?.correctOption === answer.selectedOption
        : null;

      await tx
        .insert(attemptAnswers)
        .values({
          attemptId,
          snapshotId: answer.snapshotId,
          selectedOption: answer.selectedOption,
          isCorrect,
          answeredAt: answer.selectedOption ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [attemptAnswers.attemptId, attemptAnswers.snapshotId],
          set: {
            selectedOption: answer.selectedOption,
            isCorrect,
            answeredAt: answer.selectedOption ? new Date() : null,
            updatedAt: new Date(),
          },
        });
    }

    await tx
      .delete(attemptMarkedQuestions)
      .where(eq(attemptMarkedQuestions.attemptId, attemptId));

    if (data.markedSnapshotIds.length > 0) {
      await tx.insert(attemptMarkedQuestions).values(
        data.markedSnapshotIds.map((snapshotId) => ({
          attemptId,
          snapshotId,
        })),
      );
    }

    await tx
      .update(attempts)
      .set({
        lastQuestionIndex: data.lastQuestionIndex,
        lastServerSavedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(attempts.id, attemptId));
  });
}

async function awardBadgeReward({
  studentUserId,
  badgeId,
  rewardXp,
  metadata,
}: {
  studentUserId: string;
  badgeId: number;
  rewardXp: number;
  metadata: Record<string, unknown>;
}) {
  return db.transaction(async (tx) => {
    const badgeCode = badgeIdToCode(badgeId);
    const [badge] = await tx
      .insert(studentBadges)
      .values({
        studentUserId,
        badgeCode,
        awardSource: "daily_evaluation",
        rewardXp,
        metadata,
      })
      .onConflictDoNothing({
        target: [studentBadges.studentUserId, studentBadges.badgeCode],
      })
      .returning({ id: studentBadges.id });

    if (!badge) return null;
    if (rewardXp <= 0) return { badgeId, rewardXp: 0 };

    await tx
      .insert(studentExpLedger)
      .values({
        studentUserId,
        sourceType: "badge_reward",
        sourceId: badge.id,
        xpAmount: rewardXp,
        metadata: {
          badgeCode,
          ...metadata,
        },
      })
      .onConflictDoNothing({
        target: [studentExpLedger.sourceType, studentExpLedger.sourceId],
      });

    return { badgeId, rewardXp };
  });
}

async function awardDailyBadges(studentUserId: string) {
  const submittedAttempts = await db
    .select({
      id: attempts.id,
      tryoutId: attempts.tryoutId,
      submittedAt: attempts.submittedAt,
      deadlineAt: attempts.deadlineAt,
      score: attempts.score,
      correctCount: attempts.correctCount,
      totalQuestions: attempts.totalQuestions,
      xpEarned: attempts.xpEarned,
      autoSubmitReason: attempts.autoSubmitReason,
    })
    .from(attempts)
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ));

  if (submittedAttempts.length === 0) return [];

  const [badgeRewardRow] = await db
    .select({
      xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
    })
    .from(studentExpLedger)
    .where(and(
      eq(studentExpLedger.studentUserId, studentUserId),
      eq(studentExpLedger.sourceType, "badge_reward"),
    ));
  const awardedBadgeRows = await db
    .select({ badgeCode: studentBadges.badgeCode })
    .from(studentBadges)
    .where(eq(studentBadges.studentUserId, studentUserId));

  const awardedBadgeIds = new Set(
    awardedBadgeRows
      .map((badge) => badgeCodeToId(badge.badgeCode))
      .filter((badgeId): badgeId is number => badgeId !== null),
  );
  const totalQuestions = submittedAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const totalCorrect = submittedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0);
  const attemptXp = submittedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
  let totalXp = attemptXp + Number(badgeRewardRow?.xp ?? 0);
  const awardedBadges: Array<{ badgeId: number; rewardXp: number }> = [];

  for (;;) {
    const eligibleBadge = getNextEligibleDailyBadge({
      awardedBadgeIds,
      submittedAttempts,
      totalQuestions,
      totalCorrect,
      totalXp,
    });

    if (!eligibleBadge) return awardedBadges;

    const awardedBadge = await awardBadgeReward({
      studentUserId,
      badgeId: eligibleBadge.id,
      rewardXp: eligibleBadge.xpReward,
      metadata: {
        badgeName: eligibleBadge.name,
        awardReason: eligibleBadge.task,
      },
    });

    awardedBadgeIds.add(eligibleBadge.id);

    if (!awardedBadge) continue;

    totalXp += awardedBadge.rewardXp;
    awardedBadges.push(awardedBadge);
  }
}

function getNextEligibleDailyBadge({
  awardedBadgeIds,
  submittedAttempts,
  totalQuestions,
  totalCorrect,
  totalXp,
}: {
  awardedBadgeIds: Set<number>;
  submittedAttempts: Array<{
    tryoutId: string;
    submittedAt: Date | null;
    deadlineAt: Date;
    score: number | null;
    totalQuestions: number;
    autoSubmitReason: string | null;
  }>;
  totalQuestions: number;
  totalCorrect: number;
  totalXp: number;
}) {
  const level = getLevelForXp(totalXp).level;
  const streak = calculateCurrentStreak(submittedAttempts.map((attempt) => attempt.submittedAt));
  const uniqueTryoutCount = new Set(submittedAttempts.map((attempt) => attempt.tryoutId)).size;
  const failedAttemptCount = submittedAttempts.filter((attempt) => (attempt.score ?? 0) < 70).length;
  const accuracy = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;
  const hasSpeedRunnerAttempt = submittedAttempts.some((attempt) => {
    if ((attempt.score ?? 0) <= 80) return false;
    if (!attempt.submittedAt) return false;
    if (attempt.autoSubmitReason) return false;

    return attempt.submittedAt <= attempt.deadlineAt;
  });
  const hasPerfectScoreAttempt = submittedAttempts.some((attempt) => (attempt.score ?? 0) >= 100);

  return badges.find((badge) => {
    if (awardedBadgeIds.has(badge.id)) return false;
    if (badge.task.toLowerCase().includes("leaderboard")) return false;

    const levelMatch = badge.task.match(/Reach Level (\d+)/i);
    const streakMatch = badge.task.match(/(\d+)[-\s]Days/i);
    const tryoutMatch = badge.task.match(/Complete (\d+) unique tryouts/i);

    if (badge.id === 1) return submittedAttempts.length > 0;
    if (levelMatch) return level >= Number(levelMatch[1]);
    if (streakMatch) return streak >= Number(streakMatch[1]);
    if (tryoutMatch) return uniqueTryoutCount >= Number(tryoutMatch[1]);
    if (badge.name === "Speed Runner") return hasSpeedRunnerAttempt;
    if (badge.name === "Fail Legend") return failedAttemptCount >= 5;
    if (badge.name === "100% Club") return hasPerfectScoreAttempt || accuracy >= 100;

    return false;
  }) ?? null;
}

export const listPublishedTryouts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      id: tryouts.id,
      title: tryouts.title,
      description: tryouts.description,
      categoryId: tryouts.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      durationMinutes: tryouts.durationMinutes,
      accessLevel: tryouts.accessLevel,
      questionCount: sql<number>`count(${tryoutQuestions.id})`,
    })
    .from(tryouts)
    .innerJoin(categories, eq(categories.id, tryouts.categoryId))
    .leftJoin(
      tryoutQuestions,
      and(
        eq(tryoutQuestions.tryoutId, tryouts.id),
        sql`${tryoutQuestions.questionId} in (select id from questions where status = 'published')`,
      ),
    )
    .where(eq(tryouts.status, "published"))
    .groupBy(
      tryouts.id,
      categories.id,
    )
    .orderBy(desc(tryouts.publishedAt), tryouts.title);

  return rows.map((row) => ({
    ...row,
    accessLevel: row.accessLevel as "free" | "premium" | "platinum",
    categoryColor: row.categoryColor ?? "#205072",
    questionCount: Number(row.questionCount ?? 0),
  }));
});

export const listLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();
  const viewerExcludedReason = viewer.admin ? "admin_account" : null;
  const weekStartDate = getJakartaWeekStartDateKey();
  const weekWindow = getJakartaWeekWindow(weekStartDate);
  const rewardsFinaliseAt = new Date(weekWindow.endsAt.getTime() + 5 * 60 * 1000);

  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      image: user.image,
      avatar: studentProfiles.avatar,
      displayName: studentProfiles.displayName,
      photoUrl: studentProfiles.photoUrl,
      xp: sql<number>`coalesce(sum(${attempts.xpEarned}), 0)`,
    })
    .from(attempts)
    .innerJoin(user, eq(user.id, attempts.studentUserId))
    .innerJoin(studentProfiles, eq(studentProfiles.userId, user.id))
    .where(and(
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      gte(attempts.submittedAt, weekWindow.startsAt),
      lt(attempts.submittedAt, weekWindow.endsAt),
      sql`${attempts.xpEarned} > 0`,
      eq(attempts.isImpersonatedSubmission, false),
      eq(studentProfiles.status, "active"),
      sql`not exists (
        select 1
        from ${adminMembers}
        where ${adminMembers.email} = ${user.email}
          and ${adminMembers.removedAt} is null
      )`,
    ))
    .groupBy(
      user.id,
      user.name,
      user.image,
      studentProfiles.id,
      studentProfiles.avatar,
      studentProfiles.displayName,
      studentProfiles.photoUrl,
    )
    .orderBy(
      desc(sql`coalesce(sum(${attempts.xpEarned}), 0)`),
      asc(sql`max(${attempts.submittedAt})`),
      asc(user.id),
    )
    .limit(50);

  const entries = rows.map((row, index) => {
    const xp = Number(row.xp ?? 0);
    const avatar = resolveAvatarDisplay({
      avatar: row.avatar,
      photoUrl: row.photoUrl,
      googlePhotoUrl: row.image,
      fallbackName: row.displayName || row.name,
    });

    return {
      rank: index + 1,
      userId: row.userId,
      name: row.displayName || row.name,
      avatar: avatar.avatar,
      photoUrl: avatar.photoUrl,
      xp,
      me: row.userId === viewer.userId,
    };
  });

  return {
    entries,
    week: {
      weekStartDate,
      startsAt: weekWindow.startsAt.toISOString(),
      endsAt: weekWindow.endsAt.toISOString(),
      rewardsFinaliseAt: rewardsFinaliseAt.toISOString(),
    },
    viewerExcludedReason,
  };
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

export const getTryoutPreparation = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    const [tryout] = await db
      .select({
        id: tryouts.id,
        title: tryouts.title,
        description: tryouts.description,
        categoryId: tryouts.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        durationMinutes: tryouts.durationMinutes,
        accessLevel: tryouts.accessLevel,
        questionCount: sql<number>`count(${tryoutQuestions.id})`,
      })
      .from(tryouts)
      .innerJoin(categories, eq(categories.id, tryouts.categoryId))
      .leftJoin(tryoutQuestions, eq(tryoutQuestions.tryoutId, tryouts.id))
      .where(and(eq(tryouts.id, data.tryoutId), eq(tryouts.status, "published")))
      .groupBy(tryouts.id, categories.id)
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    const dailyAttemptLimit = getDailyTryoutAttemptLimit();
    const attemptsToday = await countTodayTryoutAttempts(viewer.userId, data.tryoutId);
    const hasExtendedPractice = hasExtendedPracticeAccess(tryout.accessLevel);
    const [activeAttempt] = await db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(
        eq(attempts.studentUserId, viewer.userId),
        eq(attempts.tryoutId, data.tryoutId),
        eq(attempts.status, "in_progress"),
      ))
      .limit(1);

    return {
      ...tryout,
      accessLevel: tryout.accessLevel as "free" | "premium" | "platinum",
      categoryColor: tryout.categoryColor ?? "#205072",
      questionCount: Number(tryout.questionCount ?? 0),
      activeAttemptId: activeAttempt?.id ?? null,
      attemptsToday,
      dailyAttemptLimit: getVisibleDailyAttemptLimit(hasExtendedPractice, dailyAttemptLimit),
      normalDailyAttemptLimit: dailyAttemptLimit,
      hasExtendedPractice,
    };
  });

export const startOrResumeAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    const [existingAttempt] = await db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(
        eq(attempts.studentUserId, viewer.userId),
        eq(attempts.tryoutId, data.tryoutId),
        eq(attempts.status, "in_progress"),
      ))
      .limit(1);

    if (existingAttempt) {
      return getTakeAttemptData(existingAttempt.id);
    }

    const [tryout] = await db
      .select({
        id: tryouts.id,
        durationMinutes: tryouts.durationMinutes,
        accessLevel: tryouts.accessLevel,
      })
      .from(tryouts)
      .where(and(eq(tryouts.id, data.tryoutId), eq(tryouts.status, "published")))
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    const dailyAttemptLimit = getDailyTryoutAttemptLimit();
    const attemptsToday = await countTodayTryoutAttempts(viewer.userId, data.tryoutId);
    const hasExtendedPractice = hasExtendedPracticeAccess(tryout.accessLevel);

    if (!hasExtendedPractice && attemptsToday >= dailyAttemptLimit) {
      throw conflict(`Batas pengerjaan harian tercapai. Try-out yang sama hanya bisa dikerjakan ${dailyAttemptLimit} kali per hari.`);
    }

    const questionRows = await db
      .select({
        questionId: questions.id,
        sortOrder: tryoutQuestions.sortOrder,
        categoryId: questions.categoryId,
        subCategoryId: questions.subCategoryId,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        optionE: questions.optionE,
        correctOption: questions.correctOption,
        explanation: questions.explanation,
        videoUrl: questions.videoUrl,
        accessLevel: questions.accessLevel,
      })
      .from(tryoutQuestions)
      .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
      .where(and(eq(tryoutQuestions.tryoutId, data.tryoutId), eq(questions.status, "published")))
      .orderBy(tryoutQuestions.sortOrder);

    if (questionRows.length === 0) {
      throw conflict("This Try-out has no published Questions yet.");
    }

    const [lastAttempt] = await db
      .select({ attemptNumber: attempts.attemptNumber })
      .from(attempts)
      .where(and(eq(attempts.studentUserId, viewer.userId), eq(attempts.tryoutId, data.tryoutId)))
      .orderBy(desc(attempts.attemptNumber))
      .limit(1);
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + tryout.durationMinutes * 60 * 1000);

    const createdAttemptId = await db.transaction(async (tx) => {
      const [createdAttempt] = await tx
        .insert(attempts)
        .values({
          studentUserId: viewer.userId,
          tryoutId: data.tryoutId,
          attemptNumber,
          status: "in_progress",
          startedAt,
          deadlineAt,
          totalQuestions: questionRows.length,
        })
        .returning({ id: attempts.id });

      await tx.insert(attemptQuestionSnapshots).values(
        questionRows.map((question) => ({
          attemptId: createdAttempt.id,
          questionId: question.questionId,
          sortOrder: question.sortOrder,
          categoryId: question.categoryId,
          subCategoryId: question.subCategoryId,
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          optionE: question.optionE,
          correctOption: question.correctOption,
          explanation: question.explanation,
          videoUrl: question.videoUrl,
          accessLevel: question.accessLevel,
        })),
      );

      await tx.insert(activityEvents).values({
        studentUserId: viewer.userId,
        eventType: "tryout_started",
        metadata: {
          tryoutId: data.tryoutId,
          attemptId: createdAttempt.id,
          ...getImpersonationMetadata(viewer),
        },
      });

      return createdAttempt.id;
    });

    return getTakeAttemptData(createdAttemptId);
  });

export const saveAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(saveAttemptSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    await ensureAttemptCanBeEdited(data.attemptId, viewer.userId);
    await saveAttemptProgress(data.attemptId, data);

    return { ok: true, savedAt: new Date().toISOString() };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(submitAttemptSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();
    const attempt = await ensureAttemptCanBeEdited(data.attemptId, viewer.userId);

    await saveAttemptProgress(data.attemptId, data);

    const answerRows = await db
      .select({
        isCorrect: attemptAnswers.isCorrect,
      })
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, data.attemptId));
    const correctCount = answerRows.filter((answer) => answer.isCorrect).length;
    const answeredCount = answerRows.filter((answer) => answer.isCorrect !== null).length;
    const wrongCount = Math.max(attempt.totalQuestions - correctCount, 0);
    const score = Math.round((correctCount / attempt.totalQuestions) * 100);
    const [tryout] = await db
      .select({ accessLevel: tryouts.accessLevel })
      .from(tryouts)
      .where(eq(tryouts.id, attempt.tryoutId))
      .limit(1);
    const dailyAttemptLimit = getDailyTryoutAttemptLimit();
    const hasExtendedPractice = hasExtendedPracticeAccess(tryout?.accessLevel ?? "free");
    const extraPracticeAttempt = hasExtendedPractice
      ? await isExtraPracticeAttempt(attempt, dailyAttemptLimit)
      : false;
    const isImpersonatedSubmission = Boolean(viewer.impersonation);
    const xpEarned = isImpersonatedSubmission
      ? 0
      : calculateAttemptXp({
          correctCount,
          attemptNumber: attempt.attemptNumber,
          isExtraPractice: extraPracticeAttempt,
        });
    const now = new Date();
    const timedOut = now > attempt.deadlineAt;
    const status = timedOut || data.autoSubmitReason ? "auto_submitted" : "submitted";

    await db.transaction(async (tx) => {
      await tx
        .update(attempts)
        .set({
          status,
          submittedAt: now,
          score,
          correctCount,
          wrongCount,
          xpEarned,
          submittedByAdminUserId: viewer.impersonation?.adminUserId ?? null,
          isImpersonatedSubmission,
          autoSubmitReason: data.autoSubmitReason ?? (timedOut ? "deadline_reached" : null),
          updatedAt: now,
        })
        .where(eq(attempts.id, data.attemptId));

      await tx.insert(activityEvents).values({
        studentUserId: viewer.userId,
        eventType: "tryout_submitted",
        metadata: {
          tryoutId: attempt.tryoutId,
          attemptId: data.attemptId,
          correctCount,
          answeredCount,
          totalQuestions: attempt.totalQuestions,
          score,
          ...getImpersonationMetadata(viewer),
        },
      });
    });

    const awardedBadges = isImpersonatedSubmission
      ? []
      : await awardDailyBadges(viewer.userId);

    return {
      attemptId: data.attemptId,
      score,
      correctCount,
      totalQuestions: attempt.totalQuestions,
      xpEarned,
      awardedBadges,
    };
  });

export const reportAttemptQuestion = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(reportQuestionSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();
    const attempt = await getAttemptForStudent(data.attemptId);

    assertAttemptOwner(viewer, attempt.studentUserId);

    const [snapshot] = await db
      .select({
        id: attemptQuestionSnapshots.id,
        questionId: attemptQuestionSnapshots.questionId,
      })
      .from(attemptQuestionSnapshots)
      .where(and(
        eq(attemptQuestionSnapshots.id, data.snapshotId),
        eq(attemptQuestionSnapshots.attemptId, data.attemptId),
      ))
      .limit(1);

    if (!snapshot) {
      throw notFound("Question was not found for this Attempt.");
    }

    await db.transaction(async (tx) => {
      await tx.insert(questionReports).values({
        studentUserId: viewer.userId,
        questionId: snapshot.questionId,
        attemptId: data.attemptId,
        snapshotId: snapshot.id,
        reason: data.reason,
        note: data.note || null,
      });

      await tx.insert(activityEvents).values({
        studentUserId: viewer.userId,
        eventType: "question_reported",
        metadata: {
          attemptId: data.attemptId,
          snapshotId: snapshot.id,
          reason: data.reason,
          ...getImpersonationMetadata(viewer),
        },
      });
    });

    return { ok: true };
  });

export const getAttemptResult = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(attemptIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();
    const attempt = await getAttemptForStudent(data.attemptId);

    assertAttemptOwner(viewer, attempt.studentUserId);

    const [tryout] = await db
      .select({
        id: tryouts.id,
        title: tryouts.title,
        description: tryouts.description,
        categoryId: tryouts.categoryId,
        durationMinutes: tryouts.durationMinutes,
        accessLevel: tryouts.accessLevel,
      })
      .from(tryouts)
      .where(eq(tryouts.id, attempt.tryoutId))
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    const snapshotRows = await getAttemptSnapshotRows(data.attemptId);
    const markedRows = await db
      .select({ snapshotId: attemptMarkedQuestions.snapshotId })
      .from(attemptMarkedQuestions)
      .where(eq(attemptMarkedQuestions.attemptId, data.attemptId));

    return {
      attempt: {
        id: attempt.id,
        tryoutId: attempt.tryoutId,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status as "in_progress" | "submitted" | "auto_submitted",
        startedAt: attempt.startedAt.toISOString(),
        deadlineAt: attempt.deadlineAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        score: attempt.score ?? 0,
        correctCount: attempt.correctCount ?? 0,
        wrongCount: attempt.wrongCount ?? 0,
        totalQuestions: attempt.totalQuestions,
        xpEarned: attempt.xpEarned,
        markedSnapshotIds: markedRows.map((row) => row.snapshotId),
      },
      tryout: {
        ...tryout,
        accessLevel: tryout.accessLevel as "free" | "premium" | "platinum",
      },
      questions: snapshotRows,
    };
  });

export const listProgressSummary = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();

  const submittedAttempts = await db
    .select({
      id: attempts.id,
      tryoutTitle: tryouts.title,
      attemptNumber: attempts.attemptNumber,
      submittedAt: attempts.submittedAt,
      score: attempts.score,
      correctCount: attempts.correctCount,
      totalQuestions: attempts.totalQuestions,
      xpEarned: attempts.xpEarned,
    })
    .from(attempts)
    .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
    .where(and(
      eq(attempts.studentUserId, viewer.userId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .orderBy(desc(attempts.submittedAt));

  const categoryRows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<number>`count(${attemptQuestionSnapshots.id})`,
      correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
    .leftJoin(
      attemptAnswers,
      and(
        eq(attemptAnswers.attemptId, attempts.id),
        eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
      ),
    )
    .where(and(
      eq(attempts.studentUserId, viewer.userId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .groupBy(categories.id);

  const subCategoryRows = await db
    .select({
      categoryId: categories.id,
      subCategoryId: subCategories.id,
      subCategoryName: subCategories.name,
      total: sql<number>`count(${attemptQuestionSnapshots.id})`,
      correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
    .innerJoin(subCategories, eq(subCategories.id, attemptQuestionSnapshots.subCategoryId))
    .leftJoin(
      attemptAnswers,
      and(
        eq(attemptAnswers.attemptId, attempts.id),
        eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
      ),
    )
    .where(and(
      eq(attempts.studentUserId, viewer.userId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .groupBy(categories.id, subCategories.id);

  const [badgeRewardRow] = await db
    .select({
      xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
    })
    .from(studentExpLedger)
    .where(and(
      eq(studentExpLedger.studentUserId, viewer.userId),
      eq(studentExpLedger.sourceType, "badge_reward"),
    ));
  const badgeRows = await db
    .select({ badgeCode: studentBadges.badgeCode })
    .from(studentBadges)
    .where(eq(studentBadges.studentUserId, viewer.userId));

  const totalQuestions = submittedAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const totalCorrect = submittedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0);
  const attemptXp = submittedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
  const badgeRewardXp = Number(badgeRewardRow?.xp ?? 0);
  const xp = attemptXp + badgeRewardXp;
  const streak = calculateCurrentStreak(submittedAttempts.map((attempt) => attempt.submittedAt));

  return {
    xp,
    attemptXp,
    badgeRewardXp,
    streak,
    totalQuestions,
    totalCorrect,
    awardedBadgeIds: badgeRows
      .map((badge) => badgeCodeToId(badge.badgeCode))
      .filter((badgeId): badgeId is number => badgeId !== null),
    attempts: submittedAttempts.map((attempt) => ({
      id: attempt.id,
      tryoutTitle: attempt.tryoutTitle,
      attemptNumber: attempt.attemptNumber,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      score: attempt.score ?? 0,
      correctCount: attempt.correctCount ?? 0,
      totalQuestions: attempt.totalQuestions,
      xpEarned: attempt.xpEarned,
    })),
    categories: categoryRows.map((row) => ({
      id: row.categoryId,
      name: row.categoryName,
      color: row.categoryColor ?? "#205072",
      total: Number(row.total ?? 0),
      correct: Number(row.correct ?? 0),
      subCategories: subCategoryRows
        .filter((subCategory) => subCategory.categoryId === row.categoryId)
        .map((subCategory) => ({
          id: subCategory.subCategoryId,
          name: subCategory.subCategoryName,
          total: Number(subCategory.total ?? 0),
          correct: Number(subCategory.correct ?? 0),
        })),
    })),
  };
});

async function getTakeAttemptData(attemptId: string) {
  const attempt = await getAttemptForStudent(attemptId);
  const questions = await getTakeAttemptQuestionRows(attemptId);
  const answerRows = await db
    .select({
      snapshotId: attemptAnswers.snapshotId,
      selectedOption: attemptAnswers.selectedOption,
    })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId));
  const markedRows = await db
    .select({ snapshotId: attemptMarkedQuestions.snapshotId })
    .from(attemptMarkedQuestions)
    .where(eq(attemptMarkedQuestions.attemptId, attemptId));

  return {
    attempt: {
      id: attempt.id,
      tryoutId: attempt.tryoutId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status as "in_progress" | "submitted" | "auto_submitted",
      startedAt: attempt.startedAt.toISOString(),
      deadlineAt: attempt.deadlineAt.toISOString(),
      lastQuestionIndex: attempt.lastQuestionIndex,
      lastServerSavedAt: attempt.lastServerSavedAt?.toISOString() ?? null,
    },
    questions,
    answers: answerRows.map((answer) => ({
      snapshotId: answer.snapshotId,
      selectedOption: answer.selectedOption as "A" | "B" | "C" | "D" | "E" | null,
      selectedIndex: toOptionIndex(answer.selectedOption),
    })),
    markedSnapshotIds: markedRows.map((row) => row.snapshotId),
  };
}

async function getTakeAttemptQuestionRows(attemptId: string) {
  const rows = await db
    .select({
      snapshotId: attemptQuestionSnapshots.id,
      questionId: attemptQuestionSnapshots.questionId,
      sortOrder: attemptQuestionSnapshots.sortOrder,
      categoryId: attemptQuestionSnapshots.categoryId,
      categoryName: categories.name,
      subCategoryId: attemptQuestionSnapshots.subCategoryId,
      subCategoryName: subCategories.name,
      questionText: attemptQuestionSnapshots.questionText,
      optionA: attemptQuestionSnapshots.optionA,
      optionB: attemptQuestionSnapshots.optionB,
      optionC: attemptQuestionSnapshots.optionC,
      optionD: attemptQuestionSnapshots.optionD,
      optionE: attemptQuestionSnapshots.optionE,
      accessLevel: attemptQuestionSnapshots.accessLevel,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
    .innerJoin(subCategories, eq(subCategories.id, attemptQuestionSnapshots.subCategoryId))
    .where(eq(attemptQuestionSnapshots.attemptId, attemptId))
    .orderBy(attemptQuestionSnapshots.sortOrder);

  return rows.map((row) => ({
    snapshotId: row.snapshotId,
    questionId: row.questionId,
    sortOrder: row.sortOrder,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    subCategoryId: row.subCategoryId,
    subCategoryName: row.subCategoryName,
    questionText: row.questionText,
    options: toOptions(row),
    accessLevel: row.accessLevel as "free" | "premium",
  }));
}

async function getAttemptSnapshotRows(attemptId: string) {
  const rows = await db
    .select({
      snapshotId: attemptQuestionSnapshots.id,
      questionId: attemptQuestionSnapshots.questionId,
      sortOrder: attemptQuestionSnapshots.sortOrder,
      categoryId: attemptQuestionSnapshots.categoryId,
      categoryName: categories.name,
      subCategoryId: attemptQuestionSnapshots.subCategoryId,
      subCategoryName: subCategories.name,
      questionText: attemptQuestionSnapshots.questionText,
      optionA: attemptQuestionSnapshots.optionA,
      optionB: attemptQuestionSnapshots.optionB,
      optionC: attemptQuestionSnapshots.optionC,
      optionD: attemptQuestionSnapshots.optionD,
      optionE: attemptQuestionSnapshots.optionE,
      correctOption: attemptQuestionSnapshots.correctOption,
      explanation: attemptQuestionSnapshots.explanation,
      videoUrl: attemptQuestionSnapshots.videoUrl,
      accessLevel: attemptQuestionSnapshots.accessLevel,
      selectedOption: attemptAnswers.selectedOption,
      isCorrect: attemptAnswers.isCorrect,
      relatedMateriId: sql<string | null>`(
        select ${materi.id}
        from ${materi}
        where ${materi.subCategoryId} = ${attemptQuestionSnapshots.subCategoryId}
          and ${materi.status} = 'published'
          and ${materi.pdfFileKey} is null
        order by ${materi.createdAt} desc
        limit 1
      )`,
      relatedMateriTitle: sql<string | null>`(
        select ${materi.title}
        from ${materi}
        where ${materi.subCategoryId} = ${attemptQuestionSnapshots.subCategoryId}
          and ${materi.status} = 'published'
          and ${materi.pdfFileKey} is null
        order by ${materi.createdAt} desc
        limit 1
      )`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
    .innerJoin(subCategories, eq(subCategories.id, attemptQuestionSnapshots.subCategoryId))
    .leftJoin(
      attemptAnswers,
      and(
        eq(attemptAnswers.attemptId, attemptQuestionSnapshots.attemptId),
        eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
      ),
    )
    .where(eq(attemptQuestionSnapshots.attemptId, attemptId))
    .orderBy(attemptQuestionSnapshots.sortOrder);

  return rows.map((row) => ({
    snapshotId: row.snapshotId,
    questionId: row.questionId,
    sortOrder: row.sortOrder,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    subCategoryId: row.subCategoryId,
    subCategoryName: row.subCategoryName,
    questionText: row.questionText,
    options: toOptions(row),
    correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
    correctIndex: toOptionIndex(row.correctOption) ?? 0,
    explanation: row.explanation,
    videoUrl: row.videoUrl,
    accessLevel: row.accessLevel as "free" | "premium",
    selectedOption: row.selectedOption as "A" | "B" | "C" | "D" | "E" | null,
    selectedIndex: toOptionIndex(row.selectedOption),
    isCorrect: row.isCorrect,
    relatedMateri: row.relatedMateriId && row.relatedMateriTitle
      ? {
          id: row.relatedMateriId,
          title: row.relatedMateriTitle,
        }
      : null,
  }));
}

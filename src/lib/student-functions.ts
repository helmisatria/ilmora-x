import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { resolveAvatarDisplay } from "./avatar";
import { getCurrentViewerFromHeaders } from "./auth-functions";
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
  subCategories,
  studentBadges,
  studentExpLedger,
  studentProfiles,
  tryoutQuestions,
  tryouts,
  user,
} from "./db/schema";
import { assertActiveStudent, assertAttemptOwner } from "./domain/access";
import {
  attemptOptionLetters,
  getAttemptForStudent,
  getAttemptStartState,
  saveAttemptForStudent,
  startOrResumeAttemptForStudent,
  submitAttemptForStudent,
  toOptionIndex,
  toOptions,
} from "./domain/attempt-lifecycle";
import { badgeCodeToId, calculateCurrentStreak } from "./domain/engagement-surface";
import { getJakartaWeekStartDateKey, getJakartaWeekWindow } from "./domain/leaderboard";
import { notFound } from "./http/errors";
import { parseInput } from "./http/validation";

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
    selectedOption: z.enum(attemptOptionLetters).nullable(),
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

    const startState = await getAttemptStartState({
      studentUserId: viewer.userId,
      tryoutId: data.tryoutId,
      accessLevel: tryout.accessLevel,
    });
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
      ...startState,
    };
  });

export const startOrResumeAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    return startOrResumeAttemptForStudent({
      viewer,
      tryoutId: data.tryoutId,
    });
  });

export const saveAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(saveAttemptSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    return saveAttemptForStudent({
      studentUserId: viewer.userId,
      data,
    });
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(submitAttemptSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    return submitAttemptForStudent({ viewer, data });
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

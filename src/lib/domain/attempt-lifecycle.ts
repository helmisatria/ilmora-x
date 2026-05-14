import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  activityEvents,
  attemptAnswers,
  attemptMarkedQuestions,
  attemptQuestionSnapshots,
  attempts,
  categories,
  questions,
  subCategories,
  tryoutQuestions,
  tryouts,
} from "../db/schema";
import { conflict, notFound } from "../http/errors";
import { type Viewer } from "../auth-functions";
import { awardDailyBadges } from "./engagement-surface";
import { isPaidTryout } from "./premium-access";

export const attemptOptionLetters = ["A", "B", "C", "D", "E"] as const;

type AttemptOption = (typeof attemptOptionLetters)[number];

export type AttemptProgressInput = {
  attemptId: string;
  lastQuestionIndex: number;
  answers: Array<{
    snapshotId: string;
    selectedOption: AttemptOption | null;
  }>;
  markedSnapshotIds: string[];
};

export type SubmitAttemptInput = AttemptProgressInput & {
  autoSubmitReason?: string;
};

const DEFAULT_DAILY_TRYOUT_ATTEMPT_LIMIT = 3;

export async function getAttemptStartState({
  studentUserId,
  tryoutId,
  accessLevel,
}: {
  studentUserId: string;
  tryoutId: string;
  accessLevel: string;
}) {
  const dailyAttemptLimit = getDailyTryoutAttemptLimit();
  const attemptsToday = await countTodayTryoutAttempts(studentUserId, tryoutId);
  const hasExtendedPractice = hasExtendedPracticeAccess(accessLevel);

  return {
    attemptsToday,
    dailyAttemptLimit: getVisibleDailyAttemptLimit(hasExtendedPractice, dailyAttemptLimit),
    normalDailyAttemptLimit: dailyAttemptLimit,
    hasExtendedPractice,
  };
}

export async function startOrResumeAttemptForStudent({
  viewer,
  tryoutId,
}: {
  viewer: Viewer;
  tryoutId: string;
}) {
  const [existingAttempt] = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(
      eq(attempts.studentUserId, viewer.userId),
      eq(attempts.tryoutId, tryoutId),
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
    .where(and(eq(tryouts.id, tryoutId), eq(tryouts.status, "published")))
    .limit(1);

  if (!tryout) {
    throw notFound("Try-out was not found.");
  }

  const startState = await getAttemptStartState({
    studentUserId: viewer.userId,
    tryoutId,
    accessLevel: tryout.accessLevel,
  });

  if (!startState.hasExtendedPractice && startState.attemptsToday >= startState.normalDailyAttemptLimit) {
    throw conflict(`Batas pengerjaan harian tercapai. Try-out yang sama hanya bisa dikerjakan ${startState.normalDailyAttemptLimit} kali per hari.`);
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
    .where(and(eq(tryoutQuestions.tryoutId, tryoutId), eq(questions.status, "published")))
    .orderBy(tryoutQuestions.sortOrder);

  if (questionRows.length === 0) {
    throw conflict("This Try-out has no published Questions yet.");
  }

  const [lastAttempt] = await db
    .select({ attemptNumber: attempts.attemptNumber })
    .from(attempts)
    .where(and(eq(attempts.studentUserId, viewer.userId), eq(attempts.tryoutId, tryoutId)))
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
        tryoutId,
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
        tryoutId,
        attemptId: createdAttempt.id,
        ...getImpersonationMetadata(viewer),
      },
    });

    return createdAttempt.id;
  });

  return getTakeAttemptData(createdAttemptId);
}

export async function saveAttemptForStudent({
  studentUserId,
  data,
}: {
  studentUserId: string;
  data: AttemptProgressInput;
}) {
  await ensureAttemptCanBeEdited(data.attemptId, studentUserId);
  await saveAttemptProgress(data.attemptId, data);

  return { ok: true, savedAt: new Date().toISOString() };
}

export async function submitAttemptForStudent({
  viewer,
  data,
}: {
  viewer: Viewer;
  data: SubmitAttemptInput;
}) {
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
}

export async function getAttemptForStudent(attemptId: string) {
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);

  if (attempt) return attempt;

  throw notFound("Attempt was not found.");
}

export function toOptionIndex(option: string | null) {
  if (!option) return null;

  const index = attemptOptionLetters.findIndex((letter) => letter === option);

  if (index < 0) return null;

  return index;
}

export function toOptions(row: {
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
  data: AttemptProgressInput,
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
      selectedOption: answer.selectedOption as AttemptOption | null,
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

function getDailyTryoutAttemptLimit() {
  const configuredLimit = Number(process.env.DAILY_TRYOUT_ATTEMPT_LIMIT);

  if (!Number.isInteger(configuredLimit)) return DEFAULT_DAILY_TRYOUT_ATTEMPT_LIMIT;
  if (configuredLimit < 1) return DEFAULT_DAILY_TRYOUT_ATTEMPT_LIMIT;

  return configuredLimit;
}

function getStartOfJakartaDaySql() {
  return sql`date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'`;
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
  return isPaidTryout(accessLevel);
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

function getImpersonationMetadata(viewer: Viewer) {
  if (!viewer.impersonation) return {};

  return {
    impersonatedByAdminUserId: viewer.impersonation.adminUserId,
    impersonatedByAdminEmail: viewer.impersonation.adminEmail,
  };
}

import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  attemptAnswers,
  attemptMarkedQuestions,
  attemptQuestionSnapshots,
  attempts,
  categories,
  materi,
  questions,
  subCategories,
  tryouts,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { assertAttemptOwner } from "../identity/access-rules";
import { normalizeTryoutAccessLevel } from "../premium-access/premium-access";
import { getStudentViewer } from "../student/student-viewer.server";
import {
  getAttemptForStudent,
  toOptionIndex,
  toOptions,
} from "../tryout-attempt/attempt-lifecycle";

const attemptIdSchema = z.object({
  attemptId: z.string().trim().min(1),
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
        accessLevel: normalizeTryoutAccessLevel(tryout.accessLevel),
      },
      questions: snapshotRows,
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
      pictureUrl: attemptQuestionSnapshots.pictureUrl,
      accessLevel: attemptQuestionSnapshots.accessLevel,
      currentVideoUrl: questions.videoUrl,
      currentPictureUrl: questions.pictureUrl,
      currentAccessLevel: questions.accessLevel,
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
    .innerJoin(questions, eq(questions.id, attemptQuestionSnapshots.questionId))
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
    videoUrl: row.currentVideoUrl,
    pictureUrl: row.currentPictureUrl,
    accessLevel: row.currentAccessLevel as "free" | "premium",
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

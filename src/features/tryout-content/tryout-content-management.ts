import { and, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  attemptQuestionSnapshots,
  attempts,
  questions,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { conflict, notFound } from "../../lib/http/errors";
import type {
  TryoutContentInput,
  TryoutQuestionContentInput,
  TryoutWorkbookInput,
  TryoutWorkbookQuestion,
} from "./tryout-content-types";
import {
  ensureCategoryExists,
  resolveWorkbookTaxonomy,
  validateQuestionOptionE,
  validateQuestionTaxonomy,
  validateTryoutWorkbookInput,
} from "./tryout-workbook-taxonomy";
import {
  sameEditableQuestionContent,
  sameWorkbookQuestionContent,
  toEditableQuestionValues,
  toQuestionInsertValues,
} from "./tryout-question-content-values";

export type {
  TryoutContentInput,
  TryoutQuestionContentInput,
  TryoutWorkbookInput,
  TryoutWorkbookQuestion,
};

export async function createTryoutContent(data: TryoutContentInput) {
  await ensureCategoryExists(data.categoryId);

  const slug = makeSlug(data.title);

  try {
    await db.insert(tryouts).values({
      slug,
      title: data.title,
      description: data.description,
      icon: normalizeTryoutIcon(data.icon),
      categoryId: data.categoryId,
      durationMinutes: data.durationMinutes,
      accessLevel: data.accessLevel,
      status: "draft",
    });
  } catch {
    throw conflict("A Try-out with this title already exists.");
  }

  return { ok: true };
}

export async function updateTryoutContent(data: TryoutContentInput & { tryoutId: string }) {
  await ensureCategoryExists(data.categoryId);
  await ensureTryoutExists(data.tryoutId);

  await db
    .update(tryouts)
    .set({
      title: data.title,
      description: data.description,
      icon: normalizeTryoutIcon(data.icon),
      categoryId: data.categoryId,
      durationMinutes: data.durationMinutes,
      accessLevel: data.accessLevel,
      updatedAt: new Date(),
    })
    .where(eq(tryouts.id, data.tryoutId));

  return { ok: true };
}

function normalizeTryoutIcon(icon: string | undefined) {
  const value = icon?.trim();

  if (!value) return null;

  return value;
}

export async function publishTryoutContent(tryoutId: string) {
  await ensureTryoutExists(tryoutId);
  await ensureTryoutCanBePublished(tryoutId);

  await db
    .update(tryouts)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tryouts.id, tryoutId));

  return { ok: true };
}

export async function unpublishTryoutContent(tryoutId: string) {
  await ensureTryoutExists(tryoutId);

  await db
    .update(tryouts)
    .set({
      status: "unpublished",
      updatedAt: new Date(),
    })
    .where(eq(tryouts.id, tryoutId));

  return { ok: true };
}

export async function importTryoutWorkbook(data: TryoutWorkbookInput & { tryoutId: string }) {
  await validateTryoutWorkbookInput(data);
  await ensureTryoutExists(data.tryoutId);

  const imported = await db.transaction(async (tx) => {
    const resolvedData = await resolveWorkbookTaxonomy(tx, data);
    const assignedQuestionIds: string[] = [];

    await tx
      .update(tryouts)
      .set({
        title: resolvedData.tryout.title,
        description: resolvedData.tryout.description,
        categoryId: resolvedData.tryout.categoryId,
        durationMinutes: resolvedData.tryout.durationMinutes,
        accessLevel: resolvedData.tryout.accessLevel,
        status: resolvedData.tryout.status,
        publishedAt: resolvedData.tryout.status === "published" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tryouts.id, data.tryoutId));

    for (const question of resolvedData.questions) {
      if (!question.questionId) {
        const [createdQuestion] = await tx
          .insert(questions)
          .values(toQuestionInsertValues(question))
          .returning({ id: questions.id });

        assignedQuestionIds.push(createdQuestion.id);
        continue;
      }

      const [existingQuestion] = await tx
        .select({
          id: questions.id,
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
          status: questions.status,
        })
        .from(questions)
        .where(eq(questions.id, question.questionId))
        .limit(1);

      if (!existingQuestion) {
        throw notFound(`Question ${question.questionId} was not found.`);
      }

      const otherTryoutAssignments = await tx
        .select({ tryoutId: tryoutQuestions.tryoutId })
        .from(tryoutQuestions)
        .where(
          and(
            eq(tryoutQuestions.questionId, question.questionId),
            sql`${tryoutQuestions.tryoutId} <> ${data.tryoutId}`,
          ),
        )
        .limit(1);
      const questionChanged = !sameWorkbookQuestionContent(existingQuestion, question);

      if (otherTryoutAssignments.length > 0 && questionChanged) {
        const [createdQuestion] = await tx
          .insert(questions)
          .values(toQuestionInsertValues(question))
          .returning({ id: questions.id });

        assignedQuestionIds.push(createdQuestion.id);
        continue;
      }

      if (questionChanged) {
        await tx
          .update(questions)
          .set({
            ...toQuestionInsertValues(question),
            updatedAt: new Date(),
          })
          .where(eq(questions.id, question.questionId));
      }

      assignedQuestionIds.push(question.questionId);
    }

    await tx
      .delete(tryoutQuestions)
      .where(eq(tryoutQuestions.tryoutId, data.tryoutId));

    if (assignedQuestionIds.length > 0) {
      await tx.insert(tryoutQuestions).values(
        assignedQuestionIds.map((questionId, index) => ({
          tryoutId: data.tryoutId,
          questionId,
          sortOrder: resolvedData.questions[index].sortOrder,
        })),
      );
    }

    return assignedQuestionIds.length;
  });

  return { ok: true, imported };
}

export async function createTryoutFromWorkbook(data: TryoutWorkbookInput) {
  await validateTryoutWorkbookInput(data);

  const created = await db.transaction(async (tx) => {
    const resolvedData = await resolveWorkbookTaxonomy(tx, data);

    const [createdTryout] = await tx
      .insert(tryouts)
      .values({
        slug: makeSlug(resolvedData.tryout.title),
        title: resolvedData.tryout.title,
        description: resolvedData.tryout.description,
        categoryId: resolvedData.tryout.categoryId,
        durationMinutes: resolvedData.tryout.durationMinutes,
        accessLevel: resolvedData.tryout.accessLevel,
        status: resolvedData.tryout.status,
        publishedAt: resolvedData.tryout.status === "published" ? new Date() : null,
      })
      .returning({ id: tryouts.id });

    const assignedQuestionIds: string[] = [];

    for (const question of resolvedData.questions) {
      if (!question.questionId) {
        const [createdQuestion] = await tx
          .insert(questions)
          .values(toQuestionInsertValues(question))
          .returning({ id: questions.id });

        assignedQuestionIds.push(createdQuestion.id);
        continue;
      }

      const [existingQuestion] = await tx
        .select({
          id: questions.id,
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
          status: questions.status,
        })
        .from(questions)
        .where(eq(questions.id, question.questionId))
        .limit(1);

      if (!existingQuestion) {
        throw notFound(`Question ${question.questionId} was not found.`);
      }

      if (sameWorkbookQuestionContent(existingQuestion, question)) {
        assignedQuestionIds.push(question.questionId);
        continue;
      }

      const [createdQuestion] = await tx
        .insert(questions)
        .values(toQuestionInsertValues(question))
        .returning({ id: questions.id });

      assignedQuestionIds.push(createdQuestion.id);
    }

    if (assignedQuestionIds.length > 0) {
      await tx.insert(tryoutQuestions).values(
        assignedQuestionIds.map((questionId, index) => ({
          tryoutId: createdTryout.id,
          questionId,
          sortOrder: resolvedData.questions[index].sortOrder,
        })),
      );
    }

    return {
      id: createdTryout.id,
      imported: assignedQuestionIds.length,
    };
  });

  return { ok: true, ...created };
}

export async function updateTryoutQuestionContent(data: TryoutQuestionContentInput) {
  validateQuestionOptionE(data);
  await validateQuestionTaxonomy(data.categoryId, data.subCategoryId);

  const nextQuestion = toEditableQuestionValues(data);

  await db.transaction(async (tx) => {
    const [assignment] = await tx
      .select({
        id: tryoutQuestions.id,
      })
      .from(tryoutQuestions)
      .where(and(
        eq(tryoutQuestions.tryoutId, data.tryoutId),
        eq(tryoutQuestions.questionId, data.questionId),
      ))
      .limit(1);

    if (!assignment) {
      throw notFound("Question was not assigned to this Try-out.");
    }

    const [existingQuestion] = await tx
      .select({
        id: questions.id,
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
        pictureUrl: questions.pictureUrl,
        accessLevel: questions.accessLevel,
        status: questions.status,
      })
      .from(questions)
      .where(eq(questions.id, data.questionId))
      .limit(1);

    if (!existingQuestion) {
      throw notFound("Question was not found.");
    }

    const [tryout] = await tx
      .select({ status: tryouts.status })
      .from(tryouts)
      .where(eq(tryouts.id, data.tryoutId))
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    if (tryout.status === "published" && nextQuestion.status !== "published") {
      await ensurePublishedTryoutHasAnotherPublishedQuestion(tx, data.tryoutId, data.questionId);
    }

    let questionId = data.questionId;
    const contentChanged = !sameEditableQuestionContent(existingQuestion, nextQuestion);

    if (contentChanged) {
      const otherAssignments = await tx
        .select({ tryoutId: tryoutQuestions.tryoutId })
        .from(tryoutQuestions)
        .where(and(
          eq(tryoutQuestions.questionId, data.questionId),
          sql`${tryoutQuestions.tryoutId} <> ${data.tryoutId}`,
        ))
        .limit(1);

      if (otherAssignments.length > 0) {
        const [createdQuestion] = await tx
          .insert(questions)
          .values(nextQuestion)
          .returning({ id: questions.id });

        questionId = createdQuestion.id;
      } else {
        await tx
          .update(questions)
          .set({
            ...nextQuestion,
            updatedAt: new Date(),
          })
          .where(eq(questions.id, data.questionId));
      }
    }

    await tx
      .update(tryoutQuestions)
      .set({
        questionId,
        sortOrder: data.sortOrder,
      })
      .where(eq(tryoutQuestions.id, assignment.id));

    await tx
      .update(attemptQuestionSnapshots)
      .set({
        videoUrl: nextQuestion.videoUrl,
        pictureUrl: nextQuestion.pictureUrl,
        accessLevel: nextQuestion.accessLevel,
      })
      .where(and(
        eq(attemptQuestionSnapshots.questionId, data.questionId),
        sql`${attemptQuestionSnapshots.attemptId} in (
          select ${attempts.id}
          from ${attempts}
          where ${attempts.tryoutId} = ${data.tryoutId}
        )`,
      ));
  });

  return { ok: true };
}

export async function removeTryoutQuestionContent({
  tryoutId,
  questionId,
}: {
  tryoutId: string;
  questionId: string;
}) {
  const [assignment] = await db
    .select({
      id: tryoutQuestions.id,
      questionStatus: questions.status,
      tryoutStatus: tryouts.status,
    })
    .from(tryoutQuestions)
    .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
    .innerJoin(tryouts, eq(tryouts.id, tryoutQuestions.tryoutId))
    .where(and(
      eq(tryoutQuestions.tryoutId, tryoutId),
      eq(tryoutQuestions.questionId, questionId),
    ))
    .limit(1);

  if (!assignment) {
    throw notFound("Question was not assigned to this Try-out.");
  }

  if (assignment.tryoutStatus === "published" && assignment.questionStatus === "published") {
    await ensurePublishedTryoutHasAnotherPublishedQuestion(db, tryoutId, questionId);
  }

  await db
    .delete(tryoutQuestions)
    .where(eq(tryoutQuestions.id, assignment.id));

  return { ok: true };
}

async function ensureTryoutExists(tryoutId: string) {
  const [tryout] = await db
    .select({ id: tryouts.id })
    .from(tryouts)
    .where(eq(tryouts.id, tryoutId))
    .limit(1);

  if (tryout) return;

  throw notFound("Try-out was not found.");
}

async function ensureTryoutCanBePublished(tryoutId: string) {
  const [row] = await db
    .select({
      count: sql<number>`count(${questions.id})`,
    })
    .from(tryoutQuestions)
    .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
    .where(and(
      eq(tryoutQuestions.tryoutId, tryoutId),
      eq(questions.status, "published"),
    ));

  if (Number(row?.count ?? 0) > 0) return;

  throw conflict("A published Try-out needs at least one published Question.");
}

async function ensurePublishedTryoutHasAnotherPublishedQuestion(
  tx: Pick<typeof db, "select">,
  tryoutId: string,
  questionId: string,
) {
  const [row] = await tx
    .select({ count: sql<number>`count(${questions.id})` })
    .from(tryoutQuestions)
    .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
    .where(and(
      eq(tryoutQuestions.tryoutId, tryoutId),
      eq(questions.status, "published"),
      sql`${tryoutQuestions.questionId} <> ${questionId}`,
    ));

  if (Number(row?.count ?? 0) > 0) return;

  throw conflict("A published Try-out needs at least one published Question.");
}

function makeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  return `tryout-${Date.now()}`;
}

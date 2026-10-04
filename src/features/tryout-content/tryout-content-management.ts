import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  attemptQuestionSnapshots,
  attempts,
  entitlements,
  questions,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { withAdminContentTransaction, requireTryoutRevision, touchTryout, nextTryoutRevision, nextQuestionRevision, type ContentRevision } from "./admin-content-transaction";
import { conflict, notFound } from "../../lib/http/errors";
import { getWorkbookSourceError } from "./tryout-workbook-source";
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
    await withAdminContentTransaction(async (tx) => {
      await tx.insert(tryouts).values({
        slug,
        title: data.title,
        description: data.description,
        icon: normalizeTryoutIcon(data.icon),
        categoryId: data.categoryId,
        durationMinutes: data.durationMinutes,
        accessLevel: data.accessLevel,
        status: "draft",
    });
    });
  } catch {
    throw conflict("Judul try-out sudah dipakai. Gunakan judul lain.");
  }

  return { ok: true };
}

export async function updateTryoutContent(data: TryoutContentInput & { tryoutId: string } & ContentRevision) {
  await ensureCategoryExists(data.categoryId);
  await withAdminContentTransaction(async (tx) => {
    await requireTryoutRevision(tx, data.tryoutId, data.expectedUpdatedAt);

    await tx
      .update(tryouts)
      .set({
        title: data.title,
        description: data.description,
        icon: normalizeTryoutIcon(data.icon),
        categoryId: data.categoryId,
        durationMinutes: data.durationMinutes,
        accessLevel: data.accessLevel,
        updatedAt: nextTryoutRevision,
      })
      .where(eq(tryouts.id, data.tryoutId));
  });
  return { ok: true };
}

function normalizeTryoutIcon(icon: string | undefined) {
  const value = icon?.trim();

  if (!value) return null;

  return value;
}

export async function publishTryoutContent(tryoutId: string, expectedUpdatedAt: string) {
  await withAdminContentTransaction(async (tx) => {
    await requireTryoutRevision(tx, tryoutId, expectedUpdatedAt);
    await ensureTryoutCanBePublished(tryoutId, tx);

    await tx
      .update(tryouts)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: nextTryoutRevision,
      })
      .where(eq(tryouts.id, tryoutId));
  });
  return { ok: true };
}

export async function unpublishTryoutContent(tryoutId: string, expectedUpdatedAt: string) {
  await withAdminContentTransaction(async (tx) => {
    await requireTryoutRevision(tx, tryoutId, expectedUpdatedAt);
    await ensureNoLifetimeOwners(tryoutId, tx);

    await tx
      .update(tryouts)
      .set({
        status: "unpublished",
        updatedAt: nextTryoutRevision,
      })
      .where(eq(tryouts.id, tryoutId));
  });
  return { ok: true };
}

export async function importTryoutWorkbook(data: TryoutWorkbookInput & { tryoutId: string } & ContentRevision) {
  await validateTryoutWorkbookInput(data);
  const imported = await withAdminContentTransaction(async (tx) => {
    const currentTryout = await requireTryoutRevision(tx, data.tryoutId, data.expectedUpdatedAt);
    const sourceError = getWorkbookSourceError(data.source, {
      id: currentTryout.id, updatedAt: currentTryout.updatedAt.toISOString(),
    });
    if (sourceError) throw conflict(sourceError);
    if (currentTryout.status === "published" && data.tryout.status !== "published") {
      await ensureNoLifetimeOwners(data.tryoutId, tx);
    }
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
        updatedAt: nextTryoutRevision,
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
          topicId: questions.topicId,
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
        .where(eq(questions.id, question.questionId))
        .limit(1);

      if (!existingQuestion) {
        throw notFound(`ID soal ${question.questionId} tidak ditemukan. Unduh Excel terbaru atau kosongkan question_id untuk membuat soal baru.`);
      }

      if (question.pictureUrl === undefined) question.pictureUrl = existingQuestion.pictureUrl ?? "";
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
            updatedAt: nextQuestionRevision,
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

async function ensureNoLifetimeOwners(tryoutId: string, tx: Pick<typeof db, "select">) {
  const now = new Date();
  const [owner] = await tx
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(
      eq(entitlements.productType, "lifetime_tryout"),
      eq(entitlements.contentType, "tryout"),
      eq(entitlements.contentId, tryoutId),
      or(isNull(entitlements.endsAt), gt(entitlements.endsAt, now)),
    ))
    .limit(1);

  if (owner) {
    throw conflict("Try-out sudah dibeli untuk akses selamanya. Try-out tidak dapat disembunyikan.");
  }
}

export async function createTryoutFromWorkbook(data: TryoutWorkbookInput) {
  await validateTryoutWorkbookInput(data);

  const created = await withAdminContentTransaction(async (tx) => {
    const resolvedData = await resolveWorkbookTaxonomy(tx, data);
    const slug = makeSlug(resolvedData.tryout.title);

    const [existingTryout] = await tx
      .select({ id: tryouts.id })
      .from(tryouts)
      .where(eq(tryouts.slug, slug))
      .limit(1);

    if (existingTryout) {
      throw conflict("Judul try-out sudah dipakai. Gunakan judul lain.");
    }

    const [createdTryout] = await tx
      .insert(tryouts)
      .values({
        slug,
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
          topicId: questions.topicId,
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
        .where(eq(questions.id, question.questionId))
        .limit(1);

      if (!existingQuestion) {
        throw notFound(`ID soal ${question.questionId} tidak ditemukan. Unduh Excel terbaru atau kosongkan question_id untuk membuat soal baru.`);
      }

      if (question.pictureUrl === undefined) question.pictureUrl = existingQuestion.pictureUrl ?? "";
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

export async function addTryoutQuestionContent(data: TryoutWorkbookQuestion & { tryoutId: string } & ContentRevision) {
  validateQuestionOptionE(data);
  await validateQuestionTaxonomy(data.categoryId, data.subCategoryId, data.topicId);
  await withAdminContentTransaction(async (tx) => {
    await requireTryoutRevision(tx, data.tryoutId, data.expectedUpdatedAt);
    await ensureQuestionOrderAvailable(tx, data.tryoutId, data.sortOrder);
    const [question] = await tx.insert(questions).values(toQuestionInsertValues(data))
      .returning({ id: questions.id });
    await tx.insert(tryoutQuestions).values({
      tryoutId: data.tryoutId, questionId: question.id, sortOrder: data.sortOrder,
    });
    await touchTryout(tx, data.tryoutId);
  });
  return { ok: true };
}

async function ensureQuestionOrderAvailable(
  tx: Pick<typeof db, "select">, tryoutId: string, sortOrder: number, questionId?: string,
) {
  const [assignment] = await tx.select({ questionId: tryoutQuestions.questionId })
    .from(tryoutQuestions).where(and(
      eq(tryoutQuestions.tryoutId, tryoutId), eq(tryoutQuestions.sortOrder, sortOrder),
    )).limit(1);
  if (assignment && assignment.questionId !== questionId) {
    throw conflict(`Nomor urut ${sortOrder} sudah dipakai. Pilih nomor lain.`);
  }
}

export async function updateTryoutQuestionContent(data: TryoutQuestionContentInput & ContentRevision) {
  validateQuestionOptionE(data);
  await validateQuestionTaxonomy(data.categoryId, data.subCategoryId, data.topicId);

  const nextQuestion = toEditableQuestionValues(data);

  await withAdminContentTransaction(async (tx) => {
    await requireTryoutRevision(tx, data.tryoutId, data.expectedUpdatedAt);
    await ensureQuestionOrderAvailable(tx, data.tryoutId, data.sortOrder, data.questionId);
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
      throw notFound("Soal tidak ada di try-out ini. Muat ulang halaman.");
    }

    const [existingQuestion] = await tx
      .select({
        id: questions.id,
        categoryId: questions.categoryId,
        subCategoryId: questions.subCategoryId,
        topicId: questions.topicId,
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
      throw notFound("Soal tidak ditemukan.");
    }

    const [tryout] = await tx
      .select({ status: tryouts.status })
      .from(tryouts)
      .where(eq(tryouts.id, data.tryoutId))
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out tidak ditemukan.");
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
            updatedAt: nextQuestionRevision,
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
    await touchTryout(tx, data.tryoutId);
  });

  return { ok: true };
}

export async function removeTryoutQuestionContent({
  tryoutId,
  questionId,
  expectedUpdatedAt,
}: {
  tryoutId: string;
  questionId: string;
  expectedUpdatedAt: string;
}) {
  await withAdminContentTransaction(async (tx) => {
    await requireTryoutRevision(tx, tryoutId, expectedUpdatedAt);
    const [assignment] = await tx
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
      throw notFound("Soal tidak ada di try-out ini. Muat ulang halaman.");
    }

    if (assignment.tryoutStatus === "published" && assignment.questionStatus === "published") {
      await ensurePublishedTryoutHasAnotherPublishedQuestion(tx, tryoutId, questionId);
    }

    await tx
      .delete(tryoutQuestions)
      .where(eq(tryoutQuestions.id, assignment.id));

    await touchTryout(tx, tryoutId);
  });
  return { ok: true };
}

async function ensureTryoutCanBePublished(tryoutId: string, tx: Pick<typeof db, "select">) {
  const [row] = await tx
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

  throw conflict("Try-out yang tayang harus memiliki minimal satu soal tayang. Tayangkan soal lain atau sembunyikan try-out lebih dulu.");
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

  throw conflict("Try-out yang tayang harus memiliki minimal satu soal tayang. Tayangkan soal lain atau sembunyikan try-out lebih dulu.");
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

import { and, eq, sql } from "drizzle-orm";
import { questions, tryoutQuestions, tryouts } from "../../lib/db/schema";
import { conflict } from "../../lib/http/errors";
import { nextQuestionRevision, requireQuestionRevision, touchQuestionTryouts, withAdminContentTransaction, type ContentRevision } from "./admin-content-transaction";
import type { TryoutWorkbookQuestion } from "./tryout-content-types";
import { toQuestionInsertValues } from "./tryout-question-content-values";
import { validateQuestionOptionE, validateQuestionTaxonomy } from "./tryout-workbook-taxonomy";

type QuestionInput = Omit<TryoutWorkbookQuestion, "sortOrder" | "status" | "questionId">;

export async function createQuestionContent(data: QuestionInput) {
  validateQuestionOptionE(data);
  await validateQuestionTaxonomy(data.categoryId, data.subCategoryId, data.topicId);
  await withAdminContentTransaction(async (tx) => {
    await tx.insert(questions).values(toQuestionInsertValues({ ...data, sortOrder: 1, status: "draft" }));
  });
  return { ok: true };
}

export async function updateQuestionContent(data: QuestionInput & { questionId: string } & ContentRevision) {
  validateQuestionOptionE(data);
  await validateQuestionTaxonomy(data.categoryId, data.subCategoryId, data.topicId);
  await withAdminContentTransaction(async (tx) => {
    const existing = await requireQuestionRevision(tx, data.questionId, data.expectedUpdatedAt);
    await tx.update(questions).set({
      ...toQuestionInsertValues({ ...data, sortOrder: 1, status: existing.status as TryoutWorkbookQuestion["status"] }),
      updatedAt: nextQuestionRevision,
    }).where(eq(questions.id, data.questionId));
    await touchQuestionTryouts(tx, data.questionId);
  });
  return { ok: true };
}

export async function setQuestionPublication(data: { questionId: string; status: "published" | "unpublished" } & ContentRevision) {
  await withAdminContentTransaction(async (tx) => {
    await requireQuestionRevision(tx, data.questionId, data.expectedUpdatedAt);
    if (data.status === "unpublished") {
      const [blockedTryout] = await tx.select({ title: tryouts.title }).from(tryoutQuestions)
        .innerJoin(tryouts, eq(tryouts.id, tryoutQuestions.tryoutId))
        .where(and(eq(tryoutQuestions.questionId, data.questionId), eq(tryouts.status, "published"),
          sql`not exists (
            select 1 from ${tryoutQuestions} other_assignment
            join ${questions} other_question on other_question.id = other_assignment.question_id
            where other_assignment.tryout_id = ${tryouts.id}
              and other_question.status = 'published' and other_question.id <> ${data.questionId}
          )`)).limit(1);
      if (blockedTryout) throw conflict(`Soal ini adalah satu-satunya soal tayang di "${blockedTryout.title}". Tayangkan soal lain atau sembunyikan try-out lebih dulu.`);
    }
    await tx.update(questions).set({ status: data.status, updatedAt: nextQuestionRevision }).where(eq(questions.id, data.questionId));
    await touchQuestionTryouts(tx, data.questionId);
  });
  return { ok: true };
}

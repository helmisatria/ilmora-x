import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  categories,
  questions,
  subCategories,
  tryoutQuestions,
  tryouts,
} from "../db/schema";
import { conflict, notFound } from "../http/errors";

type TryoutAccessLevel = "free" | "premium";
type QuestionAccessLevel = "free" | "premium";
type ContentStatus = "draft" | "published" | "unpublished";
type QuestionOption = "A" | "B" | "C" | "D" | "E";

export type TryoutContentInput = {
  title: string;
  description: string;
  categoryId: string;
  durationMinutes: number;
  accessLevel: TryoutAccessLevel;
};

export type TryoutWorkbookTryout = {
  title: string;
  description: string;
  categoryId: string;
  durationMinutes: number;
  accessLevel: TryoutAccessLevel;
  status: ContentStatus;
};

export type TryoutWorkbookQuestion = {
  questionId?: string;
  sortOrder: number;
  categoryId: string;
  subCategoryId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: QuestionOption;
  explanation: string;
  videoUrl?: string;
  accessLevel: QuestionAccessLevel;
  status: ContentStatus;
};

type TryoutWorkbookInput = {
  tryout: TryoutWorkbookTryout;
  questions: TryoutWorkbookQuestion[];
};

export async function createTryoutContent(data: TryoutContentInput) {
  await ensureCategoryExists(data.categoryId);

  const slug = makeSlug(data.title);

  try {
    await db.insert(tryouts).values({
      slug,
      title: data.title,
      description: data.description,
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
      categoryId: data.categoryId,
      durationMinutes: data.durationMinutes,
      accessLevel: data.accessLevel,
      updatedAt: new Date(),
    })
    .where(eq(tryouts.id, data.tryoutId));

  return { ok: true };
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
    const assignedQuestionIds: string[] = [];

    await tx
      .update(tryouts)
      .set({
        title: data.tryout.title,
        description: data.tryout.description,
        categoryId: data.tryout.categoryId,
        durationMinutes: data.tryout.durationMinutes,
        accessLevel: data.tryout.accessLevel,
        status: data.tryout.status,
        publishedAt: data.tryout.status === "published" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tryouts.id, data.tryoutId));

    for (const question of data.questions) {
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
      const questionChanged = !sameQuestionContent(existingQuestion, question);

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
          sortOrder: data.questions[index].sortOrder,
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
    const [createdTryout] = await tx
      .insert(tryouts)
      .values({
        slug: makeSlug(data.tryout.title),
        title: data.tryout.title,
        description: data.tryout.description,
        categoryId: data.tryout.categoryId,
        durationMinutes: data.tryout.durationMinutes,
        accessLevel: data.tryout.accessLevel,
        status: data.tryout.status,
        publishedAt: data.tryout.status === "published" ? new Date() : null,
      })
      .returning({ id: tryouts.id });

    const assignedQuestionIds: string[] = [];

    for (const question of data.questions) {
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

      if (sameQuestionContent(existingQuestion, question)) {
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
          sortOrder: data.questions[index].sortOrder,
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

async function validateTryoutWorkbookInput(data: TryoutWorkbookInput) {
  await ensureCategoryExists(data.tryout.categoryId);

  const questionIds = data.questions
    .map((question) => question.questionId)
    .filter((questionId): questionId is string => Boolean(questionId));
  const uniqueQuestionIds = new Set(questionIds);
  const sortOrders = data.questions.map((question) => question.sortOrder);
  const uniqueSortOrders = new Set(sortOrders);

  if (uniqueQuestionIds.size !== questionIds.length) {
    throw conflict("A Question appears more than once in this workbook.");
  }

  if (uniqueSortOrders.size !== sortOrders.length) {
    throw conflict("Two Questions cannot use the same sort order.");
  }

  if (data.tryout.status === "published") {
    const publishedQuestions = data.questions.filter((question) => question.status === "published");

    if (publishedQuestions.length === 0) {
      throw conflict("A published Try-out needs at least one published Question.");
    }
  }

  for (const question of data.questions) {
    validateQuestionOptionE(question);
    await validateQuestionTaxonomy(question.categoryId, question.subCategoryId);
  }
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

async function ensureCategoryExists(categoryId: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (category) return;

  throw notFound("Category was not found.");
}

async function ensureSubCategoryBelongsToCategory(categoryId: string, subCategoryId: string) {
  const [subCategory] = await db
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(eq(subCategories.id, subCategoryId), eq(subCategories.categoryId, categoryId)))
    .limit(1);

  if (subCategory) return;

  throw notFound("Sub-category was not found for this category.");
}

async function validateQuestionTaxonomy(categoryId: string, subCategoryId: string) {
  await ensureCategoryExists(categoryId);
  await ensureSubCategoryBelongsToCategory(categoryId, subCategoryId);
}

function validateQuestionOptionE(data: Pick<TryoutWorkbookQuestion, "correctOption" | "optionE">) {
  if (data.correctOption !== "E") return;
  if (data.optionE?.trim()) return;

  throw conflict("Option E is required when the correct option is E.");
}

function sameQuestionContent(
  existingQuestion: {
    categoryId: string;
    subCategoryId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionE: string | null;
    correctOption: string;
    explanation: string;
    videoUrl: string | null;
    accessLevel: string;
    status: string;
  },
  workbookQuestion: TryoutWorkbookQuestion,
) {
  return (
    existingQuestion.categoryId === workbookQuestion.categoryId &&
    existingQuestion.subCategoryId === workbookQuestion.subCategoryId &&
    existingQuestion.questionText === workbookQuestion.questionText &&
    existingQuestion.optionA === workbookQuestion.optionA &&
    existingQuestion.optionB === workbookQuestion.optionB &&
    existingQuestion.optionC === workbookQuestion.optionC &&
    existingQuestion.optionD === workbookQuestion.optionD &&
    (existingQuestion.optionE ?? "") === (workbookQuestion.optionE ?? "") &&
    existingQuestion.correctOption === workbookQuestion.correctOption &&
    existingQuestion.explanation === workbookQuestion.explanation &&
    (existingQuestion.videoUrl ?? "") === (workbookQuestion.videoUrl ?? "") &&
    existingQuestion.accessLevel === workbookQuestion.accessLevel &&
    existingQuestion.status === workbookQuestion.status
  );
}

function toQuestionInsertValues(question: TryoutWorkbookQuestion) {
  return {
    categoryId: question.categoryId,
    subCategoryId: question.subCategoryId,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    optionE: normalizeOptionalText(question.optionE),
    correctOption: question.correctOption,
    explanation: question.explanation,
    videoUrl: normalizeOptionalText(question.videoUrl),
    accessLevel: question.accessLevel,
    status: question.status,
  };
}

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
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

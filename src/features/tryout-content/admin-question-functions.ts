import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  categories,
  questions,
  subCategories,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "../admin/admin-access";
import {
  validateQuestionOptionE,
  validateQuestionTaxonomy,
} from "./tryout-workbook-taxonomy";

const questionOptionSchema = z.enum(["A", "B", "C", "D", "E"]);
const questionAccessLevelSchema = z.enum(["free", "premium"]);

const questionInputSchema = z.object({
  categoryId: z.string().trim().min(1),
  subCategoryId: z.string().trim().min(1),
  questionText: z.string().trim().min(1),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  optionE: z.string().trim().optional(),
  correctOption: questionOptionSchema,
  explanation: z.string().trim().min(1),
  videoUrl: z.string().trim().optional(),
  pictureUrl: z.string().trim().optional(),
  accessLevel: questionAccessLevelSchema,
});

const createQuestionSchema = questionInputSchema;

const updateQuestionSchema = questionInputSchema.extend({
  questionId: z.string().trim().min(1),
});

const questionIdSchema = z.object({
  questionId: z.string().trim().min(1),
});

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
}

export const listQuestionsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: questions.id,
      categoryId: questions.categoryId,
      categoryName: categories.name,
      subCategoryId: questions.subCategoryId,
      subCategoryName: subCategories.name,
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
      updatedAt: questions.updatedAt,
    })
    .from(questions)
    .innerJoin(categories, eq(categories.id, questions.categoryId))
    .innerJoin(subCategories, eq(subCategories.id, questions.subCategoryId))
    .orderBy(desc(questions.updatedAt));

  return rows.map((row) => ({
    ...row,
    correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
    accessLevel: row.accessLevel as "free" | "premium",
    status: row.status as "draft" | "published" | "unpublished",
    updatedAt: row.updatedAt.toISOString(),
  }));
});

export const createQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createQuestionSchema, input))
  .handler(async ({ data }) => {
    validateQuestionOptionE(data);
    await validateQuestionTaxonomy(data.categoryId, data.subCategoryId);

    await db.insert(questions).values({
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      questionText: data.questionText,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      optionE: normalizeOptionalText(data.optionE),
      correctOption: data.correctOption,
      explanation: data.explanation,
      videoUrl: normalizeOptionalText(data.videoUrl),
      pictureUrl: normalizeOptionalText(data.pictureUrl),
      accessLevel: data.accessLevel,
      status: "draft",
    });

    return { ok: true };
  });

export const updateQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateQuestionSchema, input))
  .handler(async ({ data }) => {
    validateQuestionOptionE(data);
    await validateQuestionTaxonomy(data.categoryId, data.subCategoryId);

    const [existingQuestion] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, data.questionId))
      .limit(1);

    if (!existingQuestion) {
      throw notFound("Question was not found.");
    }

    await db
      .update(questions)
      .set({
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        optionE: normalizeOptionalText(data.optionE),
        correctOption: data.correctOption,
        explanation: data.explanation,
        videoUrl: normalizeOptionalText(data.videoUrl),
        pictureUrl: normalizeOptionalText(data.pictureUrl),
        accessLevel: data.accessLevel,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.questionId));

    return { ok: true };
  });

export const publishQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(questionIdSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(questions)
      .set({
        status: "published",
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.questionId));

    return { ok: true };
  });

export const unpublishQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(questionIdSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(questions)
      .set({
        status: "unpublished",
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.questionId));

    return { ok: true };
  });

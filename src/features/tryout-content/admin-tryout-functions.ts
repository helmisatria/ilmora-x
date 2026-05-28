import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  categories,
  questions,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "../admin/admin-access";
import { normalizeTryoutAccessLevel } from "../premium-access/premium-access";
import {
  createTryoutContent,
  createTryoutFromWorkbook,
  importTryoutWorkbook,
  publishTryoutContent,
  removeTryoutQuestionContent,
  unpublishTryoutContent,
  updateTryoutContent,
  updateTryoutQuestionContent,
} from "./tryout-content-management";

const tryoutAccessLevelSchema = z.enum(["free", "premium"]);
const contentStatusSchema = z.enum(["draft", "published", "unpublished"]);

const tryoutInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  icon: z.string().trim().max(250000).optional(),
  categoryId: z.string().trim().min(1),
  durationMinutes: z.number().int().min(1).max(300),
  accessLevel: tryoutAccessLevelSchema,
});

const updateTryoutSchema = tryoutInputSchema.extend({
  tryoutId: z.string().trim().min(1),
});

const tryoutIdSchema = z.object({
  tryoutId: z.string().trim().min(1),
});

const questionOptionSchema = z.enum(["A", "B", "C", "D", "E"]);
const questionAccessLevelSchema = z.enum(["free", "premium"]);

const workbookQuestionSchema = z.object({
  questionId: z.string().trim().optional(),
  sortOrder: z.number().int().min(1).max(1000),
  categoryId: z.string().trim().optional().default(""),
  categoryName: z.string().trim().optional(),
  subCategoryId: z.string().trim().optional().default(""),
  subCategoryName: z.string().trim().optional(),
  questionText: z.string().trim().min(1),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  optionE: z.string().trim().optional(),
  correctOption: questionOptionSchema,
  explanation: z.string().trim().min(1),
  videoUrl: z.string().trim().optional(),
  accessLevel: questionAccessLevelSchema,
  status: contentStatusSchema,
});

const workbookTryoutSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  categoryId: z.string().trim().optional().default(""),
  categoryName: z.string().trim().optional(),
  durationMinutes: z.number().int().min(1).max(300),
  accessLevel: tryoutAccessLevelSchema,
  status: contentStatusSchema,
});

const importTryoutWorkbookSchema = z.object({
  tryoutId: z.string().trim().min(1),
  tryout: workbookTryoutSchema,
  questions: z.array(workbookQuestionSchema).max(500),
});

const createTryoutWorkbookSchema = z.object({
  tryout: workbookTryoutSchema,
  questions: z.array(workbookQuestionSchema).max(500),
});

const updateTryoutQuestionSchema = workbookQuestionSchema.extend({
  tryoutId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
});

const removeTryoutQuestionSchema = z.object({
  tryoutId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
});

export const listTryoutsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: tryouts.id,
      slug: tryouts.slug,
      title: tryouts.title,
      description: tryouts.description,
      icon: tryouts.icon,
      categoryId: tryouts.categoryId,
      categoryName: categories.name,
      durationMinutes: tryouts.durationMinutes,
      accessLevel: tryouts.accessLevel,
      status: tryouts.status,
      publishedAt: tryouts.publishedAt,
      updatedAt: tryouts.updatedAt,
    })
    .from(tryouts)
    .innerJoin(categories, eq(categories.id, tryouts.categoryId))
    .orderBy(desc(tryouts.updatedAt));

  return rows.map((row) => ({
    ...row,
    accessLevel: normalizeTryoutAccessLevel(row.accessLevel),
    status: row.status as "draft" | "published" | "unpublished",
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }));
});

export const createTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutInputSchema, input))
  .handler(async ({ data }) => {
    return createTryoutContent(data);
  });

export const updateTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateTryoutSchema, input))
  .handler(async ({ data }) => {
    return updateTryoutContent(data);
  });

export const publishTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    return publishTryoutContent(data.tryoutId);
  });

export const unpublishTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    return unpublishTryoutContent(data.tryoutId);
  });

export const getTryoutWorkbookAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const [tryout] = await db
      .select({
        id: tryouts.id,
        slug: tryouts.slug,
        title: tryouts.title,
        description: tryouts.description,
        icon: tryouts.icon,
        categoryId: tryouts.categoryId,
        durationMinutes: tryouts.durationMinutes,
        accessLevel: tryouts.accessLevel,
        status: tryouts.status,
      })
      .from(tryouts)
      .where(eq(tryouts.id, data.tryoutId))
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    const rows = await db
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
        pictureUrl: questions.pictureUrl,
        accessLevel: questions.accessLevel,
        status: questions.status,
      })
      .from(tryoutQuestions)
      .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
      .where(eq(tryoutQuestions.tryoutId, data.tryoutId))
      .orderBy(tryoutQuestions.sortOrder);

    return {
      tryout: {
        ...tryout,
        accessLevel: normalizeTryoutAccessLevel(tryout.accessLevel),
        status: tryout.status as "draft" | "published" | "unpublished",
      },
      questions: rows.map((row) => ({
        ...row,
        optionE: row.optionE ?? "",
        videoUrl: row.videoUrl ?? "",
        pictureUrl: row.pictureUrl ?? "",
        correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
        accessLevel: row.accessLevel as "free" | "premium",
        status: row.status as "draft" | "published" | "unpublished",
      })),
    };
  });

export const importTryoutWorkbookAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(importTryoutWorkbookSchema, input))
  .handler(async ({ data }) => {
    return importTryoutWorkbook(data);
  });

export const updateTryoutQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateTryoutQuestionSchema, input))
  .handler(async ({ data }) => {
    return updateTryoutQuestionContent(data);
  });

export const removeTryoutQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(removeTryoutQuestionSchema, input))
  .handler(async ({ data }) => {
    return removeTryoutQuestionContent(data);
  });

export const createTryoutFromWorkbookAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createTryoutWorkbookSchema, input))
  .handler(async ({ data }) => {
    return createTryoutFromWorkbook(data);
  });

import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getCurrentViewerFromHeaders } from "./auth-functions";
import { db } from "./db/client";
import {
  adminMembers,
  attemptAnswers,
  attemptQuestionSnapshots,
  attempts,
  categories,
  materi,
  questionReports,
  questions,
  studentProfiles,
  subCategories,
  tryoutQuestions,
  tryouts,
  user,
} from "./db/schema";
import { requireAdmin, requireSuperAdmin } from "./domain/admin";
import { conflict, notFound } from "./http/errors";
import { parseInput } from "./http/validation";

const studentStatusSchema = z.object({
  studentUserId: z.string().min(1),
  status: z.enum(["active", "suspended"]),
});

const addAdminSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  role: z.enum(["admin", "super_admin"]),
});

const removeAdminSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
});

const tryoutAccessLevelSchema = z.enum(["free", "premium", "platinum"]);

const tryoutInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
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
  accessLevel: questionAccessLevelSchema,
});

const createQuestionSchema = questionInputSchema;

const updateQuestionSchema = questionInputSchema.extend({
  questionId: z.string().trim().min(1),
});

const questionIdSchema = z.object({
  questionId: z.string().trim().min(1),
});

const contentStatusSchema = z.enum(["draft", "published", "unpublished"]);

const tryoutWorkbookTryoutSchema = tryoutInputSchema.extend({
  status: contentStatusSchema,
});

const tryoutWorkbookQuestionSchema = questionInputSchema.extend({
  questionId: z.string().trim().optional(),
  sortOrder: z.number().int().min(1).max(1000),
  status: contentStatusSchema,
});

const importTryoutWorkbookSchema = z.object({
  tryoutId: z.string().trim().min(1),
  tryout: tryoutWorkbookTryoutSchema,
  questions: z.array(tryoutWorkbookQuestionSchema).max(500),
});

const createTryoutWorkbookSchema = z.object({
  tryout: tryoutWorkbookTryoutSchema,
  questions: z.array(tryoutWorkbookQuestionSchema).max(500),
});

async function getAdminViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  await requireAdmin(viewer?.email);

  if (!viewer) {
    throw notFound("Admin viewer was not found.");
  }

  return viewer;
}

const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const viewer = await getAdminViewer();

  return next({
    context: { viewer },
  });
});

const superAdminMiddleware = createMiddleware({ type: "function" })
  .middleware([adminMiddleware])
  .server(async ({ context, next }) => {
    await requireSuperAdmin(context.viewer.email);

    return next();
  });

function makeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  return `tryout-${Date.now()}`;
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

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
}

function validateQuestionOptionE(data: z.infer<typeof questionInputSchema>) {
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
  workbookQuestion: z.infer<typeof tryoutWorkbookQuestionSchema>,
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

function toQuestionInsertValues(question: z.infer<typeof tryoutWorkbookQuestionSchema>) {
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

async function validateQuestionTaxonomy(categoryId: string, subCategoryId: string) {
  await ensureCategoryExists(categoryId);
  await ensureSubCategoryBelongsToCategory(categoryId, subCategoryId);
}

async function validateTryoutWorkbookInput(data: {
  tryout: z.infer<typeof tryoutWorkbookTryoutSchema>;
  questions: z.infer<typeof tryoutWorkbookQuestionSchema>[];
}) {
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

export const listStudentsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      joinedAt: user.createdAt,
      displayName: studentProfiles.displayName,
      institution: studentProfiles.institution,
      status: studentProfiles.status,
      profileCompletedAt: studentProfiles.profileCompletedAt,
    })
    .from(user)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
    .orderBy(desc(user.createdAt));

  return rows.map((row) => ({
    ...row,
    joinedAt: row.joinedAt.toISOString(),
    profileCompletedAt: row.profileCompletedAt?.toISOString() ?? null,
    status: (row.status ?? "active") as "active" | "suspended",
  }));
});

export const listAdminsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      email: adminMembers.email,
      role: adminMembers.role,
      createdAt: adminMembers.createdAt,
      removedAt: adminMembers.removedAt,
    })
    .from(adminMembers)
    .orderBy(desc(adminMembers.createdAt));

  return rows.map((row) => ({
    email: row.email,
    role: row.role as "admin" | "super_admin",
    active: row.removedAt === null,
    createdAt: row.createdAt.toISOString(),
    removedAt: row.removedAt?.toISOString() ?? null,
  }));
});

export const setStudentStatusAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(studentStatusSchema, input))
  .handler(async ({ data }) => {
    const [existingProfile] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, data.studentUserId))
      .limit(1);

    if (!existingProfile) {
      throw notFound("Student profile was not found.");
    }

    await db
      .update(studentProfiles)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, data.studentUserId));

    return { ok: true };
  });

export const addAdminAdmin = createServerFn({ method: "POST" })
  .middleware([superAdminMiddleware])
  .inputValidator((input) => parseInput(addAdminSchema, input))
  .handler(async ({ context, data }) => {
    await db
      .insert(adminMembers)
      .values({
        email: data.email,
        role: data.role,
        createdByUserId: context.viewer.userId,
      })
      .onConflictDoUpdate({
        target: adminMembers.email,
        set: {
          role: data.role,
          removedAt: null,
          createdByUserId: context.viewer.userId,
        },
      });

    return { ok: true };
  });

export const removeAdminAdmin = createServerFn({ method: "POST" })
  .middleware([superAdminMiddleware])
  .inputValidator((input) => parseInput(removeAdminSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(adminMembers)
      .set({ removedAt: new Date() })
      .where(and(eq(adminMembers.email, data.email), isNull(adminMembers.removedAt)));

    return { ok: true };
});

export const listCategoriesAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      color: categories.color,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(categories.sortOrder, categories.name);

  return rows;
});

export const listCategoryOptionsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      sortOrder: categories.sortOrder,
      subCategoryId: subCategories.id,
      subCategoryName: subCategories.name,
      subCategorySortOrder: subCategories.sortOrder,
    })
    .from(categories)
    .leftJoin(subCategories, eq(subCategories.categoryId, categories.id))
    .orderBy(categories.sortOrder, categories.name, subCategories.sortOrder, subCategories.name);

  const categoryMap = new Map<string, {
    id: string;
    name: string;
    sortOrder: number;
    subCategories: { id: string; name: string; sortOrder: number }[];
  }>();

  for (const row of rows) {
    const category = categoryMap.get(row.id) ?? {
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      subCategories: [],
    };

    if (row.subCategoryId && row.subCategoryName) {
      category.subCategories.push({
        id: row.subCategoryId,
        name: row.subCategoryName,
        sortOrder: row.subCategorySortOrder ?? 0,
      });
    }

    categoryMap.set(row.id, category);
  }

  return Array.from(categoryMap.values());
});

export const listTryoutsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: tryouts.id,
      slug: tryouts.slug,
      title: tryouts.title,
      description: tryouts.description,
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
    accessLevel: row.accessLevel as "free" | "premium" | "platinum",
    status: row.status as "draft" | "published" | "unpublished",
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }));
});

export const createTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutInputSchema, input))
  .handler(async ({ data }) => {
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
  });

export const updateTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateTryoutSchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryExists(data.categoryId);

    const [existingTryout] = await db
      .select({ id: tryouts.id })
      .from(tryouts)
      .where(eq(tryouts.id, data.tryoutId))
      .limit(1);

    if (!existingTryout) {
      throw notFound("Try-out was not found.");
    }

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
  });

export const publishTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(tryouts)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tryouts.id, data.tryoutId));

    return { ok: true };
  });

export const unpublishTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(tryouts)
      .set({
        status: "unpublished",
        updatedAt: new Date(),
      })
      .where(eq(tryouts.id, data.tryoutId));

    return { ok: true };
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
        accessLevel: tryout.accessLevel as "free" | "premium" | "platinum",
        status: tryout.status as "draft" | "published" | "unpublished",
      },
      questions: rows.map((row) => ({
        ...row,
        optionE: row.optionE ?? "",
        videoUrl: row.videoUrl ?? "",
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
    await validateTryoutWorkbookInput(data);

    const [existingTryout] = await db
      .select({ id: tryouts.id })
      .from(tryouts)
      .where(eq(tryouts.id, data.tryoutId))
      .limit(1);

    if (!existingTryout) {
      throw notFound("Try-out was not found.");
    }

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
  });

export const createTryoutFromWorkbookAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createTryoutWorkbookSchema, input))
  .handler(async ({ data }) => {
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
  });

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

export const getAdminContentCounts = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const [tryoutCount] = await db.select({ count: sql<number>`count(*)` }).from(tryouts);
  const [questionCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);
  const [materiCount] = await db.select({ count: sql<number>`count(*)` }).from(materi);
  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(studentProfiles);
  const [activeStudentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentProfiles)
    .where(eq(studentProfiles.status, "active"));
  const [reportCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionReports)
    .where(eq(questionReports.status, "open"));
  const [completedAttemptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(attempts)
    .where(sql`${attempts.status} in ('submitted', 'auto_submitted')`);
  const [averageScore] = await db
    .select({ score: sql<number>`coalesce(round(avg(${attempts.score})), 0)` })
    .from(attempts)
    .where(sql`${attempts.status} in ('submitted', 'auto_submitted')`);
  const difficultQuestions = await db
    .select({
      questionId: attemptQuestionSnapshots.questionId,
      questionText: attemptQuestionSnapshots.questionText,
      totalAnswers: sql<number>`count(${attemptAnswers.id})`,
      correctAnswers: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
      accuracy: sql<number>`round(100.0 * sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end) / nullif(count(${attemptAnswers.id}), 0))`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attemptAnswers, eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id))
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .where(and(
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      sql`${attemptAnswers.selectedOption} is not null`,
    ))
    .groupBy(attemptQuestionSnapshots.questionId, attemptQuestionSnapshots.questionText)
    .having(sql`count(${attemptAnswers.id}) > 0`)
    .orderBy(sql`round(100.0 * sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end) / nullif(count(${attemptAnswers.id}), 0))`)
    .limit(5);
  const reportedQuestions = await db
    .select({
      questionId: questionReports.questionId,
      questionText: questions.questionText,
      openReports: sql<number>`count(${questionReports.id})`,
    })
    .from(questionReports)
    .innerJoin(questions, eq(questions.id, questionReports.questionId))
    .where(eq(questionReports.status, "open"))
    .groupBy(questionReports.questionId, questions.questionText)
    .orderBy(desc(sql`count(${questionReports.id})`))
    .limit(5);
  const tryoutParticipation = await db
    .select({
      tryoutId: tryouts.id,
      title: tryouts.title,
      completedAttempts: sql<number>`count(${attempts.id})`,
      averageScore: sql<number>`coalesce(round(avg(${attempts.score})), 0)`,
    })
    .from(tryouts)
    .leftJoin(
      attempts,
      and(
        eq(attempts.tryoutId, tryouts.id),
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      ),
    )
    .groupBy(tryouts.id)
    .orderBy(desc(sql`count(${attempts.id})`), tryouts.title)
    .limit(5);

  return {
    categories: Number(categoryCount?.count ?? 0),
    tryouts: Number(tryoutCount?.count ?? 0),
    questions: Number(questionCount?.count ?? 0),
    materi: Number(materiCount?.count ?? 0),
    students: Number(studentCount?.count ?? 0),
    activeStudents: Number(activeStudentCount?.count ?? 0),
    openReports: Number(reportCount?.count ?? 0),
    completedAttempts: Number(completedAttemptCount?.count ?? 0),
    averageScore: Number(averageScore?.score ?? 0),
    difficultQuestions: difficultQuestions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      totalAnswers: Number(question.totalAnswers ?? 0),
      correctAnswers: Number(question.correctAnswers ?? 0),
      accuracy: Number(question.accuracy ?? 0),
    })),
    reportedQuestions: reportedQuestions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      openReports: Number(question.openReports ?? 0),
    })),
    tryoutParticipation: tryoutParticipation.map((tryout) => ({
      tryoutId: tryout.tryoutId,
      title: tryout.title,
      completedAttempts: Number(tryout.completedAttempts ?? 0),
      averageScore: Number(tryout.averageScore ?? 0),
    })),
  };
});

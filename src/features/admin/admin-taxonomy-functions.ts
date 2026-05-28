import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  categories,
  materi,
  questions,
  subCategories,
  topics,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { conflict, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import {
  makeTaxonomyIndexes,
  previewTaxonomyWorkbook,
  resolveTaxonomyCategory,
  resolveTaxonomySubCategory,
  resolveTaxonomyTopic,
  type TaxonomyWorkbookData,
  type TaxonomyTreeCategory,
} from "./admin-taxonomy-workbook";
import { adminMiddleware } from "./admin-access";

const taxonomyNameSchema = z.string().trim().min(1).max(120);
const taxonomySortOrderSchema = z.number().int().min(0).max(10000);
const optionalTaxonomyIdSchema = z.string().trim().optional();

const createCategorySchema = z.object({
  name: taxonomyNameSchema,
  color: z.string().trim().max(40).optional(),
  sortOrder: taxonomySortOrderSchema,
});

const updateCategorySchema = createCategorySchema.extend({
  categoryId: z.string().trim().min(1),
});

const createSubCategorySchema = z.object({
  categoryId: z.string().trim().min(1),
  name: taxonomyNameSchema,
  sortOrder: taxonomySortOrderSchema,
});

const updateSubCategorySchema = z.object({
  subCategoryId: z.string().trim().min(1),
  name: taxonomyNameSchema,
  sortOrder: taxonomySortOrderSchema,
});

const createTopicSchema = z.object({
  subCategoryId: z.string().trim().min(1),
  name: taxonomyNameSchema,
  sortOrder: taxonomySortOrderSchema,
});

const updateTopicSchema = z.object({
  topicId: z.string().trim().min(1),
  name: taxonomyNameSchema,
  sortOrder: taxonomySortOrderSchema,
});

const subCategoryIdSchema = z.object({
  subCategoryId: z.string().trim().min(1),
});

const topicIdSchema = z.object({
  topicId: z.string().trim().min(1),
});

const importTaxonomyWorkbookSchema = z.object({
  categories: z.array(z.object({
    categoryId: optionalTaxonomyIdSchema,
    name: taxonomyNameSchema,
    color: z.string().trim().max(40).optional(),
    sortOrder: taxonomySortOrderSchema,
  })).max(1000),
  subCategories: z.array(z.object({
    subCategoryId: optionalTaxonomyIdSchema,
    categoryId: z.string().trim().min(1),
    name: taxonomyNameSchema,
    sortOrder: taxonomySortOrderSchema,
  })).max(3000),
  topics: z.array(z.object({
    topicId: optionalTaxonomyIdSchema,
    subCategoryId: z.string().trim().min(1),
    name: taxonomyNameSchema,
    sortOrder: taxonomySortOrderSchema,
  })).max(10000),
});

type TaxonomyExecutor = Pick<typeof db, "select" | "insert">;

type TaxonomyUsageScope =
  | { type: "sub-category"; id: string }
  | { type: "topic"; id: string };

type TaxonomyQuestionPreview = {
  id: string;
  questionText: string;
  status: "draft" | "published" | "unpublished";
  tryouts: { id: string; title: string }[];
};

type TaxonomyDeletionUsage = {
  questionCount: number;
  materiCount: number;
  questions: TaxonomyQuestionPreview[];
  materi: {
    id: string;
    title: string;
    status: "draft" | "published" | "unpublished";
  }[];
};

export async function ensureCategoryExists(categoryId: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (category) return;

  throw notFound("Category was not found.");
}

export async function ensureSubCategoryBelongsToCategory(categoryId: string, subCategoryId: string) {
  const [subCategory] = await db
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(eq(subCategories.id, subCategoryId), eq(subCategories.categoryId, categoryId)))
    .limit(1);

  if (subCategory) return;

  throw notFound("Sub-category was not found for this category.");
}

export async function ensureTopicBelongsToSubCategory(subCategoryId: string, topicId: string) {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.subCategoryId, subCategoryId)))
    .limit(1);

  if (topic) return;

  throw notFound("Topic was not found for this sub-category.");
}

async function ensureCategoryNameAvailable(name: string, currentCategoryId?: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`lower(trim(${categories.name})) = lower(trim(${name}))`)
    .limit(1);

  if (!category) return;
  if (category.id === currentCategoryId) return;

  throw conflict("A Category with this name already exists.");
}

async function ensureSubCategoryNameAvailable(categoryId: string, name: string, currentSubCategoryId?: string) {
  const [subCategory] = await db
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(
      eq(subCategories.categoryId, categoryId),
      sql`lower(trim(${subCategories.name})) = lower(trim(${name}))`,
    ))
    .limit(1);

  if (!subCategory) return;
  if (subCategory.id === currentSubCategoryId) return;

  throw conflict("A Sub-category with this name already exists in this Category.");
}

async function ensureTopicNameAvailable(subCategoryId: string, name: string, currentTopicId?: string) {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(and(
      eq(topics.subCategoryId, subCategoryId),
      sql`lower(trim(${topics.name})) = lower(trim(${name}))`,
    ))
    .limit(1);

  if (!topic) return;
  if (topic.id === currentTopicId) return;

  throw conflict("A Topic with this name already exists in this Sub-category.");
}

function makeTaxonomySlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  return `taxonomy-${Date.now()}`;
}

async function makeUniqueCategorySlug(tx: TaxonomyExecutor, name: string) {
  return makeUniqueTaxonomySlug(makeTaxonomySlug(name), async (slug) => {
    const [category] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    return Boolean(category);
  });
}

async function makeUniqueSubCategorySlug(tx: TaxonomyExecutor, categoryId: string, name: string) {
  return makeUniqueTaxonomySlug(makeTaxonomySlug(name), async (slug) => {
    const [subCategory] = await tx
      .select({ id: subCategories.id })
      .from(subCategories)
      .where(and(eq(subCategories.categoryId, categoryId), eq(subCategories.slug, slug)))
      .limit(1);

    return Boolean(subCategory);
  });
}

async function makeUniqueTopicSlugWithExecutor(tx: TaxonomyExecutor, subCategoryId: string, name: string) {
  const baseSlug = `${subCategoryId}-${makeTaxonomySlug(name)}`;

  return makeUniqueTaxonomySlug(baseSlug, async (slug) => {
    const [topic] = await tx
      .select({ id: topics.id })
      .from(topics)
      .where(sql`${topics.id} = ${slug} or (${topics.subCategoryId} = ${subCategoryId} and ${topics.slug} = ${slug})`)
      .limit(1);

    return Boolean(topic);
  });
}

async function makeUniqueTopicSlug(subCategoryId: string, name: string) {
  return makeUniqueTopicSlugWithExecutor(db, subCategoryId, name);
}

async function makeUniqueTaxonomySlug(
  baseSlug: string,
  slugExists: (slug: string) => Promise<boolean>,
) {
  if (!(await slugExists(baseSlug))) {
    return baseSlug;
  }

  for (let index = 2; index <= 100; index += 1) {
    const nextSlug = `${baseSlug}-${index}`;

    if (!(await slugExists(nextSlug))) {
      return nextSlug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
}

function getQuestionScopeCondition(scope: TaxonomyUsageScope) {
  if (scope.type === "topic") {
    return eq(questions.topicId, scope.id);
  }

  return eq(questions.subCategoryId, scope.id);
}

function getMateriScopeCondition(scope: TaxonomyUsageScope) {
  if (scope.type === "topic") {
    return eq(materi.topicId, scope.id);
  }

  return eq(materi.subCategoryId, scope.id);
}

async function countQuestionUsage(scope: TaxonomyUsageScope) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(getQuestionScopeCondition(scope));

  return row?.count ?? 0;
}

async function countMateriUsage(scope: TaxonomyUsageScope) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(materi)
    .where(getMateriScopeCondition(scope));

  return row?.count ?? 0;
}

async function listQuestionUsagePreview(scope: TaxonomyUsageScope): Promise<TaxonomyQuestionPreview[]> {
  const questionRows = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      status: questions.status,
      updatedAt: questions.updatedAt,
    })
    .from(questions)
    .where(getQuestionScopeCondition(scope))
    .orderBy(desc(questions.updatedAt))
    .limit(5);

  const questionIds = questionRows.map((row) => row.id);
  const tryoutMap = new Map<string, { id: string; title: string }[]>();

  if (questionIds.length > 0) {
    const tryoutRows = await db
      .select({
        questionId: tryoutQuestions.questionId,
        tryoutId: tryouts.id,
        tryoutTitle: tryouts.title,
      })
      .from(tryoutQuestions)
      .innerJoin(tryouts, eq(tryouts.id, tryoutQuestions.tryoutId))
      .where(inArray(tryoutQuestions.questionId, questionIds))
      .orderBy(tryouts.title);

    for (const row of tryoutRows) {
      const rows = tryoutMap.get(row.questionId) ?? [];

      rows.push({
        id: row.tryoutId,
        title: row.tryoutTitle,
      });

      tryoutMap.set(row.questionId, rows);
    }
  }

  return questionRows.map((row) => ({
    id: row.id,
    questionText: row.questionText,
    status: row.status as "draft" | "published" | "unpublished",
    tryouts: tryoutMap.get(row.id) ?? [],
  }));
}

async function listMateriUsagePreview(scope: TaxonomyUsageScope) {
  const rows = await db
    .select({
      id: materi.id,
      title: materi.title,
      status: materi.status,
    })
    .from(materi)
    .where(getMateriScopeCondition(scope))
    .orderBy(desc(materi.updatedAt))
    .limit(5);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status as "draft" | "published" | "unpublished",
  }));
}

async function getTaxonomyDeletionUsage(scope: TaxonomyUsageScope): Promise<TaxonomyDeletionUsage> {
  const [questionCount, materiCount, questionPreview, materiPreview] = await Promise.all([
    countQuestionUsage(scope),
    countMateriUsage(scope),
    listQuestionUsagePreview(scope),
    listMateriUsagePreview(scope),
  ]);

  return {
    questionCount,
    materiCount,
    questions: questionPreview,
    materi: materiPreview,
  };
}

function hasLiveContentUsage(usage: TaxonomyDeletionUsage) {
  return usage.questionCount > 0 || usage.materiCount > 0;
}

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

async function listCategoryOptionTree() {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      color: categories.color,
      sortOrder: categories.sortOrder,
      subCategoryId: subCategories.id,
      subCategorySlug: subCategories.slug,
      subCategoryName: subCategories.name,
      subCategorySortOrder: subCategories.sortOrder,
      topicId: topics.id,
      topicSlug: topics.slug,
      topicName: topics.name,
      topicSortOrder: topics.sortOrder,
    })
    .from(categories)
    .leftJoin(subCategories, eq(subCategories.categoryId, categories.id))
    .leftJoin(topics, eq(topics.subCategoryId, subCategories.id))
    .orderBy(categories.sortOrder, categories.name, subCategories.sortOrder, subCategories.name, topics.sortOrder, topics.name);

  const categoryMap = new Map<string, {
    id: string;
    slug: string;
    name: string;
    color: string | null;
    sortOrder: number;
    subCategories: {
      id: string;
      slug: string;
      name: string;
      sortOrder: number;
      topics: { id: string; slug: string; name: string; sortOrder: number }[];
    }[];
  }>();

  for (const row of rows) {
    const category = categoryMap.get(row.id) ?? {
      id: row.id,
      slug: row.slug,
      name: row.name,
      color: row.color,
      sortOrder: row.sortOrder,
      subCategories: [],
    };

    if (row.subCategoryId && row.subCategorySlug && row.subCategoryName) {
      let subCategory = category.subCategories.find((item) => item.id === row.subCategoryId);

      if (!subCategory) {
        subCategory = {
          id: row.subCategoryId,
          slug: row.subCategorySlug,
          name: row.subCategoryName,
          sortOrder: row.subCategorySortOrder ?? 0,
          topics: [],
        };
        category.subCategories.push(subCategory);
      }

      if (row.topicId && row.topicSlug && row.topicName) {
        subCategory.topics.push({
          id: row.topicId,
          slug: row.topicSlug,
          name: row.topicName,
          sortOrder: row.topicSortOrder ?? 0,
        });
      }
    }

    categoryMap.set(row.id, category);
  }

  return Array.from(categoryMap.values());
}

export const listCategoryOptionsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  return listCategoryOptionTree();
});

export const importTaxonomyWorkbookAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(importTaxonomyWorkbookSchema, input))
  .handler(async ({ data }) => {
    const currentTaxonomy = await listCategoryOptionTree();
    const preview = previewTaxonomyWorkbook(data, currentTaxonomy);

    if (preview.issues.length > 0) {
      throw conflict(preview.issues[0]?.message ?? "Taxonomy workbook has invalid rows.");
    }

    const result = await importTaxonomyWorkbook(data, currentTaxonomy);

    return {
      ok: true,
      ...result,
    };
  });

async function importTaxonomyWorkbook(data: TaxonomyWorkbookData, currentTaxonomy: TaxonomyTreeCategory[]) {
  const indexes = makeTaxonomyIndexes(currentTaxonomy);

  return db.transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const row of data.categories) {
      const target = resolveTaxonomyCategory(row, indexes);

      if (!target) {
        const slug = await makeUniqueCategorySlug(tx, row.name);

        await tx.insert(categories).values({
          slug,
          name: row.name,
          color: normalizeOptionalText(row.color),
          sortOrder: row.sortOrder,
        });
        created += 1;
        continue;
      }

      if (sameCategoryImportValues(target, row)) {
        unchanged += 1;
        continue;
      }

      await tx
        .update(categories)
        .set({
          name: row.name,
          color: normalizeOptionalText(row.color),
          sortOrder: row.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, target.id));
      updated += 1;
    }

    for (const row of data.subCategories) {
      const target = resolveTaxonomySubCategory(row, indexes);

      if (!target) {
        const slug = await makeUniqueSubCategorySlug(tx, row.categoryId, row.name);

        await tx.insert(subCategories).values({
          categoryId: row.categoryId,
          slug,
          name: row.name,
          sortOrder: row.sortOrder,
        });
        created += 1;
        continue;
      }

      if (sameSubCategoryImportValues(target, row)) {
        unchanged += 1;
        continue;
      }

      await tx
        .update(subCategories)
        .set({
          name: row.name,
          sortOrder: row.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(subCategories.id, target.id));
      updated += 1;
    }

    for (const row of data.topics) {
      const target = resolveTaxonomyTopic(row, indexes);

      if (!target) {
        const slug = await makeUniqueTopicSlugWithExecutor(tx, row.subCategoryId, row.name);

        await tx.insert(topics).values({
          id: slug,
          subCategoryId: row.subCategoryId,
          slug,
          name: row.name,
          sortOrder: row.sortOrder,
        });
        created += 1;
        continue;
      }

      if (sameTopicImportValues(target, row)) {
        unchanged += 1;
        continue;
      }

      await tx
        .update(topics)
        .set({
          name: row.name,
          sortOrder: row.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(topics.id, target.id));
      updated += 1;
    }

    return { created, updated, unchanged };
  });
}

function sameCategoryImportValues(
  current: TaxonomyTreeCategory,
  next: TaxonomyWorkbookData["categories"][number],
) {
  return (
    current.name === next.name &&
    (current.color ?? "") === (next.color ?? "") &&
    current.sortOrder === next.sortOrder
  );
}

function sameSubCategoryImportValues(
  current: TaxonomyTreeCategory["subCategories"][number],
  next: TaxonomyWorkbookData["subCategories"][number],
) {
  return current.name === next.name && current.sortOrder === next.sortOrder;
}

function sameTopicImportValues(
  current: TaxonomyTreeCategory["subCategories"][number]["topics"][number],
  next: TaxonomyWorkbookData["topics"][number],
) {
  return current.name === next.name && current.sortOrder === next.sortOrder;
}

export const createCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createCategorySchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryNameAvailable(data.name);

    try {
      await db.insert(categories).values({
        slug: makeTaxonomySlug(data.name),
        name: data.name,
        color: normalizeOptionalText(data.color),
        sortOrder: data.sortOrder,
      });
    } catch {
      throw conflict("A Category with this slug already exists.");
    }

    return { ok: true };
  });

export const updateCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateCategorySchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryExists(data.categoryId);
    await ensureCategoryNameAvailable(data.name, data.categoryId);

    await db
      .update(categories)
      .set({
        name: data.name,
        color: normalizeOptionalText(data.color),
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, data.categoryId));

    return { ok: true };
  });

export const createSubCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createSubCategorySchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryExists(data.categoryId);
    await ensureSubCategoryNameAvailable(data.categoryId, data.name);

    try {
      await db.insert(subCategories).values({
        categoryId: data.categoryId,
        slug: makeTaxonomySlug(data.name),
        name: data.name,
        sortOrder: data.sortOrder,
      });
    } catch {
      throw conflict("A Sub-category with this slug already exists in this Category.");
    }

    return { ok: true };
  });

export const updateSubCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateSubCategorySchema, input))
  .handler(async ({ data }) => {
    const [subCategory] = await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
      })
      .from(subCategories)
      .where(eq(subCategories.id, data.subCategoryId))
      .limit(1);

    if (!subCategory) {
      throw notFound("Sub-category was not found.");
    }

    await ensureSubCategoryNameAvailable(subCategory.categoryId, data.name, data.subCategoryId);

    await db
      .update(subCategories)
      .set({
        name: data.name,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(subCategories.id, data.subCategoryId));

    return { ok: true };
  });

export const createTopicAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createTopicSchema, input))
  .handler(async ({ data }) => {
    const [subCategory] = await db
      .select({ id: subCategories.id })
      .from(subCategories)
      .where(eq(subCategories.id, data.subCategoryId))
      .limit(1);

    if (!subCategory) {
      throw notFound("Sub-category was not found.");
    }

    await ensureTopicNameAvailable(data.subCategoryId, data.name);
    const slug = await makeUniqueTopicSlug(data.subCategoryId, data.name);

    try {
      await db.insert(topics).values({
        id: slug,
        subCategoryId: data.subCategoryId,
        slug,
        name: data.name,
        sortOrder: data.sortOrder,
      });
    } catch {
      throw conflict("A Topic with this slug already exists in this Sub-category.");
    }

    return { ok: true };
  });

export const updateTopicAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateTopicSchema, input))
  .handler(async ({ data }) => {
    const [topic] = await db
      .select({
        id: topics.id,
        subCategoryId: topics.subCategoryId,
      })
      .from(topics)
      .where(eq(topics.id, data.topicId))
      .limit(1);

    if (!topic) {
      throw notFound("Topic was not found.");
    }

    await ensureTopicNameAvailable(topic.subCategoryId, data.name, data.topicId);

    await db
      .update(topics)
      .set({
        name: data.name,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(topics.id, data.topicId));

    return { ok: true };
  });

async function getSubCategoryDeletionPreview(subCategoryId: string) {
  const [subCategory] = await db
    .select({
      id: subCategories.id,
      name: subCategories.name,
      categoryName: categories.name,
    })
    .from(subCategories)
    .innerJoin(categories, eq(categories.id, subCategories.categoryId))
    .where(eq(subCategories.id, subCategoryId))
    .limit(1);

  if (!subCategory) {
    throw notFound("Sub-category was not found.");
  }

  const childTopics = await db
    .select({
      id: topics.id,
      name: topics.name,
    })
    .from(topics)
    .where(eq(topics.subCategoryId, subCategoryId))
    .orderBy(topics.sortOrder, topics.name)
    .limit(5);

  const [childTopicCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(topics)
    .where(eq(topics.subCategoryId, subCategoryId));

  const usage = await getTaxonomyDeletionUsage({
    type: "sub-category",
    id: subCategoryId,
  });
  const childTopicCount = childTopicCountRow?.count ?? 0;

  return {
    kind: "sub-category" as const,
    node: {
      id: subCategory.id,
      name: subCategory.name,
      path: `${subCategory.categoryName} / ${subCategory.name}`,
    },
    canDelete: childTopicCount === 0 && !hasLiveContentUsage(usage),
    childTopicCount,
    childTopics,
    usage,
  };
}

async function getTopicDeletionPreview(topicId: string) {
  const [topic] = await db
    .select({
      id: topics.id,
      name: topics.name,
      subCategoryName: subCategories.name,
      categoryName: categories.name,
    })
    .from(topics)
    .innerJoin(subCategories, eq(subCategories.id, topics.subCategoryId))
    .innerJoin(categories, eq(categories.id, subCategories.categoryId))
    .where(eq(topics.id, topicId))
    .limit(1);

  if (!topic) {
    throw notFound("Topic was not found.");
  }

  const usage = await getTaxonomyDeletionUsage({
    type: "topic",
    id: topicId,
  });

  return {
    kind: "topic" as const,
    node: {
      id: topic.id,
      name: topic.name,
      path: `${topic.categoryName} / ${topic.subCategoryName} / ${topic.name}`,
    },
    canDelete: !hasLiveContentUsage(usage),
    childTopicCount: 0,
    childTopics: [],
    usage,
  };
}

export const getSubCategoryDeletionPreviewAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(subCategoryIdSchema, input))
  .handler(async ({ data }) => {
    return getSubCategoryDeletionPreview(data.subCategoryId);
  });

export const getTopicDeletionPreviewAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(topicIdSchema, input))
  .handler(async ({ data }) => {
    return getTopicDeletionPreview(data.topicId);
  });

export const deleteSubCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(subCategoryIdSchema, input))
  .handler(async ({ data }) => {
    const preview = await getSubCategoryDeletionPreview(data.subCategoryId);

    if (!preview.canDelete) {
      throw conflict("Sub-category cannot be removed until child Topics and live content are reclassified.");
    }

    await db
      .delete(subCategories)
      .where(eq(subCategories.id, data.subCategoryId));

    return { ok: true };
  });

export const deleteTopicAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(topicIdSchema, input))
  .handler(async ({ data }) => {
    const preview = await getTopicDeletionPreview(data.topicId);

    if (!preview.canDelete) {
      throw conflict("Topic cannot be removed until live content is reclassified.");
    }

    await db
      .delete(topics)
      .where(eq(topics.id, data.topicId));

    return { ok: true };
  });

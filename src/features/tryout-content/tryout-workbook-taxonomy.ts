import { and, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  categories,
  subCategories,
  topics,
} from "../../lib/db/schema";
import { conflict, notFound } from "../../lib/http/errors";
import type {
  TryoutWorkbookInput,
  TryoutWorkbookQuestion,
  TryoutWorkbookTryout,
} from "./tryout-content-types";

type TaxonomyExecutor = Pick<typeof db, "select" | "insert">;

export async function validateTryoutWorkbookInput(data: TryoutWorkbookInput) {
  validateCategoryReference(data.tryout);

  const questionIds = data.questions
    .map((question) => question.questionId)
    .filter((questionId): questionId is string => Boolean(questionId));
  const uniqueQuestionIds = new Set(questionIds);
  const sortOrders = data.questions.map((question) => question.sortOrder);
  const uniqueSortOrders = new Set(sortOrders);

  if (uniqueQuestionIds.size !== questionIds.length) {
    throw conflict("Ada ID soal yang sama lebih dari sekali. Periksa kolom question_id.");
  }

  if (uniqueSortOrders.size !== sortOrders.length) {
    throw conflict("Nomor urut soal tidak boleh sama. Periksa kolom sort_order.");
  }

  if (data.tryout.status === "published") {
    const publishedQuestions = data.questions.filter((question) => question.status === "published");

    if (publishedQuestions.length === 0) {
      throw conflict("Try-out published harus memiliki minimal satu soal published.");
    }
  }

  for (const question of data.questions) {
    validateQuestionOptionE(question);
    validateCategoryReference(question);
    validateSubCategoryReference(question);
    validateTopicReference(question);
  }
}

export async function resolveWorkbookTaxonomy(
  tx: TaxonomyExecutor,
  data: TryoutWorkbookInput,
): Promise<TryoutWorkbookInput> {
  const tryoutCategoryId = await resolveCategoryReference(tx, data.tryout);
  const resolvedQuestions: TryoutWorkbookQuestion[] = [];

  for (const question of data.questions) {
    const categoryId = await resolveCategoryReference(tx, question);
    const subCategoryId = await resolveSubCategoryReference(tx, categoryId, question);
    const topicId = await resolveTopicReference(tx, subCategoryId, question);

    resolvedQuestions.push({
      ...question,
      categoryId,
      subCategoryId,
      topicId,
    });
  }

  return {
    tryout: {
      ...data.tryout,
      categoryId: tryoutCategoryId,
    },
    questions: resolvedQuestions,
  };
}

export async function ensureCategoryExists(categoryId: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (category) return;

  throw notFound("Kategori tidak ditemukan. Muat ulang halaman dan pilih kategori yang tersedia.");
}

export async function ensureSubCategoryBelongsToCategory(categoryId: string, subCategoryId: string) {
  const [subCategory] = await db
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(eq(subCategories.id, subCategoryId), eq(subCategories.categoryId, categoryId)))
    .limit(1);

  if (subCategory) return;

  throw notFound("Subkategori tidak sesuai dengan kategori yang dipilih.");
}

export async function ensureTopicBelongsToSubCategory(subCategoryId: string, topicId: string) {
  const [topic] = await db
    .select({ id: topics.id })
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.subCategoryId, subCategoryId)))
    .limit(1);

  if (topic) return;

  throw notFound("Topik tidak sesuai dengan subkategori yang dipilih.");
}

export async function validateQuestionTaxonomy(categoryId: string, subCategoryId: string, topicId: string) {
  await ensureCategoryExists(categoryId);
  await ensureSubCategoryBelongsToCategory(categoryId, subCategoryId);
  await ensureTopicBelongsToSubCategory(subCategoryId, topicId);
}

export function validateQuestionOptionE(data: Pick<TryoutWorkbookQuestion, "correctOption" | "optionE">) {
  if (data.correctOption !== "E") return;
  if (data.optionE?.trim()) return;

  throw conflict("Isi pilihan E karena kunci jawaban adalah E.");
}

function validateCategoryReference(data: Pick<TryoutWorkbookTryout, "categoryId" | "categoryName">) {
  if (data.categoryId?.trim()) return;
  if (data.categoryName?.trim()) return;

  throw conflict("Isi category_name dengan nama kategori. ID boleh kosong.");
}

function validateSubCategoryReference(data: Pick<TryoutWorkbookQuestion, "subCategoryId" | "subCategoryName">) {
  if (data.subCategoryId?.trim()) return;
  if (data.subCategoryName?.trim()) return;

  throw conflict("Isi sub_category_name dengan nama subkategori. ID boleh kosong.");
}

function validateTopicReference(data: Pick<TryoutWorkbookQuestion, "topicId" | "topicName">) {
  if (data.topicId?.trim()) return;
  if (data.topicName?.trim()) return;

  throw conflict("Isi topic_name dengan nama topik. ID boleh kosong.");
}

async function resolveCategoryReference(
  tx: TaxonomyExecutor,
  data: Pick<TryoutWorkbookTryout, "categoryId" | "categoryName">,
) {
  const categoryId = data.categoryId?.trim() ?? "";

  if (categoryId) {
    await ensureCategoryExistsWithExecutor(tx, categoryId);
    return categoryId;
  }

  const categoryName = data.categoryName?.trim();

  if (!categoryName) {
    throw conflict("Isi category_name dengan nama kategori. ID boleh kosong.");
  }

  const [existingCategory] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(sql`lower(trim(${categories.name})) = lower(trim(${categoryName}))`)
    .limit(1);

  if (existingCategory) {
    return existingCategory.id;
  }

  const [sortOrderRow] = await tx
    .select({ maxSortOrder: sql<number | null>`max(${categories.sortOrder})` })
    .from(categories);
  const slug = await makeUniqueCategorySlug(tx, categoryName);
  const [createdCategory] = await tx
    .insert(categories)
    .values({
      slug,
      name: categoryName,
      sortOrder: Number(sortOrderRow?.maxSortOrder ?? 0) + 10,
    })
    .returning({ id: categories.id });

  return createdCategory.id;
}

async function resolveSubCategoryReference(
  tx: TaxonomyExecutor,
  categoryId: string,
  data: Pick<TryoutWorkbookQuestion, "subCategoryId" | "subCategoryName">,
) {
  const subCategoryId = data.subCategoryId?.trim() ?? "";

  if (subCategoryId) {
    await ensureSubCategoryBelongsToCategoryWithExecutor(tx, categoryId, subCategoryId);
    return subCategoryId;
  }

  const subCategoryName = data.subCategoryName?.trim();

  if (!subCategoryName) {
    throw conflict("Isi sub_category_name dengan nama subkategori. ID boleh kosong.");
  }

  const [existingSubCategory] = await tx
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(
      eq(subCategories.categoryId, categoryId),
      sql`lower(trim(${subCategories.name})) = lower(trim(${subCategoryName}))`,
    ))
    .limit(1);

  if (existingSubCategory) {
    return existingSubCategory.id;
  }

  const [sortOrderRow] = await tx
    .select({ maxSortOrder: sql<number | null>`max(${subCategories.sortOrder})` })
    .from(subCategories)
    .where(eq(subCategories.categoryId, categoryId));
  const slug = await makeUniqueSubCategorySlug(tx, categoryId, subCategoryName);
  const [createdSubCategory] = await tx
    .insert(subCategories)
    .values({
      categoryId,
      slug,
      name: subCategoryName,
      sortOrder: Number(sortOrderRow?.maxSortOrder ?? 0) + 10,
    })
    .returning({ id: subCategories.id });

  return createdSubCategory.id;
}

async function resolveTopicReference(
  tx: TaxonomyExecutor,
  subCategoryId: string,
  data: Pick<TryoutWorkbookQuestion, "topicId" | "topicName">,
) {
  const topicId = data.topicId?.trim() ?? "";

  if (topicId) {
    await ensureTopicBelongsToSubCategoryWithExecutor(tx, subCategoryId, topicId);
    return topicId;
  }

  const topicName = data.topicName?.trim();

  if (!topicName) {
    throw conflict("Isi topic_name dengan nama topik. ID boleh kosong.");
  }

  const [existingTopic] = await tx
    .select({ id: topics.id })
    .from(topics)
    .where(and(
      eq(topics.subCategoryId, subCategoryId),
      sql`lower(trim(${topics.name})) = lower(trim(${topicName}))`,
    ))
    .limit(1);

  if (existingTopic) {
    return existingTopic.id;
  }

  const [sortOrderRow] = await tx
    .select({ maxSortOrder: sql<number | null>`max(${topics.sortOrder})` })
    .from(topics)
    .where(eq(topics.subCategoryId, subCategoryId));
  const slug = await makeUniqueTopicSlug(tx, subCategoryId, topicName);
  const [createdTopic] = await tx
    .insert(topics)
    .values({
      id: slug,
      subCategoryId,
      slug,
      name: topicName,
      sortOrder: Number(sortOrderRow?.maxSortOrder ?? 0) + 10,
    })
    .returning({ id: topics.id });

  return createdTopic.id;
}

async function ensureCategoryExistsWithExecutor(tx: TaxonomyExecutor, categoryId: string) {
  const [category] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (category) return;

  throw notFound("Kategori tidak ditemukan. Muat ulang halaman dan pilih kategori yang tersedia.");
}

async function ensureSubCategoryBelongsToCategoryWithExecutor(
  tx: TaxonomyExecutor,
  categoryId: string,
  subCategoryId: string,
) {
  const [subCategory] = await tx
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(eq(subCategories.id, subCategoryId), eq(subCategories.categoryId, categoryId)))
    .limit(1);

  if (subCategory) return;

  throw notFound("Subkategori tidak sesuai dengan kategori yang dipilih.");
}

async function ensureTopicBelongsToSubCategoryWithExecutor(
  tx: TaxonomyExecutor,
  subCategoryId: string,
  topicId: string,
) {
  const [topic] = await tx
    .select({ id: topics.id })
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.subCategoryId, subCategoryId)))
    .limit(1);

  if (topic) return;

  throw notFound("Topik tidak sesuai dengan subkategori yang dipilih.");
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

async function makeUniqueTopicSlug(tx: TaxonomyExecutor, subCategoryId: string, name: string) {
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

function makeTaxonomySlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  return `taxonomy-${Date.now()}`;
}

import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { categories, subCategories } from "../../lib/db/schema";
import { conflict, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "./admin-access";

const taxonomyNameSchema = z.string().trim().min(1).max(120);
const taxonomySortOrderSchema = z.number().int().min(0).max(10000);

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

function makeTaxonomySlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  return `taxonomy-${Date.now()}`;
}

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
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

export const listCategoryOptionsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
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
    })
    .from(categories)
    .leftJoin(subCategories, eq(subCategories.categoryId, categories.id))
    .orderBy(categories.sortOrder, categories.name, subCategories.sortOrder, subCategories.name);

  const categoryMap = new Map<string, {
    id: string;
    slug: string;
    name: string;
    color: string | null;
    sortOrder: number;
    subCategories: { id: string; slug: string; name: string; sortOrder: number }[];
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
      category.subCategories.push({
        id: row.subCategoryId,
        slug: row.subCategorySlug,
        name: row.subCategoryName,
        sortOrder: row.subCategorySortOrder ?? 0,
      });
    }

    categoryMap.set(row.id, category);
  }

  return Array.from(categoryMap.values());
});

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

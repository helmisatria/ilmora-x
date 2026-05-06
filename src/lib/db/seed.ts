import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./client";
import {
  adminMembers,
  categories as categoriesTable,
  materi as materiTable,
  questions as questionsTable,
  subCategories,
  tryoutQuestions,
  tryouts as tryoutsTable,
} from "./schema";
import { categories } from "../../data/categories";
import { mockMateri } from "../../data/materi";
import { questionBank, tryouts } from "../../data/questions";

const optionLetters = ["A", "B", "C", "D", "E"] as const;

async function seedAdmins() {
  const activeAdmins = await db
    .select({ id: adminMembers.id })
    .from(adminMembers)
    .where(isNull(adminMembers.removedAt))
    .limit(1);

  if (activeAdmins.length > 0) return;

  const emails = getAdminEmails();
  if (emails.length === 0) return;

  await db.insert(adminMembers).values(
    emails.map((email, index) => ({
      email,
      role: index === 0 ? "super_admin" : "admin",
    })),
  );
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function seedCategories() {
  for (const category of categories) {
    await db
      .insert(categoriesTable)
      .values({
        id: category.id,
        slug: category.id,
        name: category.name,
        color: category.color,
      })
      .onConflictDoUpdate({
        target: categoriesTable.slug,
        set: {
          name: category.name,
          color: category.color,
          updatedAt: new Date(),
        },
      });

    for (const subCategory of category.subcategories) {
      await db
        .insert(subCategories)
        .values({
          id: subCategory.id,
          categoryId: category.id,
          slug: subCategory.id,
          name: subCategory.name,
        })
        .onConflictDoUpdate({
          target: [subCategories.categoryId, subCategories.slug],
          set: {
            name: subCategory.name,
            updatedAt: new Date(),
          },
        });
    }
  }
}

async function seedTryoutsAndQuestions() {
  for (const tryout of tryouts) {
    await db
      .insert(tryoutsTable)
      .values({
        id: String(tryout.id),
        slug: `tryout-${tryout.id}`,
        title: tryout.title,
        description: tryout.description,
        categoryId: tryout.categoryId,
        durationMinutes: tryout.duration,
        accessLevel: tryout.accessLevel,
        status: "published",
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tryoutsTable.slug,
        set: {
          title: tryout.title,
          description: tryout.description,
          durationMinutes: tryout.duration,
          accessLevel: tryout.accessLevel,
          status: "published",
          updatedAt: new Date(),
        },
      });

    const questions = questionBank[tryout.id] ?? [];

    for (const [index, question] of questions.entries()) {
      const options = question.options;

      await db
        .insert(questionsTable)
        .values({
          id: String(question.id),
          categoryId: question.categoryId,
          subCategoryId: question.subCategoryId,
          questionText: question.question,
          optionA: options[0] ?? "",
          optionB: options[1] ?? "",
          optionC: options[2] ?? "",
          optionD: options[3] ?? "",
          optionE: options[4] || null,
          correctOption: optionLetters[question.correct] ?? "A",
          explanation: question.explanation,
          videoUrl: question.videoUrl ?? null,
          accessLevel: question.accessLevel,
          status: question.published ? "published" : "draft",
        })
        .onConflictDoUpdate({
          target: questionsTable.id,
          set: {
            questionText: question.question,
            explanation: question.explanation,
            status: question.published ? "published" : "draft",
            updatedAt: new Date(),
          },
        });

      await db
        .insert(tryoutQuestions)
        .values({
          tryoutId: String(tryout.id),
          questionId: String(question.id),
          sortOrder: index + 1,
        })
        .onConflictDoNothing();
    }
  }
}

async function seedMateri() {
  for (const item of mockMateri) {
    await db
      .insert(materiTable)
      .values({
        id: String(item.id),
        title: item.title,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        bodyMarkdown: item.body,
        youtubeUrl: item.videoUrl ?? null,
        pdfFileKey: item.pdfUrl ?? null,
        accessLevel: item.accessLevel,
        status: "published",
      })
      .onConflictDoUpdate({
        target: materiTable.id,
        set: {
          title: item.title,
          bodyMarkdown: item.body,
          youtubeUrl: item.videoUrl ?? null,
          pdfFileKey: item.pdfUrl ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

async function assertSubCategoriesBelongToCategories() {
  for (const category of categories) {
    for (const subCategory of category.subcategories) {
      const matches = await db
        .select({ id: subCategories.id })
        .from(subCategories)
        .where(and(eq(subCategories.id, subCategory.id), eq(subCategories.categoryId, category.id)))
        .limit(1);

      if (matches.length === 0) {
        throw new Error(`Invalid seed taxonomy: ${subCategory.id} is not under ${category.id}.`);
      }
    }
  }
}

async function main() {
  await seedAdmins();
  await seedCategories();
  await assertSubCategoriesBelongToCategories();
  await seedTryoutsAndQuestions();
  await seedMateri();
  console.log("Seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

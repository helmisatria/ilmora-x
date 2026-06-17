import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { closeDb, db } from "./client";
import {
  adminMembers,
  categories as categoriesTable,
  materi as materiTable,
  products,
  questions as questionsTable,
  subCategories,
  topics,
  tryoutQuestions,
  tryouts as tryoutsTable,
} from "./schema";
import { categories } from "../../data/categories";
import { seedMateri as seedMateriItems } from "../../data/materi";
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

      for (const topic of subCategory.topics) {
        await db
          .insert(topics)
          .values({
            id: topic.id,
            subCategoryId: subCategory.id,
            slug: topic.id,
            name: topic.name,
          })
          .onConflictDoUpdate({
            target: [topics.subCategoryId, topics.slug],
            set: {
              name: topic.name,
              updatedAt: new Date(),
            },
          });
      }
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

    await db.delete(tryoutQuestions).where(eq(tryoutQuestions.tryoutId, String(tryout.id)));

    for (const [index, question] of questions.entries()) {
      const options = question.options;

      await db
        .insert(questionsTable)
        .values({
          id: String(question.id),
          categoryId: question.categoryId,
          subCategoryId: question.subCategoryId,
          topicId: question.topicId,
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
            categoryId: question.categoryId,
            subCategoryId: question.subCategoryId,
            topicId: question.topicId,
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
  for (const item of seedMateriItems) {
    await db
      .insert(materiTable)
      .values({
        id: String(item.id),
        title: item.title,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        topicId: item.topicId,
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
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          topicId: item.topicId,
          bodyMarkdown: item.body,
          youtubeUrl: item.videoUrl ?? null,
          pdfFileKey: item.pdfUrl ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

async function seedProducts() {
  await db
    .insert(products)
    .values([
      {
        id: "premium-30-days",
        name: "Premium 1 Bulan",
        type: "premium_membership",
        durationDays: 30,
        price: 49000,
        description: "Akses penuh selama 1 bulan",
        active: true,
      },
      {
        id: "premium-180-days",
        name: "Premium 6 Bulan",
        type: "premium_membership",
        durationDays: 180,
        price: 249000,
        description: "Akses penuh selama 6 bulan",
        active: true,
      },
      {
        id: "premium-365-days",
        name: "Premium 1 Tahun",
        type: "premium_membership",
        durationDays: 365,
        price: 399000,
        description: "Akses penuh selama 1 tahun",
        active: true,
      },
    ])
    .onConflictDoNothing();

  const paidTryouts = await db
    .select({
      id: tryoutsTable.id,
      title: tryoutsTable.title,
    })
    .from(tryoutsTable)
    .where(eq(tryoutsTable.accessLevel, "premium"));

  for (const tryout of paidTryouts) {
    await db
      .insert(products)
      .values({
        id: `lifetime-tryout-${tryout.id}`,
        name: `Try-out ${tryout.title}`,
        type: "lifetime_tryout",
        price: 19000,
        description: `Akses lifetime untuk ${tryout.title}`,
        active: true,
        contentType: "tryout",
        contentId: tryout.id,
      })
      .onConflictDoNothing();
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

async function assertTopicsBelongToSubCategories() {
  for (const category of categories) {
    for (const subCategory of category.subcategories) {
      for (const topic of subCategory.topics) {
        const matches = await db
          .select({ id: topics.id })
          .from(topics)
          .where(and(eq(topics.id, topic.id), eq(topics.subCategoryId, subCategory.id)))
          .limit(1);

        if (matches.length === 0) {
          throw new Error(`Invalid seed taxonomy: ${topic.id} is not under ${subCategory.id}.`);
        }
      }
    }
  }
}

async function main() {
  await seedAdmins();
  await seedCategories();
  await assertSubCategoriesBelongToCategories();
  await assertTopicsBelongToSubCategories();
  await seedTryoutsAndQuestions();
  await seedMateri();
  await seedProducts();
  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });

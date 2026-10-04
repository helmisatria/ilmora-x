import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import "dotenv/config";
const url = new URL(process.env.DATABASE_URL ?? "http://missing");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/ilmora_admin_qa") throw new Error("Use only isolated local ilmora_admin_qa.");
const { db, closeDb } = await import("../src/lib/db/client");
const { tryouts, questions, tryoutQuestions, categories, subCategories, topics } = await import("../src/lib/db/schema");
const { eq, and } = await import("drizzle-orm");
const content = await import("../src/features/tryout-content/tryout-content-management");
try {
  const [category] = await db.select().from(categories).limit(1);
  const [sub] = await db.select().from(subCategories).where(eq(subCategories.categoryId, category.id)).limit(1);
  const [topic] = await db.select().from(topics).where(eq(topics.subCategoryId, sub.id)).limit(1);
  const metadata = { title: `QA concurrency ${randomUUID()}`, description: "Local race check", categoryId: category.id, durationMinutes: 30, accessLevel: "free" as const, status: "published" as const };
  const question = { categoryId: category.id, subCategoryId: sub.id, topicId: topic.id, questionText: "Local QA", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctOption: "A" as const, explanation: "Local QA", accessLevel: "free" as const, status: "published" as const };
  const created = await content.createTryoutFromWorkbook({ tryout: metadata, questions: [1,2].map(sortOrder => ({ ...question, sortOrder })) });
  const [loaded] = await db.select().from(tryouts).where(eq(tryouts.id, created.id));
  const firstEdit = { ...metadata, tryoutId: created.id, expectedUpdatedAt: loaded.updatedAt.toISOString(), title: "Admin A saved" };
  const staleEdit = { ...firstEdit, title: "Admin B stale overwrite" };
  await content.updateTryoutContent(firstEdit);
  const staleResult = await Promise.allSettled([content.updateTryoutContent(staleEdit)]);
  const [saved] = await db.select().from(tryouts).where(eq(tryouts.id, created.id));
  const assigned = await db.select().from(tryoutQuestions).where(eq(tryoutQuestions.tryoutId, created.id));
  const results = await Promise.allSettled(assigned.map(row => content.removeTryoutQuestionContent({ tryoutId: created.id, questionId: row.questionId, expectedUpdatedAt: saved.updatedAt.toISOString() })));
  const remaining = await db.select().from(tryoutQuestions).innerJoin(questions, eq(questions.id, tryoutQuestions.questionId)).where(and(eq(tryoutQuestions.tryoutId, created.id), eq(questions.status, "published")));
    assert.equal(staleResult[0].status, "rejected");
    assert.equal(saved.title, "Admin A saved");
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(remaining.length, 1);
    console.log("PASS stale metadata rejected; parallel removal preserves a published question");
} finally {
  await closeDb();
}

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import "dotenv/config";

if (!process.env.DATABASE_URL || !["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname) || !new URL(process.env.DATABASE_URL).pathname.endsWith("ilmora_admin_qa")) {
  throw new Error("Use only the isolated ilmora_admin_qa local database.");
}
const { db, closeDb } = await import("../src/lib/db/client");
const schema = await import("../src/lib/db/schema");
const { eq, and } = await import("drizzle-orm");
const { createTryoutFromWorkbook, importTryoutWorkbook, updateTryoutQuestionContent, unpublishTryoutContent } = await import("../src/features/tryout-content/tryout-content-management");

try {
  const [category] = await db.select().from(schema.categories).limit(1);
  const [sub] = await db.select().from(schema.subCategories).where(eq(schema.subCategories.categoryId, category.id)).limit(1);
  const [topic] = await db.select().from(schema.topics).where(eq(schema.topics.subCategoryId, sub.id)).limit(1);
  const question = { sortOrder: 1, categoryId: category.id, subCategoryId: sub.id, topicId: topic.id,
    questionText: `QA shared ${randomUUID()}`, optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctOption: "B" as const,
    explanation: "Pembahasan awal", pictureUrl: "https://example.test/original.png", accessLevel: "free" as const, status: "published" as const };
  const makeTryout = (title: string) => ({ title, description: "QA local", categoryId: category.id, durationMinutes: 30, accessLevel: "free" as const, status: "published" as const });
  const first = await createTryoutFromWorkbook({ tryout: makeTryout(`QA source ${randomUUID()}`), questions: [question] });
  const [assignment] = await db.select().from(schema.tryoutQuestions).where(eq(schema.tryoutQuestions.tryoutId, first.id));
  const secondTryout = makeTryout(`QA copy ${randomUUID()}`);
  const second = await createTryoutFromWorkbook({ tryout: secondTryout, questions: [{ ...question, questionId: assignment.questionId }] });
  let [secondAssignment] = await db.select().from(schema.tryoutQuestions).where(eq(schema.tryoutQuestions.tryoutId, second.id));
  assert.equal(secondAssignment.questionId, assignment.questionId);
  await importTryoutWorkbook({ tryoutId: second.id, tryout: secondTryout,
    questions: [{ ...question, questionId: assignment.questionId, pictureUrl: undefined, explanation: "Pembahasan khusus salinan" }] });
  [secondAssignment] = await db.select().from(schema.tryoutQuestions).where(eq(schema.tryoutQuestions.tryoutId, second.id));
  assert.notEqual(secondAssignment.questionId, assignment.questionId);
  const [original] = await db.select().from(schema.questions).where(eq(schema.questions.id, assignment.questionId));
  const [copied] = await db.select().from(schema.questions).where(eq(schema.questions.id, secondAssignment.questionId));
  assert.equal(original.explanation, "Pembahasan awal");
  assert.equal(copied.explanation, "Pembahasan khusus salinan");
  assert.equal(copied.pictureUrl, question.pictureUrl);
  console.log("PASS shared workbook copy keeps picture and leaves source key/explanation unchanged");
  await assert.rejects(importTryoutWorkbook({ tryoutId: second.id, tryout: { ...secondTryout, title: "This must roll back" },
    questions: [{ ...question, questionId: "missing-question" }] }));
  const [afterRollback] = await db.select().from(schema.tryouts).where(eq(schema.tryouts.id, second.id));
  assert.equal(afterRollback.title, secondTryout.title);
  const [afterAssignment] = await db.select().from(schema.tryoutQuestions).where(eq(schema.tryoutQuestions.tryoutId, second.id));
  assert.equal(afterAssignment.questionId, copied.id);
  console.log("PASS failed workbook import rolls back metadata and assignments");
  await assert.rejects(updateTryoutQuestionContent({ ...question, tryoutId: first.id, questionId: assignment.questionId, status: "draft" }), /minimal satu soal tayang/);
  console.log("PASS detail cannot hide last published question");
  const [student] = await db.select().from(schema.user).where(eq(schema.user.email, "e2e-student@example.test"));
  await db.insert(schema.entitlements).values({studentUserId: student.id, source: "admin_grant", sourceId: randomUUID(),
    productType: "lifetime_tryout", contentType: "tryout", contentId: first.id, startsAt: new Date(), grantReason: "Local QA"});
  await assert.rejects(unpublishTryoutContent(first.id), /akses selamanya/);
  console.log("PASS lifetime-owned tryout cannot be hidden");
} finally { await closeDb(); }

import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { request } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { closeDb, db } from "../src/lib/db/client";
import {
  attemptAnswers,
  adminMembers,
  attemptQuestionSnapshots,
  attempts,
  categories,
  checkouts,
  questions,
  studentProfiles,
  subCategories,
  topics,
  tryoutQuestions,
  tryouts,
  user,
  weeklyLeaderboardSnapshots,
} from "../src/lib/db/schema";

const baseURL = process.env.E2E_BASE_URL;
const databaseURL = process.env.DATABASE_URL;
const adminEmail = "e2e-admin@example.test";
const studentEmail = "e2e-student@example.test";

if (!baseURL || !databaseURL) throw new Error("E2E_BASE_URL and DATABASE_URL are required.");
if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) {
  throw new Error("Fixture setup is restricted to a local app.");
}
if (!["localhost", "127.0.0.1"].includes(new URL(databaseURL).hostname)) {
  throw new Error("Fixture setup is restricted to a local database.");
}

async function signUp(email: string, name: string, stateFile: string) {
  const context = await request.newContext({ baseURL });
  const response = await context.post("/api/auth/sign-up/email", {
    data: { name, email, password: randomBytes(24).toString("base64url") },
  });
  if (!response.ok()) throw new Error(`Could not create ${email}: ${response.status()} ${await response.text()}`);
  await context.storageState({ path: stateFile });
  await context.dispose();

  const [account] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (!account) throw new Error(`Sign-up did not persist ${email}.`);
  return account.id;
}

function previousJakartaMonday() {
  const jakarta = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const daysSinceMonday = (jakarta.getUTCDay() + 6) % 7;
  jakarta.setUTCDate(jakarta.getUTCDate() - daysSinceMonday - 7);
  return jakarta.toISOString().slice(0, 10);
}

async function main() {
  const authDir = resolve("e2e/.auth");
  await mkdir(authDir, { recursive: true });
  const adminId = await signUp(adminEmail, "E2E Admin", resolve(authDir, "admin.json"));
  const secondAdminEmail = "e2e-admin-b@example.test";
  await signUp(secondAdminEmail, "E2E Admin B", resolve(authDir, "admin-b.json"));
  await db.insert(adminMembers).values({ email: secondAdminEmail, role: "admin" });
  const studentId = await signUp(studentEmail, "E2E Student", resolve(authDir, "free-student.json"));
  await db.insert(studentProfiles).values({
    userId: studentId,
    displayName: "E2E Student",
    institution: "E2E School",
    profileCompletedAt: new Date(),
  });

  const [question] = await db.select({
    tryoutId: tryouts.id,
    questionId: questions.id,
    categoryId: categories.id,
    categoryName: categories.name,
    subCategoryId: subCategories.id,
    subCategoryName: subCategories.name,
    topicId: topics.id,
    topicName: topics.name,
    questionText: questions.questionText,
    optionA: questions.optionA,
    optionB: questions.optionB,
    optionC: questions.optionC,
    optionD: questions.optionD,
    optionE: questions.optionE,
    correctOption: questions.correctOption,
    explanation: questions.explanation,
    accessLevel: questions.accessLevel,
  }).from(tryoutQuestions)
    .innerJoin(tryouts, eq(tryouts.id, tryoutQuestions.tryoutId))
    .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
    .innerJoin(categories, eq(categories.id, questions.categoryId))
    .innerJoin(subCategories, eq(subCategories.id, questions.subCategoryId))
    .innerJoin(topics, eq(topics.id, questions.topicId))
    .where(and(eq(tryouts.accessLevel, "free"), eq(questions.status, "published")))
    .limit(1);
  if (!question) throw new Error("The database seed has no published free question.");

  const now = new Date();
  const [attempt] = await db.insert(attempts).values({
    studentUserId: studentId,
    tryoutId: question.tryoutId,
    attemptNumber: 1,
    status: "submitted",
    startedAt: new Date(now.getTime() - 10 * 60_000),
    deadlineAt: new Date(now.getTime() + 20 * 60_000),
    submittedAt: now,
    score: 100,
    correctCount: 1,
    wrongCount: 0,
    totalQuestions: 1,
    xpEarned: 10,
  }).returning({ id: attempts.id });

  const [snapshot] = await db.insert(attemptQuestionSnapshots).values({
    attemptId: attempt.id,
    questionId: question.questionId,
    sortOrder: 1,
    categoryId: question.categoryId,
    categoryName: question.categoryName,
    subCategoryId: question.subCategoryId,
    subCategoryName: question.subCategoryName,
    topicId: question.topicId,
    topicName: question.topicName,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    optionE: question.optionE,
    correctOption: question.correctOption,
    explanation: question.explanation,
    accessLevel: question.accessLevel,
  }).returning({ id: attemptQuestionSnapshots.id });
  await db.insert(attemptAnswers).values({
    attemptId: attempt.id,
    snapshotId: snapshot.id,
    selectedOption: question.correctOption,
    isCorrect: true,
    answeredAt: now,
  });

  await db.insert(weeklyLeaderboardSnapshots).values({
    weekStartDate: previousJakartaMonday(),
    participantThreshold: 1,
    rankedStudentCount: 1,
    thresholdMet: true,
  });
  await db.insert(checkouts).values({
    studentUserId: studentId,
    status: "pending",
    productName: "E2E expired membership",
    productType: "premium_membership",
    durationDays: 30,
    baseAmount: 10000,
    finalAmount: 10000,
    paymentProvider: "midtrans",
    expiresAt: new Date(now.getTime() - 60_000),
  });
  console.log(`Prepared local E2E accounts and fixtures (admin ${adminId}, student ${studentId}).`);
}

try {
  await main();
} finally {
  await closeDb();
}

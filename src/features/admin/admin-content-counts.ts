import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  attemptAnswers,
  attemptQuestionSnapshots,
  attempts,
  activityEvents,
  categories,
  entitlements,
  materi,
  questionReports,
  questions,
  studentProfiles,
  tryouts,
  user,
} from "../../lib/db/schema";
import { adminMiddleware } from "./admin-access";

export const getAdminContentCounts = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const [tryoutCount] = await db.select({ count: sql<number>`count(*)` }).from(tryouts);
  const [questionCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);
  const [materiCount] = await db.select({ count: sql<number>`count(*)` }).from(materi);
  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(studentProfiles);
  const [newStudentCount, premiumStudentCount, activeStudentCount, periodAttemptCount, categoryPerformance, recentActivity] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(studentProfiles)
      .innerJoin(user, eq(user.id, studentProfiles.userId))
      .where(gte(user.createdAt, since))
      .then((rows) => rows[0]),
    db.select({ count: sql<number>`count(distinct ${entitlements.studentUserId})` })
      .from(entitlements)
      .innerJoin(studentProfiles, eq(studentProfiles.userId, entitlements.studentUserId))
      .where(and(eq(entitlements.productType, "premium_membership"), gt(entitlements.endsAt, now)))
      .then((rows) => rows[0]),
    db.select({ count: sql<number>`count(distinct ${activityEvents.studentUserId})` })
      .from(activityEvents)
      .where(and(
        gte(activityEvents.createdAt, since),
        inArray(activityEvents.eventType, ["login", "profile_completed", "tryout_started", "tryout_submitted", "question_reported", "materi_viewed"]),
      ))
      .then((rows) => rows[0]),
    db.select({ count: sql<number>`count(*)` })
      .from(attempts)
      .where(and(sql`${attempts.status} in ('submitted', 'auto_submitted')`, gte(attempts.submittedAt, since)))
      .then((rows) => rows[0]),
    db.select({
      category: attemptQuestionSnapshots.categoryName,
      answered: sql<number>`count(${attemptAnswers.id})`,
      correct: sql<number>`count(*) filter (where ${attemptAnswers.isCorrect} = true)`,
    })
      .from(attemptQuestionSnapshots)
      .innerJoin(attemptAnswers, eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id))
      .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
      .where(and(
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
        gte(attempts.submittedAt, since),
        sql`${attemptAnswers.selectedOption} is not null`,
      ))
      .groupBy(attemptQuestionSnapshots.categoryName)
      .orderBy(desc(sql`count(${attemptAnswers.id})`)),
    db.select({
      eventType: activityEvents.eventType,
      createdAt: activityEvents.createdAt,
      studentName: studentProfiles.displayName,
      accountName: user.name,
    })
      .from(activityEvents)
      .leftJoin(user, eq(user.id, activityEvents.studentUserId))
      .leftJoin(studentProfiles, eq(studentProfiles.userId, activityEvents.studentUserId))
      .where(and(
        gte(activityEvents.createdAt, since),
        inArray(activityEvents.eventType, ["login", "profile_completed", "tryout_started", "tryout_submitted", "question_reported", "materi_viewed"]),
      ))
      .orderBy(desc(activityEvents.createdAt))
      .limit(10),
  ]);
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
    periodDays: 30,
    categories: Number(categoryCount?.count ?? 0),
    tryouts: Number(tryoutCount?.count ?? 0),
    questions: Number(questionCount?.count ?? 0),
    materi: Number(materiCount?.count ?? 0),
    students: Number(studentCount?.count ?? 0),
    newStudents: Number(newStudentCount?.count ?? 0),
    premiumStudents: Number(premiumStudentCount?.count ?? 0),
    freeStudents: Math.max(0, Number(studentCount?.count ?? 0) - Number(premiumStudentCount?.count ?? 0)),
    activeStudents: Number(activeStudentCount?.count ?? 0),
    periodAttempts: Number(periodAttemptCount?.count ?? 0),
    answeredQuestions: categoryPerformance.reduce((total, category) => total + Number(category.answered), 0),
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
    categoryPerformance: categoryPerformance.map((category) => ({
      category: category.category,
      answered: Number(category.answered),
      correct: Number(category.correct),
    })),
    recentActivity: recentActivity.map((event) => ({
      eventType: event.eventType,
      studentName: event.studentName || event.accountName || "Unknown Student",
      createdAt: event.createdAt.toISOString(),
    })),
  };
});

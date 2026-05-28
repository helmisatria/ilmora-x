import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  attemptAnswers,
  attemptQuestionSnapshots,
  attempts,
  categories,
  materi,
  questionReports,
  questions,
  studentProfiles,
  tryouts,
} from "../../lib/db/schema";
import { adminMiddleware } from "./admin-access";

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

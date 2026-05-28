import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  attemptAnswers,
  attemptQuestionSnapshots,
  attempts,
  categories,
  studentBadges,
  studentExpLedger,
  tryouts,
} from "../../lib/db/schema";
import {
  buildStudentEvaluation,
  type StudentEvaluation,
  type StudentEvaluationAttemptRow,
  type StudentEvaluationCategoryRow,
  type StudentEvaluationSubCategoryRow,
  type StudentEvaluationTopicRow,
} from "./student-evaluation-model";

export { buildStudentEvaluation };
export type { StudentEvaluation } from "./student-evaluation-model";

export async function getStudentEvaluation(studentUserId: string): Promise<StudentEvaluation> {
  const submittedAttempts = await listSubmittedAttempts(studentUserId);
  const [categoryRows, subCategoryRows, topicRows, badgeRewardXp, badgeCodes] = await Promise.all([
    listCategoryBreakdownRows(studentUserId),
    listSubCategoryBreakdownRows(studentUserId),
    listTopicBreakdownRows(studentUserId),
    getBadgeRewardXp(studentUserId),
    listAwardedBadgeCodes(studentUserId),
  ]);

  return buildStudentEvaluation({
    submittedAttempts,
    categoryRows,
    subCategoryRows,
    topicRows,
    badgeRewardXp,
    badgeCodes,
  });
}

async function listTopicBreakdownRows(studentUserId: string): Promise<StudentEvaluationTopicRow[]> {
  return db
    .select({
      categoryId: attemptQuestionSnapshots.categoryId,
      subCategoryId: attemptQuestionSnapshots.subCategoryId,
      topicId: attemptQuestionSnapshots.topicId,
      topicName: attemptQuestionSnapshots.topicName,
      total: sql<number>`count(${attemptQuestionSnapshots.id})`,
      correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .leftJoin(
      attemptAnswers,
      and(
        eq(attemptAnswers.attemptId, attempts.id),
        eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
      ),
    )
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .groupBy(
      attemptQuestionSnapshots.categoryId,
      attemptQuestionSnapshots.subCategoryId,
      attemptQuestionSnapshots.topicId,
      attemptQuestionSnapshots.topicName,
    );
}

async function listSubmittedAttempts(studentUserId: string): Promise<StudentEvaluationAttemptRow[]> {
  return db
    .select({
      id: attempts.id,
      tryoutTitle: tryouts.title,
      attemptNumber: attempts.attemptNumber,
      status: attempts.status,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      score: attempts.score,
      correctCount: attempts.correctCount,
      wrongCount: attempts.wrongCount,
      totalQuestions: attempts.totalQuestions,
      xpEarned: attempts.xpEarned,
    })
    .from(attempts)
    .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .orderBy(desc(attempts.submittedAt));
}

async function listCategoryBreakdownRows(studentUserId: string): Promise<StudentEvaluationCategoryRow[]> {
  return db
    .select({
      categoryId: attemptQuestionSnapshots.categoryId,
      categoryName: attemptQuestionSnapshots.categoryName,
      categoryColor: categories.color,
      total: sql<number>`count(${attemptQuestionSnapshots.id})`,
      correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
    .leftJoin(
      attemptAnswers,
      and(
        eq(attemptAnswers.attemptId, attempts.id),
        eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
      ),
    )
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .groupBy(attemptQuestionSnapshots.categoryId, attemptQuestionSnapshots.categoryName, categories.color);
}

async function listSubCategoryBreakdownRows(studentUserId: string): Promise<StudentEvaluationSubCategoryRow[]> {
  return db
    .select({
      categoryId: attemptQuestionSnapshots.categoryId,
      subCategoryId: attemptQuestionSnapshots.subCategoryId,
      subCategoryName: attemptQuestionSnapshots.subCategoryName,
      total: sql<number>`count(${attemptQuestionSnapshots.id})`,
      correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .leftJoin(
      attemptAnswers,
      and(
        eq(attemptAnswers.attemptId, attempts.id),
        eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
      ),
    )
    .where(and(
      eq(attempts.studentUserId, studentUserId),
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
    ))
    .groupBy(
      attemptQuestionSnapshots.categoryId,
      attemptQuestionSnapshots.subCategoryId,
      attemptQuestionSnapshots.subCategoryName,
    );
}

async function getBadgeRewardXp(studentUserId: string) {
  const [row] = await db
    .select({
      xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
    })
    .from(studentExpLedger)
    .where(and(
      eq(studentExpLedger.studentUserId, studentUserId),
      eq(studentExpLedger.sourceType, "badge_reward"),
    ));

  return toNumber(row?.xp);
}

async function listAwardedBadgeCodes(studentUserId: string) {
  const rows = await db
    .select({ badgeCode: studentBadges.badgeCode })
    .from(studentBadges)
    .where(eq(studentBadges.studentUserId, studentUserId));

  return rows.map((row) => row.badgeCode);
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

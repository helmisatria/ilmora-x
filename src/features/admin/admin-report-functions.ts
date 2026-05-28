import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  attemptAnswers,
  attemptQuestionSnapshots,
  attempts,
  questionReports,
  tryouts,
  user,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "./admin-access";

const reportStatusSchema = z.enum(["open", "reviewed", "resolved", "dismissed"]);
const reportReasonSchema = z.enum(["answer_key_wrong", "explanation_wrong", "question_unclear", "typo", "other"]);

const reportFiltersSchema = z.object({
  status: z.union([reportStatusSchema, z.literal("all")]).optional(),
  reason: z.union([reportReasonSchema, z.literal("all")]).optional(),
  tryoutId: z.string().trim().optional(),
  questionId: z.string().trim().optional(),
});

const updateReportStatusSchema = z.object({
  reportId: z.string().trim().min(1),
  status: reportStatusSchema,
});

export const listQuestionReportsAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(reportFiltersSchema, input ?? {}))
  .handler(async ({ data }) => {
    const conditions = [];

    if (data.status && data.status !== "all") {
      conditions.push(eq(questionReports.status, data.status));
    }

    if (data.reason && data.reason !== "all") {
      conditions.push(eq(questionReports.reason, data.reason));
    }

    if (data.tryoutId) {
      conditions.push(eq(attempts.tryoutId, data.tryoutId));
    }

    if (data.questionId) {
      conditions.push(eq(questionReports.questionId, data.questionId));
    }

    const rows = await db
      .select({
        id: questionReports.id,
        status: questionReports.status,
        reason: questionReports.reason,
        note: questionReports.note,
        createdAt: questionReports.createdAt,
        resolvedAt: questionReports.resolvedAt,
        resolvedByUserId: questionReports.resolvedByUserId,
        studentUserId: questionReports.studentUserId,
        studentName: user.name,
        studentEmail: user.email,
        questionId: questionReports.questionId,
        attemptId: questionReports.attemptId,
        snapshotId: questionReports.snapshotId,
        tryoutId: attempts.tryoutId,
        tryoutTitle: tryouts.title,
        attemptNumber: attempts.attemptNumber,
        attemptScore: attempts.score,
        categoryName: attemptQuestionSnapshots.categoryName,
        subCategoryName: attemptQuestionSnapshots.subCategoryName,
        topicName: attemptQuestionSnapshots.topicName,
        questionText: attemptQuestionSnapshots.questionText,
        selectedOption: attemptAnswers.selectedOption,
        correctOption: attemptQuestionSnapshots.correctOption,
        explanation: attemptQuestionSnapshots.explanation,
      })
      .from(questionReports)
      .innerJoin(user, eq(user.id, questionReports.studentUserId))
      .innerJoin(attempts, eq(attempts.id, questionReports.attemptId))
      .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
      .innerJoin(attemptQuestionSnapshots, eq(attemptQuestionSnapshots.id, questionReports.snapshotId))
      .leftJoin(
        attemptAnswers,
        and(
          eq(attemptAnswers.attemptId, questionReports.attemptId),
          eq(attemptAnswers.snapshotId, questionReports.snapshotId),
        ),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionReports.createdAt));

    const tryoutRows = await db
      .select({
        id: tryouts.id,
        title: tryouts.title,
      })
      .from(questionReports)
      .innerJoin(attempts, eq(attempts.id, questionReports.attemptId))
      .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
      .groupBy(tryouts.id)
      .orderBy(tryouts.title);

    const questionRows = await db
      .select({
        id: questionReports.questionId,
        questionText: attemptQuestionSnapshots.questionText,
      })
      .from(questionReports)
      .innerJoin(attemptQuestionSnapshots, eq(attemptQuestionSnapshots.id, questionReports.snapshotId))
      .groupBy(questionReports.questionId, attemptQuestionSnapshots.questionText)
      .orderBy(attemptQuestionSnapshots.questionText);

    const reasonRows = await db
      .select({
        reason: questionReports.reason,
        count: sql<number>`count(*)`,
      })
      .from(questionReports)
      .groupBy(questionReports.reason)
      .orderBy(questionReports.reason);

    return {
      reports: rows.map((row) => ({
        ...row,
        status: row.status as "open" | "reviewed" | "resolved" | "dismissed",
        reason: row.reason as "answer_key_wrong" | "explanation_wrong" | "question_unclear" | "typo" | "other",
        selectedOption: row.selectedOption as "A" | "B" | "C" | "D" | "E" | null,
        correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
        createdAt: row.createdAt.toISOString(),
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        note: row.note ?? "",
        attemptScore: row.attemptScore ?? 0,
      })),
      tryouts: tryoutRows,
      questions: questionRows,
      reasons: reasonRows.map((row) => ({
        reason: row.reason as "answer_key_wrong" | "explanation_wrong" | "question_unclear" | "typo" | "other",
        count: Number(row.count ?? 0),
      })),
    };
  });

export const updateQuestionReportStatusAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateReportStatusSchema, input))
  .handler(async ({ context, data }) => {
    const [report] = await db
      .select({ id: questionReports.id })
      .from(questionReports)
      .where(eq(questionReports.id, data.reportId))
      .limit(1);

    if (!report) {
      throw notFound("Question report was not found.");
    }

    const reviewedAt = data.status === "open" ? null : new Date();
    const reviewedByUserId = data.status === "open" ? null : context.viewer.userId;

    await db
      .update(questionReports)
      .set({
        status: data.status,
        resolvedAt: reviewedAt,
        resolvedByUserId: reviewedByUserId,
      })
      .where(eq(questionReports.id, data.reportId));

    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  attempts,
  categories,
  tryoutQuestions,
  tryouts,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { normalizeTryoutAccessLevel } from "../premium-access/premium-access";
import { getStudentViewer } from "../student/student-viewer.server";
import {
  attemptOptionLetters,
  getAttemptStartState,
  saveAttemptForStudent,
  startOrResumeAttemptForStudent,
  submitAttemptForStudent,
} from "./attempt-lifecycle";

const tryoutIdSchema = z.object({
  tryoutId: z.string().trim().min(1),
});

const saveAttemptSchema = z.object({
  attemptId: z.string().trim().min(1),
  queuedAt: z.string().datetime(),
  lastQuestionIndex: z.number().int().min(0).max(1000),
  answers: z.array(z.object({
    snapshotId: z.string().trim().min(1),
    selectedOption: z.enum(attemptOptionLetters).nullable(),
  })).max(500),
  markedSnapshotIds: z.array(z.string().trim().min(1)).max(500),
});

const submitAttemptSchema = saveAttemptSchema.extend({
  autoSubmitReason: z.string().trim().max(120).optional(),
});

export const getTryoutPreparation = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    const [tryout] = await db
      .select({
        id: tryouts.id,
        title: tryouts.title,
        description: tryouts.description,
        icon: tryouts.icon,
        categoryId: tryouts.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        durationMinutes: tryouts.durationMinutes,
        accessLevel: tryouts.accessLevel,
        questionCount: sql<number>`count(${tryoutQuestions.id})`,
      })
      .from(tryouts)
      .innerJoin(categories, eq(categories.id, tryouts.categoryId))
      .leftJoin(tryoutQuestions, eq(tryoutQuestions.tryoutId, tryouts.id))
      .where(and(eq(tryouts.id, data.tryoutId), eq(tryouts.status, "published")))
      .groupBy(tryouts.id, categories.id)
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    const startState = await getAttemptStartState({
      studentUserId: viewer.userId,
      tryoutId: data.tryoutId,
      accessLevel: tryout.accessLevel,
    });
    const [activeAttempt] = await db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(
        eq(attempts.studentUserId, viewer.userId),
        eq(attempts.tryoutId, data.tryoutId),
        eq(attempts.status, "in_progress"),
      ))
      .limit(1);

    return {
      ...tryout,
      accessLevel: normalizeTryoutAccessLevel(tryout.accessLevel),
      categoryColor: tryout.categoryColor ?? "#205072",
      questionCount: Number(tryout.questionCount ?? 0),
      activeAttemptId: activeAttempt?.id ?? null,
      ...startState,
    };
  });

export const startOrResumeAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    return startOrResumeAttemptForStudent({
      viewer,
      tryoutId: data.tryoutId,
    });
  });

export const saveAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(saveAttemptSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    return saveAttemptForStudent({
      studentUserId: viewer.userId,
      data,
    });
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(submitAttemptSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();

    return submitAttemptForStudent({ viewer, data });
  });

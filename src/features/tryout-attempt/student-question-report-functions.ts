import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  activityEvents,
  attemptQuestionSnapshots,
  questionReports,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { assertAttemptOwner } from "../identity/access-rules";
import {
  getStudentImpersonationMetadata,
  getStudentViewer,
} from "../student/student-viewer.server";
import { getAttemptForStudent } from "./attempt-lifecycle";

const reportQuestionSchema = z.object({
  attemptId: z.string().trim().min(1),
  snapshotId: z.string().trim().min(1),
  reason: z.enum(["answer_key_wrong", "explanation_wrong", "question_unclear", "typo", "other"]),
  note: z.string().trim().max(1000).optional(),
});

export const reportAttemptQuestion = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(reportQuestionSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();
    const attempt = await getAttemptForStudent(data.attemptId);

    assertAttemptOwner(viewer, attempt.studentUserId);

    const [snapshot] = await db
      .select({
        id: attemptQuestionSnapshots.id,
        questionId: attemptQuestionSnapshots.questionId,
      })
      .from(attemptQuestionSnapshots)
      .where(and(
        eq(attemptQuestionSnapshots.id, data.snapshotId),
        eq(attemptQuestionSnapshots.attemptId, data.attemptId),
      ))
      .limit(1);

    if (!snapshot) {
      throw notFound("Question was not found for this Attempt.");
    }

    await db.transaction(async (tx) => {
      await tx.insert(questionReports).values({
        studentUserId: viewer.userId,
        questionId: snapshot.questionId,
        attemptId: data.attemptId,
        snapshotId: snapshot.id,
        reason: data.reason,
        note: data.note || null,
      });

      await tx.insert(activityEvents).values({
        studentUserId: viewer.userId,
        eventType: "question_reported",
        metadata: {
          attemptId: data.attemptId,
          snapshotId: snapshot.id,
          reason: data.reason,
          ...getStudentImpersonationMetadata(viewer),
        },
      });
    });

    return { ok: true };
  });

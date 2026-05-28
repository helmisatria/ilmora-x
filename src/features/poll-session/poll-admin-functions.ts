import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { getCurrentViewerFromHeaders } from "../../lib/auth-functions";
import { db } from "../../lib/db/client";
import {
  pollParticipants,
  pollRoundPlanItems,
  pollRounds,
  pollSessions,
} from "../../lib/db/schema";
import { badRequest, conflict, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { requireAdmin } from "../identity/admin-membership";
import {
  hasAnyTeacherContent,
  pollOptionLetters,
  resolvePollRoundTeacherContent,
  toOptionalPollText,
  type PollOption,
} from "./poll-session";
import {
  closeOpenRound,
  getPlanItemById,
  getRoundById,
  getSessionById,
  getSessionDetail,
  publishPollSessionChanged,
  recalculateRoundAnswers,
  toIso,
} from "./poll-session-records";

const pollOptionSchema = z.enum(pollOptionLetters);
const pollAccessModeSchema = z.enum(["open_guest", "login_required"]);

const createPollSessionSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  accessMode: pollAccessModeSchema.default("open_guest"),
});

const sessionIdSchema = z.object({
  sessionId: z.string().trim().min(1),
});

const archivePollSessionSchema = sessionIdSchema.extend({
  archived: z.boolean(),
});

const createPollRoundSchema = z.object({
  sessionId: z.string().trim().min(1),
  planItemId: z.string().trim().min(1).optional(),
  label: z.string().trim().max(80).optional(),
  questionText: z.string().trim().max(2000).optional(),
  optionA: z.string().trim().max(500).optional(),
  optionB: z.string().trim().max(500).optional(),
  optionC: z.string().trim().max(500).optional(),
  optionD: z.string().trim().max(500).optional(),
  optionE: z.string().trim().max(500).optional(),
  correctOption: pollOptionSchema,
  timerSeconds: z.number().int().min(5).max(600).nullable().optional(),
});

const pollRoundPlanItemSchema = z.object({
  label: z.string().trim().max(80).optional(),
  questionText: z.string().trim().min(1).max(2000),
  optionA: z.string().trim().min(1).max(500),
  optionB: z.string().trim().min(1).max(500),
  optionC: z.string().trim().min(1).max(500),
  optionD: z.string().trim().min(1).max(500),
  optionE: z.string().trim().max(500).optional(),
  correctOption: pollOptionSchema,
  timerSeconds: z.number().int().min(5).max(600).nullable().optional(),
}).superRefine((item, context) => {
  if (item.correctOption !== "E") return;
  if (item.optionE?.trim()) return;

  context.addIssue({
    code: "custom",
    message: "Option E is required when the correct option is E.",
    path: ["optionE"],
  });
});

const importPollRoundPlanSchema = sessionIdSchema.extend({
  items: z.array(pollRoundPlanItemSchema).min(1).max(500),
});

const closePollRoundSchema = z.object({
  roundId: z.string().trim().min(1),
});

const planItemIdSchema = z.object({
  planItemId: z.string().trim().min(1),
});

const correctPollRoundSchema = closePollRoundSchema.extend({
  correctOption: pollOptionSchema,
});

async function getAdminViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  await requireAdmin(viewer?.sessionEmail);

  if (!viewer) {
    throw notFound("Admin viewer was not found.");
  }

  return viewer;
}

const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const viewer = await getAdminViewer();

  return next({ context: { viewer } });
});

function makeDefaultSessionTitle() {
  return `Kelas ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date())}`;
}

async function generateOpenPollCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const [existing] = await db
      .select({ id: pollSessions.id })
      .from(pollSessions)
      .where(and(eq(pollSessions.code, code), eq(pollSessions.status, "open")))
      .limit(1);

    if (!existing) return code;
  }

  throw conflict("Could not allocate a Poll code. Try again.");
}

async function getReopenCode(sessionId: string, currentCode: string) {
  const [existingOpenSession] = await db
    .select({ id: pollSessions.id })
    .from(pollSessions)
    .where(and(eq(pollSessions.code, currentCode), eq(pollSessions.status, "open")))
    .limit(1);

  if (!existingOpenSession || existingOpenSession.id === sessionId) {
    return currentCode;
  }

  return generateOpenPollCode();
}

export const listPollSessionsAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sessions = await db
      .select({
        id: pollSessions.id,
        title: pollSessions.title,
        code: pollSessions.code,
        status: pollSessions.status,
        accessMode: pollSessions.accessMode,
        openedAt: pollSessions.openedAt,
        closedAt: pollSessions.closedAt,
        archivedAt: pollSessions.archivedAt,
        participantCount: sql<number>`count(distinct ${pollParticipants.id})`,
        roundCount: sql<number>`count(distinct ${pollRounds.id})`,
      })
      .from(pollSessions)
      .leftJoin(pollParticipants, eq(pollParticipants.sessionId, pollSessions.id))
      .leftJoin(pollRounds, eq(pollRounds.sessionId, pollSessions.id))
      .groupBy(pollSessions.id)
      .orderBy(desc(pollSessions.openedAt));

    return sessions.map((session) => ({
      ...session,
      status: session.status as "draft" | "open" | "closed",
      accessMode: session.accessMode as "open_guest" | "login_required",
      openedAt: session.openedAt.toISOString(),
      closedAt: toIso(session.closedAt),
      archivedAt: toIso(session.archivedAt),
      participantCount: Number(session.participantCount ?? 0),
      roundCount: Number(session.roundCount ?? 0),
    }));
  });

export const getPollSessionAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(sessionIdSchema, input))
  .handler(async ({ data }) => getSessionDetail(data.sessionId));

export const importPollRoundPlanAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(importPollRoundPlanSchema, input))
  .handler(async ({ data }) => {
    const session = await getSessionById(data.sessionId);

    if (session.archivedAt) {
      throw conflict("Unarchive the Poll Session before replacing its plan.");
    }

    if (session.status === "closed") {
      throw conflict("Reopen the Poll Session before replacing its plan.");
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .delete(pollRoundPlanItems)
        .where(and(eq(pollRoundPlanItems.sessionId, session.id), ne(pollRoundPlanItems.status, "started")));

      const [lastStartedItem] = await tx
        .select({ sortOrder: pollRoundPlanItems.sortOrder })
        .from(pollRoundPlanItems)
        .where(eq(pollRoundPlanItems.sessionId, session.id))
        .orderBy(desc(pollRoundPlanItems.sortOrder))
        .limit(1);
      const baseSortOrder = lastStartedItem?.sortOrder ?? 0;

      await tx.insert(pollRoundPlanItems).values(data.items.map((item, index) => ({
        sessionId: session.id,
        sortOrder: baseSortOrder + index + 1,
        status: "planned",
        label: toOptionalPollText(item.label),
        questionText: item.questionText,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        optionE: toOptionalPollText(item.optionE),
        correctOption: item.correctOption,
        timerSeconds: item.timerSeconds ?? null,
        createdAt: now,
        updatedAt: now,
      })));
    });

    const detail = await getSessionDetail(session.id);
    await publishPollSessionChanged(session.id);

    return detail;
  });

export const skipPollRoundPlanItemAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(planItemIdSchema, input))
  .handler(async ({ data }) => {
    const planItem = await getPlanItemById(data.planItemId);

    if (planItem.status !== "planned") {
      throw conflict("Only planned Poll Round rows can be skipped.");
    }

    await db
      .update(pollRoundPlanItems)
      .set({
        status: "skipped",
        skippedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pollRoundPlanItems.id, planItem.id));

    const detail = await getSessionDetail(planItem.sessionId);
    await publishPollSessionChanged(planItem.sessionId);

    return detail;
  });

export const createPollSessionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createPollSessionSchema, input ?? {}))
  .handler(async ({ context, data }) => {
    const now = new Date();
    const code = await generateOpenPollCode();
    const [session] = await db
      .insert(pollSessions)
      .values({
        title: data.title?.trim() || makeDefaultSessionTitle(),
        code,
        status: "open",
        accessMode: data.accessMode,
        createdByAdminUserId: context.viewer.sessionUserId,
        openedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: pollSessions.id });

    const detail = await getSessionDetail(session.id);
    await publishPollSessionChanged(session.id);

    return detail;
  });

export const createPollRoundAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createPollRoundSchema, input))
  .handler(async ({ data }) => {
    const session = await getSessionById(data.sessionId);
    const planItem = data.planItemId ? await getPlanItemById(data.planItemId) : null;

    if (session.status !== "open") {
      throw conflict("Poll Session is not open.");
    }

    if (planItem && planItem.sessionId !== session.id) {
      throw conflict("Poll Round Plan item does not belong to this Poll Session.");
    }

    if (planItem && planItem.status !== "planned") {
      throw conflict("Poll Round Plan item has already been used.");
    }

    const now = new Date();
    let closedRoundId: string | null = null;
    let closedRoundCorrectOption: PollOption = "A";
    const contentData = planItem && !hasAnyTeacherContent(data)
      ? {
          ...data,
          questionText: planItem.questionText,
          optionA: planItem.optionA,
          optionB: planItem.optionB,
          optionC: planItem.optionC,
          optionD: planItem.optionD,
          optionE: planItem.optionE ?? undefined,
        }
      : data;
    const teacherContentResult = resolvePollRoundTeacherContent(contentData);

    if (!teacherContentResult.ok) {
      throw badRequest(teacherContentResult.message);
    }

    const teacherContent = teacherContentResult.content;

    await db.transaction(async (tx) => {
      const [openRound] = await tx
        .select()
        .from(pollRounds)
        .where(and(eq(pollRounds.sessionId, session.id), eq(pollRounds.status, "open")))
        .orderBy(desc(pollRounds.roundNumber))
        .limit(1);

      if (openRound) {
        await tx
          .update(pollRounds)
          .set({
            status: "closed",
            closedAt: now,
            updatedAt: now,
          })
          .where(eq(pollRounds.id, openRound.id));

        closedRoundId = openRound.id;
        closedRoundCorrectOption = openRound.correctOption as PollOption;
      }

      const [lastRound] = await tx
        .select({ roundNumber: pollRounds.roundNumber })
        .from(pollRounds)
        .where(eq(pollRounds.sessionId, session.id))
        .orderBy(desc(pollRounds.roundNumber))
        .limit(1);
      const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
      const [round] = await tx
        .insert(pollRounds)
        .values({
          sessionId: session.id,
          roundNumber,
          label: data.label?.trim() || planItem?.label?.trim() || `Round ${roundNumber}`,
          questionText: teacherContent.questionText,
          optionA: teacherContent.optionA,
          optionB: teacherContent.optionB,
          optionC: teacherContent.optionC,
          optionD: teacherContent.optionD,
          optionE: teacherContent.optionE,
          correctOption: data.correctOption,
          status: "open",
          timerSeconds: data.timerSeconds === undefined ? planItem?.timerSeconds ?? null : data.timerSeconds,
          openedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: pollRounds.id });

      if (!planItem) return;

      await tx
        .update(pollRoundPlanItems)
        .set({
          status: "started",
          startedRoundId: round.id,
          startedAt: now,
          updatedAt: now,
        })
        .where(eq(pollRoundPlanItems.id, planItem.id));
    });

    if (closedRoundId) {
      await recalculateRoundAnswers(closedRoundId, closedRoundCorrectOption, now);
    }

    const detail = await getSessionDetail(session.id);
    await publishPollSessionChanged(session.id);

    return detail;
  });

export const closePollRoundAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(closePollRoundSchema, input))
  .handler(async ({ data }) => {
    const round = await getRoundById(data.roundId);

    if (round.status === "closed") {
      return getSessionDetail(round.sessionId);
    }

    const now = new Date();

    await db
      .update(pollRounds)
      .set({
        status: "closed",
        closedAt: now,
        updatedAt: now,
      })
      .where(eq(pollRounds.id, round.id));
    await recalculateRoundAnswers(round.id, round.correctOption as PollOption, now);

    const detail = await getSessionDetail(round.sessionId);
    await publishPollSessionChanged(round.sessionId);

    return detail;
  });

export const correctPollRoundAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(correctPollRoundSchema, input))
  .handler(async ({ context, data }) => {
    const round = await getRoundById(data.roundId);

    if (round.status !== "closed") {
      throw conflict("Only closed Poll Rounds can be corrected.");
    }

    await db
      .update(pollRounds)
      .set({
        correctOption: data.correctOption,
        correctedAt: new Date(),
        correctedByAdminUserId: context.viewer.sessionUserId,
        updatedAt: new Date(),
      })
      .where(eq(pollRounds.id, round.id));
    await recalculateRoundAnswers(round.id, data.correctOption);

    const detail = await getSessionDetail(round.sessionId);
    await publishPollSessionChanged(round.sessionId);

    return detail;
  });

export const closePollSessionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(sessionIdSchema, input))
  .handler(async ({ data }) => {
    const session = await getSessionById(data.sessionId);
    const now = new Date();

    await closeOpenRound(session.id, now);
    await db
      .update(pollSessions)
      .set({
        status: "closed",
        closedAt: session.closedAt ?? now,
        updatedAt: now,
      })
      .where(eq(pollSessions.id, session.id));

    const detail = await getSessionDetail(session.id);
    await publishPollSessionChanged(session.id);

    return detail;
  });

export const reopenPollSessionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(sessionIdSchema, input))
  .handler(async ({ data }) => {
    const session = await getSessionById(data.sessionId);

    if (session.status === "open") {
      return getSessionDetail(session.id);
    }

    const code = await getReopenCode(session.id, session.code);
    await db
      .update(pollSessions)
      .set({
        status: "open",
        code,
        closedAt: null,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(pollSessions.id, session.id));

    const detail = await getSessionDetail(session.id);
    await publishPollSessionChanged(session.id);

    return detail;
  });

export const archivePollSessionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(archivePollSessionSchema, input))
  .handler(async ({ data }) => {
    const session = await getSessionById(data.sessionId);

    if (data.archived && session.status === "open") {
      throw conflict("Close the Poll Session before archiving it.");
    }

    await db
      .update(pollSessions)
      .set({
        archivedAt: data.archived ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(pollSessions.id, session.id));

    const detail = await getSessionDetail(session.id);
    await publishPollSessionChanged(session.id);

    return detail;
  });

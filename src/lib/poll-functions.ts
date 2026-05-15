import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, asc, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentViewerFromHeaders } from "./auth-functions";
import { db } from "./db/client";
import {
  pollAnswers,
  pollParticipants,
  pollRoundPlanItems,
  pollRounds,
  pollSessions,
} from "./db/schema";
import { requireAdmin } from "./domain/admin";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "./http/errors";
import { parseInput } from "./http/validation";

const pollOptionSchema = z.enum(["A", "B", "C", "D", "E"]);
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

const joinPollSessionSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/),
  displayName: z.string().trim().min(1).max(80).optional(),
  participantToken: z.string().trim().min(12).max(160).optional(),
});

const pollStateSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/),
  participantToken: z.string().trim().min(12).max(160).optional(),
});

const submitPollAnswerSchema = z.object({
  roundId: z.string().trim().min(1),
  participantToken: z.string().trim().min(12).max(160),
  selectedOption: pollOptionSchema,
});

type PollOption = z.infer<typeof pollOptionSchema>;

type ParticipantScore = {
  participantId: string;
  displayName: string;
  totalPoints: number;
  correctAnswers: number;
  answeredRounds: number;
};

async function requireAvailableDisplayName(sessionId: string, displayName: string, currentParticipantId?: string) {
  const nameMatches = sql`lower(${pollParticipants.displayName}) = lower(${displayName})`;
  const duplicateFilter = currentParticipantId
    ? and(eq(pollParticipants.sessionId, sessionId), nameMatches, ne(pollParticipants.id, currentParticipantId))
    : and(eq(pollParticipants.sessionId, sessionId), nameMatches);

  const [duplicateParticipant] = await db
    .select({ id: pollParticipants.id })
    .from(pollParticipants)
    .where(duplicateFilter)
    .limit(1);

  if (duplicateParticipant) {
    throw conflict("Nama sudah dipakai di sesi ini.");
  }
}

async function getViewer() {
  const request = getRequest();

  return getCurrentViewerFromHeaders(request.headers);
}

async function getAdminViewer() {
  const viewer = await getViewer();

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

function toIso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function toOptionalText(value: string | null | undefined) {
  const text = value?.trim() ?? "";

  if (!text) return null;

  return text;
}

function hasAnyTeacherContent(data: {
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
}) {
  return Boolean(
    toOptionalText(data.questionText)
      || toOptionalText(data.optionA)
      || toOptionalText(data.optionB)
      || toOptionalText(data.optionC)
      || toOptionalText(data.optionD)
      || toOptionalText(data.optionE),
  );
}

function getRoundTeacherContent(data: z.infer<typeof createPollRoundSchema>) {
  if (!hasAnyTeacherContent(data)) {
    return {
      questionText: null,
      optionA: null,
      optionB: null,
      optionC: null,
      optionD: null,
      optionE: null,
    };
  }

  const content = {
    questionText: toOptionalText(data.questionText),
    optionA: toOptionalText(data.optionA),
    optionB: toOptionalText(data.optionB),
    optionC: toOptionalText(data.optionC),
    optionD: toOptionalText(data.optionD),
    optionE: toOptionalText(data.optionE),
  };

  if (!content.questionText || !content.optionA || !content.optionB || !content.optionC || !content.optionD) {
    throw badRequest("Question text and options A-D are required for teacher-facing content.");
  }

  if (data.correctOption === "E" && !content.optionE) {
    throw badRequest("Option E is required when the correct option is E.");
  }

  return content;
}

function makeParticipantToken() {
  return randomUUID();
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

function getDisplayNameFromViewer(viewer: Awaited<ReturnType<typeof getViewer>>) {
  if (!viewer) return "";

  return viewer.profile?.displayName || viewer.name || viewer.email;
}

function calculatePoints({
  selectedOption,
  correctOption,
  responseMs,
}: {
  selectedOption: PollOption;
  correctOption: PollOption;
  responseMs: number;
}) {
  if (selectedOption !== correctOption) return 0;

  const elapsedSeconds = Math.floor(responseMs / 1000);

  return Math.max(500, 1000 - elapsedSeconds * 10);
}

async function getOpenSessionByCode(code: string) {
  const [session] = await db
    .select()
    .from(pollSessions)
    .where(and(eq(pollSessions.code, code), eq(pollSessions.status, "open"), isNull(pollSessions.archivedAt)))
    .limit(1);

  if (session) return session;

  throw notFound("Poll Session was not found or has closed.");
}

async function getSessionById(sessionId: string) {
  const [session] = await db
    .select()
    .from(pollSessions)
    .where(eq(pollSessions.id, sessionId))
    .limit(1);

  if (session) return session;

  throw notFound("Poll Session was not found.");
}

async function getRoundById(roundId: string) {
  const [round] = await db
    .select()
    .from(pollRounds)
    .where(eq(pollRounds.id, roundId))
    .limit(1);

  if (round) return round;

  throw notFound("Poll Round was not found.");
}

async function getPlanItemById(planItemId: string) {
  const [planItem] = await db
    .select()
    .from(pollRoundPlanItems)
    .where(eq(pollRoundPlanItems.id, planItemId))
    .limit(1);

  if (planItem) return planItem;

  throw notFound("Poll Round Plan item was not found.");
}

async function closeOpenRound(sessionId: string, now = new Date()) {
  const [round] = await db
    .select()
    .from(pollRounds)
    .where(and(eq(pollRounds.sessionId, sessionId), eq(pollRounds.status, "open")))
    .orderBy(desc(pollRounds.roundNumber))
    .limit(1);

  if (!round) return null;

  await db
    .update(pollRounds)
    .set({
      status: "closed",
      closedAt: now,
      updatedAt: now,
    })
    .where(eq(pollRounds.id, round.id));

  await recalculateRoundAnswers(round.id, round.correctOption as PollOption, now);

  return round;
}

const MILLISECONDS_IN_A_SECOND = 1000;

function isRoundExpiredAt(round: typeof pollRounds.$inferSelect, now: Date) {
  if (!round.timerSeconds) return false;

  const elapsedMs = now.getTime() - round.openedAt.getTime();
  const limitMs = round.timerSeconds * MILLISECONDS_IN_A_SECOND;

  return elapsedMs >= limitMs;
}

async function closeExpiredOpenRoundBySession(sessionId: string, now = new Date()) {
  const [round] = await db
    .select()
    .from(pollRounds)
    .where(and(eq(pollRounds.sessionId, sessionId), eq(pollRounds.status, "open")))
    .orderBy(desc(pollRounds.roundNumber))
    .limit(1);

  if (!round) return null;
  if (!isRoundExpiredAt(round, now)) return null;

  await db
    .update(pollRounds)
    .set({
      status: "closed",
      closedAt: now,
      updatedAt: now,
    })
    .where(eq(pollRounds.id, round.id));

  await recalculateRoundAnswers(round.id, round.correctOption as PollOption, now);
  await publishPollSessionChanged(sessionId);

  return round;
}

async function recalculateRoundAnswers(roundId: string, correctOption: PollOption, now = new Date()) {
  const answers = await db
    .select({
      id: pollAnswers.id,
      selectedOption: pollAnswers.selectedOption,
      responseMs: pollAnswers.responseMs,
    })
    .from(pollAnswers)
    .where(eq(pollAnswers.roundId, roundId));

  for (const answer of answers) {
    const selectedOption = answer.selectedOption as PollOption;

    await db
      .update(pollAnswers)
      .set({
        isCorrect: selectedOption === correctOption,
        points: calculatePoints({
          selectedOption,
          correctOption,
          responseMs: answer.responseMs,
        }),
        updatedAt: now,
      })
      .where(eq(pollAnswers.id, answer.id));
  }
}

async function getParticipantScores(sessionId: string) {
  const participants = await db
    .select({
      id: pollParticipants.id,
      displayName: pollParticipants.displayName,
    })
    .from(pollParticipants)
    .where(eq(pollParticipants.sessionId, sessionId))
    .orderBy(asc(pollParticipants.joinedAt));

  const answers = await db
    .select({
      participantId: pollAnswers.participantId,
      points: pollAnswers.points,
      isCorrect: pollAnswers.isCorrect,
    })
    .from(pollAnswers)
    .innerJoin(pollRounds, eq(pollRounds.id, pollAnswers.roundId))
    .where(and(eq(pollRounds.sessionId, sessionId), eq(pollRounds.status, "closed")));

  const scoreMap = new Map<string, ParticipantScore>();

  for (const participant of participants) {
    scoreMap.set(participant.id, {
      participantId: participant.id,
      displayName: participant.displayName,
      totalPoints: 0,
      correctAnswers: 0,
      answeredRounds: 0,
    });
  }

  for (const answer of answers) {
    const score = scoreMap.get(answer.participantId);

    if (!score) continue;

    score.totalPoints += answer.points;
    score.answeredRounds += 1;

    if (answer.isCorrect) {
      score.correctAnswers += 1;
    }
  }

  return [...scoreMap.values()].sort((first, second) => {
    if (second.totalPoints !== first.totalPoints) return second.totalPoints - first.totalPoints;
    if (second.correctAnswers !== first.correctAnswers) return second.correctAnswers - first.correctAnswers;

    return first.displayName.localeCompare(second.displayName);
  }).map((score, index) => ({
    ...score,
    rank: index + 1,
  }));
}

async function getSessionDetail(sessionId: string) {
  const session = await getSessionById(sessionId);
  await closeExpiredOpenRoundBySession(session.id);
  const [participants, rounds, planItems, answers, scores] = await Promise.all([
    db
      .select()
      .from(pollParticipants)
      .where(eq(pollParticipants.sessionId, sessionId))
      .orderBy(asc(pollParticipants.joinedAt)),
    db
      .select()
      .from(pollRounds)
      .where(eq(pollRounds.sessionId, sessionId))
      .orderBy(asc(pollRounds.roundNumber)),
    db
      .select()
      .from(pollRoundPlanItems)
      .where(eq(pollRoundPlanItems.sessionId, sessionId))
      .orderBy(asc(pollRoundPlanItems.sortOrder)),
    db
      .select({
        id: pollAnswers.id,
        roundId: pollAnswers.roundId,
        participantId: pollAnswers.participantId,
        selectedOption: pollAnswers.selectedOption,
        isCorrect: pollAnswers.isCorrect,
        points: pollAnswers.points,
        responseMs: pollAnswers.responseMs,
        answeredAt: pollAnswers.answeredAt,
      })
      .from(pollAnswers)
      .innerJoin(pollRounds, eq(pollRounds.id, pollAnswers.roundId))
      .where(eq(pollRounds.sessionId, sessionId)),
    getParticipantScores(sessionId),
  ]);
  const answerCounts = new Map<string, Record<PollOption, number>>();
  const roundAnswers = new Map<string, typeof answers>();

  for (const round of rounds) {
    answerCounts.set(round.id, { A: 0, B: 0, C: 0, D: 0, E: 0 });
    roundAnswers.set(round.id, []);
  }

  for (const answer of answers) {
    const counts = answerCounts.get(answer.roundId);
    const selectedOption = answer.selectedOption as PollOption;

    if (counts) {
      counts[selectedOption] += 1;
    }

    roundAnswers.get(answer.roundId)?.push(answer);
  }

  const activeRound = rounds.find((round) => round.status === "open") ?? null;

  return {
    session: {
      id: session.id,
      title: session.title,
      code: session.code,
      status: session.status as "draft" | "open" | "closed",
      accessMode: session.accessMode as "open_guest" | "login_required",
      createdByAdminUserId: session.createdByAdminUserId,
      openedAt: session.openedAt.toISOString(),
      closedAt: toIso(session.closedAt),
      archivedAt: toIso(session.archivedAt),
      createdAt: session.createdAt.toISOString(),
    },
    participants: participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      studentUserId: participant.studentUserId,
      joinedAt: participant.joinedAt.toISOString(),
    })),
    rounds: rounds.map((round) => {
      const counts = answerCounts.get(round.id) ?? { A: 0, B: 0, C: 0, D: 0, E: 0 };
      const totalAnswers = Object.values(counts).reduce((total, value) => total + value, 0);

      return {
        id: round.id,
        roundNumber: round.roundNumber,
        label: round.label,
        questionText: round.questionText,
        optionA: round.optionA,
        optionB: round.optionB,
        optionC: round.optionC,
        optionD: round.optionD,
        optionE: round.optionE,
        correctOption: round.correctOption as PollOption,
        status: round.status as "open" | "closed",
        timerSeconds: round.timerSeconds,
        openedAt: round.openedAt.toISOString(),
        closedAt: toIso(round.closedAt),
        correctedAt: toIso(round.correctedAt),
        counts,
        totalAnswers,
        answers: (roundAnswers.get(round.id) ?? []).map((answer) => ({
          id: answer.id,
          participantId: answer.participantId,
          selectedOption: answer.selectedOption as PollOption,
          isCorrect: answer.isCorrect,
          points: answer.points,
          responseMs: answer.responseMs,
          answeredAt: answer.answeredAt.toISOString(),
        })),
      };
    }),
    planItems: planItems.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      status: item.status as "planned" | "started" | "skipped",
      label: item.label,
      questionText: item.questionText,
      optionA: item.optionA,
      optionB: item.optionB,
      optionC: item.optionC,
      optionD: item.optionD,
      optionE: item.optionE,
      correctOption: item.correctOption as PollOption,
      timerSeconds: item.timerSeconds,
      startedRoundId: item.startedRoundId,
      startedAt: toIso(item.startedAt),
      skippedAt: toIso(item.skippedAt),
    })),
    activeRoundId: activeRound?.id ?? null,
    scores,
  };
}

async function publishPollSessionChanged(sessionId: string) {
  try {
    const { publishPollEvent } = await import("./poll-events");
    const [session] = await db
      .select({ id: pollSessions.id, code: pollSessions.code })
      .from(pollSessions)
      .where(eq(pollSessions.id, sessionId))
      .limit(1);

    if (!session) return;

    await publishPollEvent({
      type: "poll-updated",
      sessionId: session.id,
      code: session.code,
      occurredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Poll live update was not published.", error);
  }
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
        label: toOptionalText(item.label),
        questionText: item.questionText,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        optionE: toOptionalText(item.optionE),
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
    const teacherContent = getRoundTeacherContent(contentData);

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

export const joinPollSession = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(joinPollSessionSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getViewer();
    const session = await getOpenSessionByCode(data.code);

    if (session.accessMode === "login_required" && !viewer) {
      throw unauthorized("Login is required for this Poll Session.");
    }

    const displayName = data.displayName?.trim() || getDisplayNameFromViewer(viewer) || "";

    if (!displayName) {
      throw badRequest("Display name is required.");
    }

    if (viewer) {
      const [existingParticipant] = await db
        .select()
        .from(pollParticipants)
        .where(and(eq(pollParticipants.sessionId, session.id), eq(pollParticipants.studentUserId, viewer.userId)))
        .limit(1);

      if (existingParticipant) {
        await requireAvailableDisplayName(session.id, displayName, existingParticipant.id);

        await db
          .update(pollParticipants)
          .set({
            displayName,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(pollParticipants.id, existingParticipant.id));

        await publishPollSessionChanged(session.id);

        return {
          code: session.code,
          participantToken: existingParticipant.guestToken,
          participantId: existingParticipant.id,
        };
      }
    }

    if (data.participantToken) {
      const [existingParticipant] = await db
        .select()
        .from(pollParticipants)
        .where(and(eq(pollParticipants.sessionId, session.id), eq(pollParticipants.guestToken, data.participantToken)))
        .limit(1);

      if (existingParticipant) {
        await requireAvailableDisplayName(session.id, displayName, existingParticipant.id);

        await db
          .update(pollParticipants)
          .set({
            displayName,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(pollParticipants.id, existingParticipant.id));

        await publishPollSessionChanged(session.id);

        return {
          code: session.code,
          participantToken: existingParticipant.guestToken,
          participantId: existingParticipant.id,
        };
      }
    }

    await requireAvailableDisplayName(session.id, displayName);

    const token = data.participantToken || makeParticipantToken();
    const [participant] = await db
      .insert(pollParticipants)
      .values({
        sessionId: session.id,
        studentUserId: viewer?.userId ?? null,
        displayName,
        guestToken: token,
      })
      .returning({ id: pollParticipants.id });

    await publishPollSessionChanged(session.id);

    return {
      code: session.code,
      participantToken: token,
      participantId: participant.id,
    };
  });

export const getPollStudentState = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(pollStateSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getViewer();
    const session = await getOpenSessionByCode(data.code).catch(async () => {
      const [closedSession] = await db
        .select()
        .from(pollSessions)
        .where(eq(pollSessions.code, data.code))
        .orderBy(desc(pollSessions.openedAt))
        .limit(1);

      if (closedSession) return closedSession;

      throw notFound("Poll Session was not found.");
    });
    const participantConditions = [eq(pollParticipants.sessionId, session.id)];

    if (viewer) {
      participantConditions.push(eq(pollParticipants.studentUserId, viewer.userId));
    } else if (data.participantToken) {
      participantConditions.push(eq(pollParticipants.guestToken, data.participantToken));
    } else {
      return {
        joined: false,
        session: {
          title: session.title,
          code: session.code,
          status: session.status as "draft" | "open" | "closed",
        },
      };
    }

    const [participant] = await db
      .select()
      .from(pollParticipants)
      .where(and(...participantConditions))
      .limit(1);

    if (!participant) {
      return {
        joined: false,
        session: {
          title: session.title,
          code: session.code,
          status: session.status as "draft" | "open" | "closed",
        },
      };
    }

    await db
      .update(pollParticipants)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(pollParticipants.id, participant.id));

    const detail = await getSessionDetail(session.id);
    const activeRound = detail.rounds.find((round) => round.status === "open") ?? null;
    const latestRound = [...detail.rounds].reverse()[0] ?? null;
    const visibleRound = activeRound ?? latestRound;
    const myAnswer = visibleRound
      ? visibleRound.answers.find((answer) => answer.participantId === participant.id) ?? null
      : null;
    const myScore = detail.scores.find((score) => score.participantId === participant.id) ?? null;

    return {
      joined: true,
      participant: {
        id: participant.id,
        displayName: participant.displayName,
      },
      session: detail.session,
      round: visibleRound
        ? {
            id: visibleRound.id,
            label: visibleRound.label,
            roundNumber: visibleRound.roundNumber,
            status: visibleRound.status,
            openedAt: visibleRound.openedAt,
            closedAt: visibleRound.closedAt,
            timerSeconds: visibleRound.timerSeconds,
            correctOption: visibleRound.status === "closed" ? visibleRound.correctOption : null,
            counts: visibleRound.status === "closed" ? visibleRound.counts : null,
            totalAnswers: visibleRound.totalAnswers,
          }
        : null,
      participantStatuses: detail.participants.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        answered: activeRound
          ? activeRound.answers.some((answer) => answer.participantId === item.id)
          : false,
      })),
      myAnswer: myAnswer
        ? {
            selectedOption: myAnswer.selectedOption,
            isCorrect: visibleRound?.status === "closed" ? myAnswer.isCorrect : null,
            points: visibleRound?.status === "closed" ? myAnswer.points : null,
          }
        : null,
      myScore,
      topScores: detail.scores.slice(0, 5),
    };
  });

export const submitPollAnswer = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(submitPollAnswerSchema, input))
  .handler(async ({ data }) => {
    const round = await getRoundById(data.roundId);
    const now = new Date();

    await closeExpiredOpenRoundBySession(round.sessionId, now);

    const [activeRound] = await db
      .select()
      .from(pollRounds)
      .where(eq(pollRounds.id, round.id))
      .limit(1);

    if (!activeRound || activeRound.status !== "open") {
      throw conflict("Poll Round is already closed.");
    }

    const [participant] = await db
      .select()
      .from(pollParticipants)
      .where(and(eq(pollParticipants.sessionId, round.sessionId), eq(pollParticipants.guestToken, data.participantToken)))
      .limit(1);

    if (!participant) {
      throw forbidden("Join the Poll Session before answering.");
    }

    const [existingAnswer] = await db
      .select({ id: pollAnswers.id })
      .from(pollAnswers)
      .where(and(eq(pollAnswers.roundId, round.id), eq(pollAnswers.participantId, participant.id)))
      .limit(1);

    const responseMs = Math.max(now.getTime() - activeRound.openedAt.getTime(), 0);
    const answerValues = {
      selectedOption: data.selectedOption,
      isCorrect: false,
      points: 0,
      responseMs,
      answeredAt: now,
      updatedAt: now,
    };

    if (existingAnswer) {
      await db
        .update(pollAnswers)
        .set(answerValues)
        .where(eq(pollAnswers.id, existingAnswer.id));

      await publishPollSessionChanged(round.sessionId);

      return { ok: true };
    }

    await db.insert(pollAnswers).values({
      roundId: round.id,
      participantId: participant.id,
      ...answerValues,
      createdAt: now,
    });

    await publishPollSessionChanged(round.sessionId);

    return { ok: true };
  });

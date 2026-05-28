import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentViewerFromHeaders } from "../../lib/auth-functions";
import { db } from "../../lib/db/client";
import {
  pollAnswers,
  pollParticipants,
  pollRounds,
  pollSessions,
} from "../../lib/db/schema";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import {
  buildPollStudentState,
  pollOptionLetters,
} from "./poll-session";
import {
  closeExpiredOpenRoundBySession,
  getOpenSessionByCode,
  getRoundById,
  getSessionDetail,
  publishPollSessionChanged,
} from "./poll-session-records";

const pollOptionSchema = z.enum(pollOptionLetters);

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

async function getViewer() {
  const request = getRequest();

  return getCurrentViewerFromHeaders(request.headers);
}

function getDisplayNameFromViewer(viewer: Awaited<ReturnType<typeof getViewer>>) {
  if (!viewer) return "";

  return viewer.profile?.displayName || viewer.name || viewer.email;
}

function makeParticipantToken() {
  return randomUUID();
}

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

function getUnjoinedPollState(session: {
  title: string;
  code: string;
  status: string;
}) {
  return {
    joined: false as const,
    session: {
      title: session.title,
      code: session.code,
      status: session.status as "draft" | "open" | "closed",
    },
    round: null,
    participantStatuses: [],
    myAnswer: null,
    myScore: null,
    topScores: [],
  };
}

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
      return getUnjoinedPollState(session);
    }

    const [participant] = await db
      .select()
      .from(pollParticipants)
      .where(and(...participantConditions))
      .limit(1);

    if (!participant) {
      return getUnjoinedPollState(session);
    }

    await db
      .update(pollParticipants)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(pollParticipants.id, participant.id));

    const detail = await getSessionDetail(session.id);

    return buildPollStudentState({
      detail,
      participant,
    });
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

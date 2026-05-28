import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  pollAnswers,
  pollParticipants,
  pollRoundPlanItems,
  pollRounds,
  pollSessions,
} from "../../lib/db/schema";
import { notFound } from "../../lib/http/errors";
import {
  buildPollSessionDetail,
  calculatePollRoundPoints,
  isPollRoundExpiredAt,
  rankPollParticipantScores,
  type PollOption,
} from "./poll-session";

export function toIso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

export async function getOpenSessionByCode(code: string) {
  const [session] = await db
    .select()
    .from(pollSessions)
    .where(and(eq(pollSessions.code, code), eq(pollSessions.status, "open"), isNull(pollSessions.archivedAt)))
    .limit(1);

  if (session) return session;

  throw notFound("Poll Session was not found or has closed.");
}

export async function getSessionById(sessionId: string) {
  const [session] = await db
    .select()
    .from(pollSessions)
    .where(eq(pollSessions.id, sessionId))
    .limit(1);

  if (session) return session;

  throw notFound("Poll Session was not found.");
}

export async function getRoundById(roundId: string) {
  const [round] = await db
    .select()
    .from(pollRounds)
    .where(eq(pollRounds.id, roundId))
    .limit(1);

  if (round) return round;

  throw notFound("Poll Round was not found.");
}

export async function getPlanItemById(planItemId: string) {
  const [planItem] = await db
    .select()
    .from(pollRoundPlanItems)
    .where(eq(pollRoundPlanItems.id, planItemId))
    .limit(1);

  if (planItem) return planItem;

  throw notFound("Poll Round Plan item was not found.");
}

export async function closeOpenRound(sessionId: string, now = new Date()) {
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

export async function closeExpiredOpenRoundBySession(sessionId: string, now = new Date()) {
  const [round] = await db
    .select()
    .from(pollRounds)
    .where(and(eq(pollRounds.sessionId, sessionId), eq(pollRounds.status, "open")))
    .orderBy(desc(pollRounds.roundNumber))
    .limit(1);

  if (!round) return null;
  if (!isPollRoundExpiredAt(round, now)) return null;

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

export async function recalculateRoundAnswers(roundId: string, correctOption: PollOption, now = new Date()) {
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
        points: calculatePollRoundPoints({
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

  return rankPollParticipantScores(participants, answers);
}

export async function getSessionDetail(sessionId: string) {
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

  return buildPollSessionDetail({
    session,
    participants,
    rounds,
    planItems,
    answers,
    scores,
  });
}

export async function publishPollSessionChanged(sessionId: string) {
  try {
    const { publishPollEvent } = await import("./poll-live-events");
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

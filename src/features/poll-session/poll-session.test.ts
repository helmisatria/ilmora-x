import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPollSessionDetail,
  buildPollStudentState,
  calculatePollRoundPoints,
  isPollRoundExpiredAt,
  rankPollParticipantScores,
  resolvePollRoundTeacherContent,
} from "./poll-session";

test("validates teacher-facing Poll Round content as all-or-nothing", () => {
  assert.deepEqual(resolvePollRoundTeacherContent({
    correctOption: "A",
  }), {
    ok: true,
    content: {
      questionText: null,
      optionA: null,
      optionB: null,
      optionC: null,
      optionD: null,
      optionE: null,
    },
  });

  assert.deepEqual(resolvePollRoundTeacherContent({
    correctOption: "E",
    questionText: "Pertanyaan",
    optionA: "A",
    optionB: "B",
    optionC: "C",
    optionD: "D",
  }), {
    ok: false,
    message: "Option E is required when the correct option is E.",
  });
});

test("scores Poll Round answers by correctness and response speed", () => {
  assert.equal(calculatePollRoundPoints({
    selectedOption: "A",
    correctOption: "B",
    responseMs: 100,
  }), 0);
  assert.equal(calculatePollRoundPoints({
    selectedOption: "B",
    correctOption: "B",
    responseMs: 12_300,
  }), 880);
  assert.equal(calculatePollRoundPoints({
    selectedOption: "B",
    correctOption: "B",
    responseMs: 90_000,
  }), 500);
});

test("detects expired timed Poll Rounds", () => {
  const openedAt = new Date("2026-05-18T04:00:00.000Z");

  assert.equal(isPollRoundExpiredAt({
    openedAt,
    timerSeconds: null,
  }, new Date("2026-05-18T05:00:00.000Z")), false);
  assert.equal(isPollRoundExpiredAt({
    openedAt,
    timerSeconds: 30,
  }, new Date("2026-05-18T04:00:29.999Z")), false);
  assert.equal(isPollRoundExpiredAt({
    openedAt,
    timerSeconds: 30,
  }, new Date("2026-05-18T04:00:30.000Z")), true);
});

test("ranks Poll participants by points, correctness, and display name", () => {
  const scores = rankPollParticipantScores(
    [
      { id: "p1", displayName: "Budi" },
      { id: "p2", displayName: "Ayu" },
      { id: "p3", displayName: "Citra" },
    ],
    [
      { participantId: "p1", points: 500, isCorrect: true },
      { participantId: "p2", points: 500, isCorrect: true },
      { participantId: "p3", points: 800, isCorrect: true },
      { participantId: "p3", points: 0, isCorrect: false },
    ],
  );

  assert.deepEqual(scores.map((score) => ({
    rank: score.rank,
    participantId: score.participantId,
    totalPoints: score.totalPoints,
    correctAnswers: score.correctAnswers,
    answeredRounds: score.answeredRounds,
  })), [
    { rank: 1, participantId: "p3", totalPoints: 800, correctAnswers: 1, answeredRounds: 2 },
    { rank: 2, participantId: "p2", totalPoints: 500, correctAnswers: 1, answeredRounds: 1 },
    { rank: 3, participantId: "p1", totalPoints: 500, correctAnswers: 1, answeredRounds: 1 },
  ]);
});

test("builds Admin and Student Poll Session projections from the same detail", () => {
  const openedAt = new Date("2026-05-18T04:00:00.000Z");
  const answeredAt = new Date("2026-05-18T04:00:10.000Z");
  const detail = buildPollSessionDetail({
    session: {
      id: "session-1",
      title: "Kelas Farmakologi",
      code: "123456",
      status: "open",
      accessMode: "open_guest",
      createdByAdminUserId: "admin-1",
      openedAt,
      closedAt: null,
      archivedAt: null,
      createdAt: openedAt,
    },
    participants: [
      { id: "p1", displayName: "Ayu", studentUserId: null, joinedAt: openedAt },
      { id: "p2", displayName: "Budi", studentUserId: "student-2", joinedAt: openedAt },
    ],
    rounds: [
      {
        id: "round-1",
        roundNumber: 1,
        label: "Round 1",
        questionText: "Pertanyaan",
        optionA: "A",
        optionB: "B",
        optionC: "C",
        optionD: "D",
        optionE: null,
        correctOption: "B",
        status: "open",
        timerSeconds: 60,
        openedAt,
        closedAt: null,
        correctedAt: null,
      },
    ],
    planItems: [],
    answers: [
      {
        id: "answer-1",
        roundId: "round-1",
        participantId: "p1",
        selectedOption: "B",
        isCorrect: null,
        points: 0,
        responseMs: 10_000,
        answeredAt,
      },
    ],
    scores: [
      {
        participantId: "p1",
        displayName: "Ayu",
        totalPoints: 0,
        correctAnswers: 0,
        answeredRounds: 0,
        rank: 1,
      },
    ],
  });

  const studentState = buildPollStudentState({
    detail,
    participant: { id: "p1", displayName: "Ayu" },
  });

  assert.deepEqual(detail.rounds[0].counts, { A: 0, B: 1, C: 0, D: 0, E: 0 });
  assert.equal(studentState.round?.correctOption, null);
  assert.equal(studentState.round?.counts, null);
  assert.deepEqual(studentState.myAnswer, {
    selectedOption: "B",
    isCorrect: null,
    points: null,
  });
  assert.deepEqual(studentState.participantStatuses, [
    { id: "p1", displayName: "Ayu", answered: true },
    { id: "p2", displayName: "Budi", answered: false },
  ]);
});

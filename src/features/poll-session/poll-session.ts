export const pollOptionLetters = ["A", "B", "C", "D", "E"] as const;

export type PollOption = (typeof pollOptionLetters)[number];

export type PollRoundTeacherContent = {
  questionText: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
};

export type PollRoundTeacherContentResult =
  | { ok: true; content: PollRoundTeacherContent }
  | { ok: false; message: string };

export type PollParticipantScoreInput = {
  participantId: string;
  points: number;
  isCorrect: boolean | null;
};

export type PollParticipantScore = {
  participantId: string;
  displayName: string;
  totalPoints: number;
  correctAnswers: number;
  answeredRounds: number;
  rank: number;
};

export type PollSessionRow = {
  id: string;
  title: string;
  code: string;
  status: string;
  accessMode: string;
  createdByAdminUserId: string;
  openedAt: Date;
  closedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
};

export type PollParticipantRow = {
  id: string;
  displayName: string;
  studentUserId: string | null;
  joinedAt: Date;
};

export type PollRoundRow = {
  id: string;
  roundNumber: number;
  label: string;
  questionText: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
  correctOption: string;
  status: string;
  timerSeconds: number | null;
  openedAt: Date;
  closedAt: Date | null;
  correctedAt: Date | null;
};

export type PollRoundPlanItemRow = {
  id: string;
  sortOrder: number;
  status: string;
  label: string | null;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | null;
  correctOption: string;
  timerSeconds: number | null;
  startedRoundId: string | null;
  startedAt: Date | null;
  skippedAt: Date | null;
};

export type PollAnswerRow = {
  id: string;
  roundId: string;
  participantId: string;
  selectedOption: string;
  isCorrect: boolean | null;
  points: number;
  responseMs: number;
  answeredAt: Date;
};

export type PollSessionDetail = ReturnType<typeof buildPollSessionDetail>;

const MILLISECONDS_IN_A_SECOND = 1000;

export function resolvePollRoundTeacherContent(data: {
  questionText?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  optionE?: string | null;
  correctOption: PollOption;
}): PollRoundTeacherContentResult {
  if (!hasAnyTeacherContent(data)) {
    return {
      ok: true,
      content: {
        questionText: null,
        optionA: null,
        optionB: null,
        optionC: null,
        optionD: null,
        optionE: null,
      },
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
    return {
      ok: false,
      message: "Question text and options A-D are required for teacher-facing content.",
    };
  }

  if (data.correctOption === "E" && !content.optionE) {
    return {
      ok: false,
      message: "Option E is required when the correct option is E.",
    };
  }

  return {
    ok: true,
    content,
  };
}

export function hasAnyTeacherContent(data: {
  questionText?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  optionE?: string | null;
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

export function toOptionalPollText(value: string | null | undefined) {
  return toOptionalText(value);
}

export function calculatePollRoundPoints({
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

export function isPollRoundExpiredAt(
  round: { timerSeconds: number | null; openedAt: Date },
  now: Date,
) {
  if (!round.timerSeconds) return false;

  const elapsedMs = now.getTime() - round.openedAt.getTime();
  const limitMs = round.timerSeconds * MILLISECONDS_IN_A_SECOND;

  return elapsedMs >= limitMs;
}

export function rankPollParticipantScores(
  participants: Array<{ id: string; displayName: string }>,
  answers: PollParticipantScoreInput[],
): PollParticipantScore[] {
  const scoreMap = new Map<string, Omit<PollParticipantScore, "rank">>();

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

  return [...scoreMap.values()]
    .sort((first, second) => {
      if (second.totalPoints !== first.totalPoints) return second.totalPoints - first.totalPoints;
      if (second.correctAnswers !== first.correctAnswers) return second.correctAnswers - first.correctAnswers;

      return first.displayName.localeCompare(second.displayName);
    })
    .map((score, index) => ({
      ...score,
      rank: index + 1,
    }));
}

export function buildPollSessionDetail({
  session,
  participants,
  rounds,
  planItems,
  answers,
  scores,
}: {
  session: PollSessionRow;
  participants: PollParticipantRow[];
  rounds: PollRoundRow[];
  planItems: PollRoundPlanItemRow[];
  answers: PollAnswerRow[];
  scores: PollParticipantScore[];
}) {
  const answerCounts = new Map<string, Record<PollOption, number>>();
  const roundAnswers = new Map<string, PollAnswerRow[]>();

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

export function buildPollStudentState({
  detail,
  participant,
}: {
  detail: PollSessionDetail;
  participant: { id: string; displayName: string };
}) {
  const activeRound = detail.rounds.find((round) => round.status === "open") ?? null;
  const latestRound = [...detail.rounds].reverse()[0] ?? null;
  const visibleRound = activeRound ?? latestRound;
  const myAnswer = visibleRound
    ? visibleRound.answers.find((answer) => answer.participantId === participant.id) ?? null
    : null;
  const myScore = detail.scores.find((score) => score.participantId === participant.id) ?? null;

  return {
    joined: true as const,
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
}

function toOptionalText(value: string | null | undefined) {
  const text = value?.trim() ?? "";

  if (!text) return null;

  return text;
}

function toIso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

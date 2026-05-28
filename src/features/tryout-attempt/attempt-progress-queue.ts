export const attemptProgressOptionLetters = ["A", "B", "C", "D", "E"] as const;

export type AttemptProgressOption = (typeof attemptProgressOptionLetters)[number];

export type AttemptProgressPayload = {
  attemptId: string;
  queuedAt: string;
  lastQuestionIndex: number;
  answers: Array<{
    snapshotId: string;
    selectedOption: AttemptProgressOption | null;
  }>;
  markedSnapshotIds: string[];
};

export type AttemptProgressStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type AttemptProgressQuestion = {
  snapshotId: string;
};

export type AttemptProgressAnswer = {
  snapshotId: string;
  selectedIndex: number | null;
};

export type AttemptProgressAttemptData = {
  attempt: {
    id: string;
    lastQuestionIndex: number;
    lastServerSavedAt: string | null;
  };
  questions: AttemptProgressQuestion[];
  answers: AttemptProgressAnswer[];
  markedSnapshotIds: string[];
};

export function makeAttemptProgressPayload({
  attemptId,
  questions,
  answers,
  markedQuestionIndexes,
  lastQuestionIndex,
  queuedAt = new Date().toISOString(),
}: {
  attemptId: string;
  questions: AttemptProgressQuestion[];
  answers: Array<number | undefined>;
  markedQuestionIndexes: number[];
  lastQuestionIndex: number;
  queuedAt?: string;
}): AttemptProgressPayload {
  return {
    attemptId,
    queuedAt,
    lastQuestionIndex,
    answers: questions.map((question, index) => ({
      snapshotId: question.snapshotId,
      selectedOption: toAttemptProgressOption(answers[index]),
    })),
    markedSnapshotIds: markedQuestionIndexes
      .map((index) => questions[index]?.snapshotId)
      .filter((snapshotId): snapshotId is string => Boolean(snapshotId)),
  };
}

export function restoreAttemptProgress({
  attemptData,
  queuedProgress,
}: {
  attemptData: AttemptProgressAttemptData;
  queuedProgress: AttemptProgressPayload | null;
}) {
  return {
    answers: getRestoredAnswers(attemptData, queuedProgress),
    markedQuestionIndexes: getRestoredMarkedIndexes(attemptData, queuedProgress),
    lastQuestionIndex: getRestoredQuestionIndex(attemptData, queuedProgress),
  };
}

export function queueAttemptProgress(
  storage: AttemptProgressStorage,
  payload: AttemptProgressPayload,
) {
  const queuedProgress = readQueuedAttemptProgress(storage, payload.attemptId);

  if (queuedProgress && isSameOrAfter(queuedProgress.queuedAt, payload.queuedAt)) {
    return;
  }

  storage.setItem(getAttemptProgressQueueKey(payload.attemptId), JSON.stringify(payload));
}

export function readQueuedAttemptProgress(
  storage: AttemptProgressStorage,
  attemptId: string,
) {
  const value = storage.getItem(getAttemptProgressQueueKey(attemptId));

  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as AttemptProgressPayload;

    if (!isValidQueuedProgress(parsed)) {
      removeQueuedAttemptProgress(storage, attemptId);
      return null;
    }

    return parsed;
  } catch {
    removeQueuedAttemptProgress(storage, attemptId);
    return null;
  }
}

export function getUsableQueuedAttemptProgress(
  storage: AttemptProgressStorage,
  attemptData: AttemptProgressAttemptData,
) {
  const queuedProgress = readQueuedAttemptProgress(storage, attemptData.attempt.id);

  if (!queuedProgress) return null;

  if (!isQueuedProgressNewerThanServer(queuedProgress, attemptData)) {
    removeQueuedAttemptProgress(storage, attemptData.attempt.id);
    return null;
  }

  return queuedProgress;
}

export function removeQueuedAttemptProgress(
  storage: AttemptProgressStorage,
  attemptId: string,
) {
  storage.removeItem(getAttemptProgressQueueKey(attemptId));
}

export function removeQueuedAttemptProgressIfNotNewer({
  storage,
  attemptId,
  queuedAt,
}: {
  storage: AttemptProgressStorage;
  attemptId: string;
  queuedAt: string;
}) {
  const queuedProgress = readQueuedAttemptProgress(storage, attemptId);

  if (!queuedProgress) return;
  if (isAfter(queuedProgress.queuedAt, queuedAt)) return;

  removeQueuedAttemptProgress(storage, attemptId);
}

export function toAttemptProgressOption(index: number | undefined) {
  if (index === undefined) return null;

  return attemptProgressOptionLetters[index] ?? null;
}

export function toAttemptProgressOptionIndex(option: AttemptProgressOption | null) {
  if (!option) return undefined;

  const optionIndex = attemptProgressOptionLetters.findIndex((letter) => letter === option);

  if (optionIndex < 0) return undefined;

  return optionIndex;
}

function getRestoredAnswers(
  attemptData: AttemptProgressAttemptData,
  queuedProgress: AttemptProgressPayload | null,
) {
  const restoredAnswers = new Array<number | undefined>(attemptData.questions.length).fill(undefined);

  for (const answer of attemptData.answers) {
    const answerIndex = getQuestionIndex(attemptData.questions, answer.snapshotId);

    if (answerIndex >= 0 && answer.selectedIndex !== null) {
      restoredAnswers[answerIndex] = answer.selectedIndex;
    }
  }

  if (!queuedProgress) return restoredAnswers;

  for (const answer of queuedProgress.answers) {
    const answerIndex = getQuestionIndex(attemptData.questions, answer.snapshotId);

    if (answerIndex >= 0) {
      restoredAnswers[answerIndex] = toAttemptProgressOptionIndex(answer.selectedOption);
    }
  }

  return restoredAnswers;
}

function getRestoredMarkedIndexes(
  attemptData: AttemptProgressAttemptData,
  queuedProgress: AttemptProgressPayload | null,
) {
  const snapshotIds = queuedProgress?.markedSnapshotIds ?? attemptData.markedSnapshotIds;

  return snapshotIds
    .map((snapshotId) => getQuestionIndex(attemptData.questions, snapshotId))
    .filter((index) => index >= 0);
}

function getRestoredQuestionIndex(
  attemptData: AttemptProgressAttemptData,
  queuedProgress: AttemptProgressPayload | null,
) {
  const lastQuestionIndex = queuedProgress?.lastQuestionIndex ?? attemptData.attempt.lastQuestionIndex;
  const lastAvailableIndex = attemptData.questions.length - 1;

  if (lastAvailableIndex < 0) return 0;
  if (lastQuestionIndex < 0) return 0;
  if (lastQuestionIndex > lastAvailableIndex) return lastAvailableIndex;

  return lastQuestionIndex;
}

function getQuestionIndex(questions: AttemptProgressQuestion[], snapshotId: string) {
  return questions.findIndex((question) => question.snapshotId === snapshotId);
}

function getAttemptProgressQueueKey(attemptId: string) {
  return `ilmorax:attempt-progress:${attemptId}`;
}

function isQueuedProgressNewerThanServer(
  queuedProgress: AttemptProgressPayload,
  attemptData: AttemptProgressAttemptData,
) {
  const lastServerSavedAt = attemptData.attempt.lastServerSavedAt;

  if (!lastServerSavedAt) return true;

  return isAfter(queuedProgress.queuedAt, lastServerSavedAt);
}

function isValidQueuedProgress(value: AttemptProgressPayload) {
  if (!value.attemptId) return false;
  if (!value.queuedAt) return false;
  if (Number.isNaN(new Date(value.queuedAt).getTime())) return false;
  if (!Array.isArray(value.answers)) return false;
  if (!Array.isArray(value.markedSnapshotIds)) return false;

  return true;
}

function isSameOrAfter(left: string, right: string) {
  return new Date(left).getTime() >= new Date(right).getTime();
}

function isAfter(left: string, right: string) {
  return new Date(left).getTime() > new Date(right).getTime();
}

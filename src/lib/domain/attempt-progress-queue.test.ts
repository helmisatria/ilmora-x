import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getUsableQueuedAttemptProgress,
  makeAttemptProgressPayload,
  queueAttemptProgress,
  readQueuedAttemptProgress,
  removeQueuedAttemptProgressIfNotNewer,
  restoreAttemptProgress,
  type AttemptProgressStorage,
} from "./attempt-progress-queue";

class MemoryStorage implements AttemptProgressStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test("builds Attempt progress payloads from route state", () => {
  const payload = makeAttemptProgressPayload({
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:00:00.000Z",
    lastQuestionIndex: 1,
    questions: [
      { snapshotId: "snapshot-1" },
      { snapshotId: "snapshot-2" },
      { snapshotId: "snapshot-3" },
    ],
    answers: [0, undefined, 4],
    markedQuestionIndexes: [1, 99],
  });

  assert.deepEqual(payload, {
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:00:00.000Z",
    lastQuestionIndex: 1,
    answers: [
      { snapshotId: "snapshot-1", selectedOption: "A" },
      { snapshotId: "snapshot-2", selectedOption: null },
      { snapshotId: "snapshot-3", selectedOption: "E" },
    ],
    markedSnapshotIds: ["snapshot-2"],
  });
});

test("keeps the newest queued Attempt progress", () => {
  const storage = new MemoryStorage();
  const olderPayload = makeAttemptProgressPayload({
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:00:00.000Z",
    lastQuestionIndex: 0,
    questions: [{ snapshotId: "snapshot-1" }],
    answers: [0],
    markedQuestionIndexes: [],
  });
  const newerPayload = {
    ...olderPayload,
    queuedAt: "2026-05-18T04:01:00.000Z",
    answers: [{ snapshotId: "snapshot-1", selectedOption: "B" as const }],
  };

  queueAttemptProgress(storage, newerPayload);
  queueAttemptProgress(storage, olderPayload);

  assert.deepEqual(readQueuedAttemptProgress(storage, "attempt-1"), newerPayload);
});

test("restores newer queued Attempt progress over server progress", () => {
  const storage = new MemoryStorage();
  const attemptData = {
    attempt: {
      id: "attempt-1",
      lastQuestionIndex: 0,
      lastServerSavedAt: "2026-05-18T04:00:00.000Z",
    },
    questions: [
      { snapshotId: "snapshot-1" },
      { snapshotId: "snapshot-2" },
    ],
    answers: [
      { snapshotId: "snapshot-1", selectedIndex: 0 },
    ],
    markedSnapshotIds: ["snapshot-1"],
  };
  const queuedProgress = makeAttemptProgressPayload({
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:01:00.000Z",
    lastQuestionIndex: 1,
    questions: attemptData.questions,
    answers: [2, 3],
    markedQuestionIndexes: [1],
  });

  queueAttemptProgress(storage, queuedProgress);

  const usableProgress = getUsableQueuedAttemptProgress(storage, attemptData);
  const restored = restoreAttemptProgress({
    attemptData,
    queuedProgress: usableProgress,
  });

  assert.deepEqual(restored, {
    answers: [2, 3],
    markedQuestionIndexes: [1],
    lastQuestionIndex: 1,
  });
});

test("drops queued Attempt progress that is not newer than the server", () => {
  const storage = new MemoryStorage();
  const attemptData = {
    attempt: {
      id: "attempt-1",
      lastQuestionIndex: 0,
      lastServerSavedAt: "2026-05-18T04:02:00.000Z",
    },
    questions: [{ snapshotId: "snapshot-1" }],
    answers: [],
    markedSnapshotIds: [],
  };
  const queuedProgress = makeAttemptProgressPayload({
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:01:00.000Z",
    lastQuestionIndex: 0,
    questions: attemptData.questions,
    answers: [0],
    markedQuestionIndexes: [],
  });

  queueAttemptProgress(storage, queuedProgress);

  assert.equal(getUsableQueuedAttemptProgress(storage, attemptData), null);
  assert.equal(readQueuedAttemptProgress(storage, "attempt-1"), null);
});

test("removes queued Attempt progress only after an equal or newer server save", () => {
  const storage = new MemoryStorage();
  const payload = makeAttemptProgressPayload({
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:01:00.000Z",
    lastQuestionIndex: 0,
    questions: [{ snapshotId: "snapshot-1" }],
    answers: [0],
    markedQuestionIndexes: [],
  });

  queueAttemptProgress(storage, payload);
  removeQueuedAttemptProgressIfNotNewer({
    storage,
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:00:00.000Z",
  });

  assert.deepEqual(readQueuedAttemptProgress(storage, "attempt-1"), payload);

  removeQueuedAttemptProgressIfNotNewer({
    storage,
    attemptId: "attempt-1",
    queuedAt: "2026-05-18T04:01:00.000Z",
  });

  assert.equal(readQueuedAttemptProgress(storage, "attempt-1"), null);
});

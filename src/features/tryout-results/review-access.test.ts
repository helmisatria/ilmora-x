import assert from "node:assert/strict";
import { test } from "node:test";
import { applyReviewAccess } from "./review-access";

function question(id: string, overrides: Partial<{ accessLevel: "free" | "premium"; isCorrect: boolean | null }> = {}) {
  return {
    id,
    accessLevel: "free" as "free" | "premium",
    isCorrect: false as boolean | null,
    correctOption: "B" as const,
    correctIndex: 1,
    explanation: `Explanation ${id}`,
    videoUrl: `https://video.test/${id}`,
    pictureUrl: `https://picture.test/${id}`,
    relatedMateri: { id: `materi-${id}`, title: "Materi" },
    ...overrides,
  };
}

const freeStudent = {
  tryoutAccessLevel: "free",
  hasPremiumMembership: false,
  hasLifetimeTryoutPurchase: false,
};

test("free Students get the first three wrong answers and nothing past that", () => {
  const result = applyReviewAccess(
    [question("q1"), question("q2"), question("q3"), question("q4")],
    freeStudent,
  );
  const [, , third, fourth] = result.questions;

  assert.equal(result.hasFullReviewAccess, false);
  assert.equal(third.locked, false);
  assert.equal(third.explanation, "Explanation q3");
  assert.equal(fourth.locked, true);
  assert.equal(fourth.correctIndex, null);
  assert.equal(fourth.correctOption, null);
  assert.equal(fourth.explanation, "");
  assert.equal(fourth.pictureUrl, null);
  assert.equal(fourth.relatedMateri, null);
  assert.equal(fourth.hasVideo, true);
});

test("premium Questions are locked for free Students without leaking the answer key", () => {
  const result = applyReviewAccess(
    [question("q1", { accessLevel: "premium" })],
    freeStudent,
  );
  const [locked] = result.questions;

  assert.equal(locked.locked, true);
  assert.equal(locked.correctIndex, null);
  assert.equal(locked.explanation, "");
  assert.equal(locked.videoUrl, null);
  assert.equal(locked.hasVideo, true);
});

test("locked Questions the Student answered correctly still show their correct answer", () => {
  const result = applyReviewAccess(
    [question("q1", { accessLevel: "premium", isCorrect: true })],
    freeStudent,
  );

  assert.equal(result.questions[0].locked, true);
  assert.equal(result.questions[0].correctIndex, 1);
});

test("premium members and paid Try-out reviews see everything", () => {
  const questions = [question("q1", { accessLevel: "premium" }), question("q2"), question("q3"), question("q4")];

  for (const access of [
    { ...freeStudent, hasPremiumMembership: true },
    { ...freeStudent, tryoutAccessLevel: "premium" },
  ]) {
    const result = applyReviewAccess(questions, access);

    assert.equal(result.hasFullReviewAccess, true);
    assert.ok(result.questions.every((item) => !item.locked && item.explanation !== ""));
  }
});

import assert from "node:assert/strict";
import { test } from "node:test";
import type { StudentEvaluation } from "../student-evaluation/student-evaluation-model";
import { buildProgressSummary } from "./progress-summary";

const evaluation: StudentEvaluation = {
  summary: {
    xp: 300,
    attemptXp: 250,
    badgeRewardXp: 50,
    streak: 2,
    totalAttempts: 1,
    totalQuestions: 10,
    totalCorrect: 7,
    totalWrong: 3,
    accuracy: 70,
    awardedBadgeIds: [1],
  },
  attempts: [
    {
      id: "attempt-1",
      tryoutTitle: "Try-out A",
      attemptNumber: 1,
      status: "submitted",
      startedAt: new Date("2026-09-01T00:00:00Z"),
      submittedAt: new Date("2026-09-01T01:00:00Z"),
      score: 70,
      correctCount: 7,
      wrongCount: 3,
      totalQuestions: 10,
      xpEarned: 250,
    },
  ],
  categories: [
    {
      id: "category-1",
      name: "Farmakologi",
      color: "#205072",
      total: 10,
      correct: 7,
      subCategories: [
        {
          id: "sub-1",
          name: "Antibiotik",
          total: 10,
          correct: 7,
          topics: [{ id: "topic-1", name: "Beta-laktam", total: 10, correct: 7 }],
        },
      ],
    },
  ],
};

test("hides Attempt history and Sub-category breakdown from free Students", () => {
  const summary = buildProgressSummary(evaluation, false);

  assert.equal(summary.hasPremiumEvaluation, false);
  assert.equal(summary.totalAttempts, 1);
  assert.deepEqual(summary.attempts, []);
  assert.equal(summary.categories[0].name, "Farmakologi");
  assert.equal(summary.categories[0].correct, 7);
  assert.deepEqual(summary.categories[0].subCategories, []);
});

test("returns full Evaluation detail to premium Students", () => {
  const summary = buildProgressSummary(evaluation, true);

  assert.equal(summary.hasPremiumEvaluation, true);
  assert.equal(summary.attempts.length, 1);
  assert.equal(summary.attempts[0].submittedAt, "2026-09-01T01:00:00.000Z");
  assert.equal(summary.categories[0].subCategories[0].topics[0].name, "Beta-laktam");
});

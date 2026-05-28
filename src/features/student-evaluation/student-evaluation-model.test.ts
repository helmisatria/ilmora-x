import assert from "node:assert/strict";
import { test } from "node:test";
import { buildStudentEvaluation } from "./student-evaluation-model";

test("builds Student Evaluation totals from submitted Attempts and Badge rewards", () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const evaluation = buildStudentEvaluation({
    submittedAttempts: [
      {
        id: "attempt-1",
        tryoutTitle: "Try-out A",
        attemptNumber: 1,
        status: "submitted",
        startedAt: today,
        submittedAt: today,
        score: 80,
        correctCount: 8,
        wrongCount: 2,
        totalQuestions: 10,
        xpEarned: 210,
      },
      {
        id: "attempt-2",
        tryoutTitle: "Try-out B",
        attemptNumber: 2,
        status: "auto_submitted",
        startedAt: yesterday,
        submittedAt: yesterday,
        score: 50,
        correctCount: 5,
        wrongCount: null,
        totalQuestions: 10,
        xpEarned: 75,
      },
    ],
    categoryRows: [
      {
        categoryId: "cat-a",
        categoryName: "Farmakologi",
        categoryColor: null,
        total: "12",
        correct: "9",
      },
    ],
    subCategoryRows: [
      {
        categoryId: "cat-a",
        subCategoryId: "sub-a",
        subCategoryName: "Antibiotik",
        total: "6",
        correct: "4",
      },
    ],
    badgeRewardXp: 50,
    badgeCodes: ["BADGE-001", "BADGE-XYZ", "BADGE-015"],
  });

  assert.equal(evaluation.summary.xp, 335);
  assert.equal(evaluation.summary.attemptXp, 285);
  assert.equal(evaluation.summary.badgeRewardXp, 50);
  assert.equal(evaluation.summary.totalAttempts, 2);
  assert.equal(evaluation.summary.totalQuestions, 20);
  assert.equal(evaluation.summary.totalCorrect, 13);
  assert.equal(evaluation.summary.totalWrong, 7);
  assert.equal(evaluation.summary.accuracy, 65);
  assert.deepEqual(evaluation.summary.awardedBadgeIds, [1, 15]);
  assert.equal(evaluation.attempts[1].wrongCount, 5);
  assert.deepEqual(evaluation.categories, [
    {
      id: "cat-a",
      name: "Farmakologi",
      color: "#205072",
      total: 12,
      correct: 9,
      subCategories: [
        {
          id: "sub-a",
          name: "Antibiotik",
          total: 6,
          correct: 4,
        },
      ],
    },
  ]);
});

test("builds an empty Student Evaluation without division errors", () => {
  const evaluation = buildStudentEvaluation({
    submittedAttempts: [],
    categoryRows: [],
    subCategoryRows: [],
    badgeRewardXp: 0,
    badgeCodes: [],
  });

  assert.equal(evaluation.summary.xp, 0);
  assert.equal(evaluation.summary.accuracy, 0);
  assert.equal(evaluation.summary.totalWrong, 0);
  assert.deepEqual(evaluation.attempts, []);
  assert.deepEqual(evaluation.categories, []);
});

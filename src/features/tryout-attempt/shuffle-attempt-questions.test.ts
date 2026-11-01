import assert from "node:assert/strict";
import { test } from "node:test";
import { shuffleAttemptQuestions } from "./shuffle-attempt-questions";

const questions = [1, 2, 3, 4, 5].map((sortOrder) => ({ sortOrder, id: `q${sortOrder}` }));

test("keeps every question and renumbers sortOrder from 1", () => {
  const shuffled = shuffleAttemptQuestions(questions);

  assert.deepEqual(shuffled.map((question) => question.sortOrder), [1, 2, 3, 4, 5]);
  assert.deepEqual(shuffled.map((question) => question.id).sort(), ["q1", "q2", "q3", "q4", "q5"]);
});

test("changes the order when the random source says so", () => {
  const shuffled = shuffleAttemptQuestions(questions, () => 0);

  assert.deepEqual(shuffled.map((question) => question.id), ["q2", "q3", "q4", "q5", "q1"]);
});

test("does not change the input", () => {
  shuffleAttemptQuestions(questions, () => 0);

  assert.deepEqual(questions.map((question) => question.id), ["q1", "q2", "q3", "q4", "q5"]);
});

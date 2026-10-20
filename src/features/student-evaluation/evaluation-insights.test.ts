import assert from "node:assert/strict";
import test from "node:test";
import {
  getAccuracyPct,
  getAccuracyTone,
  getFocusTopics,
  getScoreTrend,
  sortCategoriesByWeakness,
} from "./evaluation-insights";

const categories = [
  {
    id: "klinis",
    name: "Klinis",
    color: "#205072",
    total: 7,
    correct: 4,
    subCategories: [
      {
        id: "kardio",
        name: "Kardiovaskular",
        total: 7,
        correct: 4,
        topics: [
          { id: "hipertensi", name: "Hipertensi", total: 5, correct: 4 },
          { id: "gagal-jantung", name: "Gagal jantung", total: 2, correct: 0 },
        ],
      },
    ],
  },
  {
    id: "farmakologi",
    name: "Farmakologi",
    color: "#58cc02",
    total: 4,
    correct: 2,
    subCategories: [
      {
        id: "antibiotik",
        name: "Antibiotik",
        total: 4,
        correct: 2,
        topics: [
          { id: "beta-laktam", name: "Beta laktam", total: 4, correct: 2 },
          { id: "kosong", name: "Belum dijawab", total: 0, correct: 0 },
        ],
      },
    ],
  },
];

test("accuracy percent handles empty totals", () => {
  assert.equal(getAccuracyPct({ correct: 0, total: 0 }), 0);
  assert.equal(getAccuracyPct({ correct: 2, total: 3 }), 67);
});

test("accuracy tone uses the 70 and 50 thresholds", () => {
  assert.equal(getAccuracyTone(70), "strong");
  assert.equal(getAccuracyTone(69), "medium");
  assert.equal(getAccuracyTone(50), "medium");
  assert.equal(getAccuracyTone(49), "weak");
});

test("categories sort weakest first and skip empty ones", () => {
  const sorted = sortCategoriesByWeakness([
    { name: "A", correct: 3, total: 4 },
    { name: "B", correct: 0, total: 0 },
    { name: "C", correct: 1, total: 4 },
  ]);

  assert.deepEqual(sorted.map((category) => category.name), ["C", "A"]);
});

test("focus topics skip strong and empty topics, weakest first", () => {
  const topics = getFocusTopics(categories);

  assert.deepEqual(topics.map((topic) => topic.id), ["gagal-jantung", "beta-laktam"]);
  assert.equal(topics[1]?.categoryName, "Farmakologi");
  assert.equal(topics[1]?.pct, 50);
});

test("focus topics respect the limit", () => {
  assert.equal(getFocusTopics(categories, 1).length, 1);
});

test("score trend is oldest to newest with the change from the previous Attempt", () => {
  const trend = getScoreTrend([{ score: 80 }, { score: 40 }, { score: 60 }]);

  assert.deepEqual(trend.scores, [60, 40, 80]);
  assert.equal(trend.delta, 40);
});

test("score trend has no change with fewer than two Attempts", () => {
  assert.equal(getScoreTrend([{ score: 80 }]).delta, null);
  assert.deepEqual(getScoreTrend([]).scores, []);
});

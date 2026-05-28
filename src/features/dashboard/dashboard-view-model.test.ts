import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardAccuracy, getDashboardPalette } from "./dashboard-view-model";

test("calculates Dashboard accuracy without division errors", () => {
  assert.equal(getDashboardAccuracy({ totalQuestions: 0, totalCorrect: 0 }), 0);
  assert.equal(getDashboardAccuracy({ totalQuestions: 4, totalCorrect: 3 }), 75);
});

test("falls back to the default Dashboard palette", () => {
  const palette = getDashboardPalette();

  assert.equal(palette.id, "clinic");
});

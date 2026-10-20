import assert from "node:assert/strict";
import { test } from "node:test";
import { sortTryoutsForCatalog } from "./tryout-catalog-order";

const row = (title: string, accessLevel: "free" | "premium", catalogOrder: number | null, publishedAt: string) => ({
  title,
  accessLevel,
  catalogOrder,
  publishedAt,
});

test("sorts free Try-outs first, then newest, when no order is set", () => {
  const sorted = sortTryoutsForCatalog([
    row("Old premium", "premium", null, "2026-05-01T00:00:00.000Z"),
    row("New premium", "premium", null, "2026-05-09T00:00:00.000Z"),
    row("Old free", "free", null, "2026-05-01T00:00:00.000Z"),
    row("New free", "free", null, "2026-05-09T00:00:00.000Z"),
  ]);

  assert.deepEqual(sorted.map((tryout) => tryout.title), ["New free", "Old free", "New premium", "Old premium"]);
});

test("puts Admin-ordered Try-outs first and new unordered ones after them", () => {
  const sorted = sortTryoutsForCatalog([
    row("Unordered free", "free", null, "2026-05-09T00:00:00.000Z"),
    row("Second", "free", 2, "2026-05-01T00:00:00.000Z"),
    row("First", "premium", 1, "2026-05-01T00:00:00.000Z"),
  ]);

  assert.deepEqual(sorted.map((tryout) => tryout.title), ["First", "Second", "Unordered free"]);
});

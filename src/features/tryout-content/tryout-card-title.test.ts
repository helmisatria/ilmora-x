import assert from "node:assert/strict";
import { test } from "node:test";
import { splitTryoutTitle } from "./tryout-card-title";

test("splits the subject from the title at the first hyphen separator", () => {
  assert.deepEqual(splitTryoutTitle("Kardiovaskular - Stroke (Vignette)"), {
    subject: "Kardiovaskular",
    name: "Stroke (Vignette)",
  });
});

test("splits at an en dash too", () => {
  assert.deepEqual(splitTryoutTitle("Kardiovaskular – Hipertensi (Short Vignette) (Free)"), {
    subject: "Kardiovaskular",
    name: "Hipertensi (Short Vignette) (Free)",
  });
});

test("only splits at the first separator", () => {
  assert.deepEqual(splitTryoutTitle("Respirasi - Asma - Anak"), { subject: "Respirasi", name: "Asma - Anak" });
});

test("keeps titles without a spaced separator as-is", () => {
  assert.deepEqual(splitTryoutTitle("Try-out UKAI Nasional"), { subject: null, name: "Try-out UKAI Nasional" });
});

test("keeps the title as-is when either side is empty", () => {
  assert.deepEqual(splitTryoutTitle("- Stroke"), { subject: null, name: "- Stroke" });
  assert.deepEqual(splitTryoutTitle("Kardiovaskular - "), { subject: null, name: "Kardiovaskular - " });
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPollCountdown,
  getPollRoundOptionText,
  getStudentPollUrl,
  makeDefaultPollSessionTitle,
} from "./admin-poll-workbook";

test("formats Poll Session operation helpers", () => {
  assert.match(makeDefaultPollSessionTitle(), /^Kelas /);
  assert.equal(formatPollCountdown(65), "1:05");
  assert.equal(getStudentPollUrl("123456"), "/poll/123456");
});

test("resolves Poll Round option text", () => {
  const round = {
    optionA: "A text",
    optionB: "B text",
    optionC: "C text",
    optionD: "D text",
    optionE: null,
  };

  assert.equal(getPollRoundOptionText(round, "A"), "A text");
  assert.equal(getPollRoundOptionText(round, "E"), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { isListedInstitution, resolveInstitution } from "./institutions";

test("resolveInstitution maps full names, base names and abbreviations to the listed spelling", () => {
  assert.equal(resolveInstitution("Universitas Sebelas Maret (UNS)"), "Universitas Sebelas Maret (UNS)");
  assert.equal(resolveInstitution("  universitas   sebelas maret "), "Universitas Sebelas Maret (UNS)");
  assert.equal(resolveInstitution("uns"), "Universitas Sebelas Maret (UNS)");
  assert.equal(resolveInstitution("Universitas Diponegoro"), "Universitas Diponegoro (UNDIP)");
  assert.equal(resolveInstitution("Politeknik Kesehatan Kemenkes Bandung"), "Politeknik Kesehatan Kemenkes Bandung");
});

test("resolveInstitution keeps unlisted names with whitespace cleaned up", () => {
  assert.equal(resolveInstitution("  Universitas   Contoh Farmasi "), "Universitas Contoh Farmasi");
  assert.equal(isListedInstitution("Universitas Contoh Farmasi"), false);
  assert.equal(isListedInstitution("ugm"), true);
});

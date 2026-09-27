import assert from "node:assert/strict";
import test from "node:test";
import { getCheckoutStatusDisplayState } from "./checkout-status-display";

test("shows a successful payment clearly", () => {
  assert.equal(getCheckoutStatusDisplayState("paid").title, "Pembayaran berhasil");
});

test("distinguishes failed and cancelled Midtrans payments", () => {
  assert.equal(
    getCheckoutStatusDisplayState("cancelled", "deny").title,
    "Pembayaran gagal",
  );
  assert.equal(
    getCheckoutStatusDisplayState("cancelled", "failure").title,
    "Pembayaran gagal",
  );
  assert.equal(getCheckoutStatusDisplayState("cancelled", "failed").icon, "error");
  assert.equal(
    getCheckoutStatusDisplayState("cancelled", "cancel").title,
    "Pembayaran dibatalkan",
  );
});

test("shows pending, expired, and review states clearly", () => {
  assert.equal(getCheckoutStatusDisplayState("pending").title, "Menunggu konfirmasi");
  assert.equal(getCheckoutStatusDisplayState("expired").title, "Pembayaran kedaluwarsa");
  assert.equal(
    getCheckoutStatusDisplayState("review_required").title,
    "Pembayaran sedang diperiksa",
  );
});

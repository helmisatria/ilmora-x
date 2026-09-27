import assert from "node:assert/strict";
import test from "node:test";
import {
  getMidtransPaidAt,
  getMidtransPaymentState,
  isValidMidtransSignature,
  type MidtransNotificationPayload,
} from "./midtrans-payment";

const basePayload: MidtransNotificationPayload = {
  order_id: "order-123",
  status_code: "200",
  gross_amount: "49000.00",
  transaction_status: "settlement",
  signature_key: "6b242d1a6f2b8d6a5d4db581646cc79acf8ae9c6ba41e64f7fc5b0a1d4c4d2984fbc7938ee386dc59582d3eccaf9bf966bb940305ddf5d40b39f9993d7db4c5b",
};

test("validates Midtrans notification signatures", () => {
  assert.equal(isValidMidtransSignature(basePayload, "server-key"), true);
  assert.equal(
    isValidMidtransSignature({ ...basePayload, gross_amount: "50000.00" }, "server-key"),
    false,
  );
});

test("only treats accepted successful transactions as paid", () => {
  assert.equal(getMidtransPaymentState(basePayload), "paid");
  assert.equal(getMidtransPaymentState({
    ...basePayload,
    transaction_status: "capture",
    fraud_status: "accept",
  }), "paid");
  assert.equal(getMidtransPaymentState({
    ...basePayload,
    transaction_status: "capture",
    fraud_status: "challenge",
  }), "pending");
  assert.equal(getMidtransPaymentState({
    ...basePayload,
    transaction_status: "settlement",
    fraud_status: "challenge",
  }), "pending");
  assert.equal(getMidtransPaymentState({
    ...basePayload,
    transaction_status: "settlement",
    fraud_status: "deny",
  }), "pending");
  assert.equal(getMidtransPaymentState({
    ...basePayload,
    transaction_status: "settlement",
    fraud_status: "",
  }), "pending");
  assert.equal(getMidtransPaymentState({ ...basePayload, transaction_status: "expire" }), "expired");
  assert.equal(getMidtransPaymentState({ ...basePayload, transaction_status: "deny" }), "cancelled");
  assert.equal(getMidtransPaymentState({ ...basePayload, transaction_status: "failure" }), "cancelled");
  assert.equal(getMidtransPaymentState({ ...basePayload, transaction_status: "pending" }), "pending");
});

test("parses Midtrans GMT+7 payment timestamps", () => {
  const paidAt = getMidtransPaidAt({
    ...basePayload,
    settlement_time: "2026-08-21 14:30:00",
  });

  assert.equal(paidAt.toISOString(), "2026-08-21T07:30:00.000Z");
});

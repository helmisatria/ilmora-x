import { createHash, timingSafeEqual } from "node:crypto";
import type { MidtransTransaction } from "./midtrans-client.server";

export type MidtransNotificationPayload = MidtransTransaction & {
  signature_key: string;
};

export type MidtransPaymentState = "paid" | "expired" | "cancelled" | "pending";

export function isValidMidtransSignature(
  payload: MidtransNotificationPayload,
  serverKey: string,
) {
  const expectedSignature = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest("hex");
  const received = Buffer.from(payload.signature_key.toLowerCase(), "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}

export function getMidtransPaymentState(payload: MidtransTransaction): MidtransPaymentState {
  const status = payload.transaction_status.toLowerCase();
  const fraudStatus = payload.fraud_status?.toLowerCase();
  const hasSuccessfulStatus = status === "settlement" || status === "capture";
  const hasAcceptedFraudStatus = fraudStatus === undefined || fraudStatus === "accept";

  if (payload.status_code === "200" && hasSuccessfulStatus && hasAcceptedFraudStatus) {
    return "paid";
  }
  if (status === "expire") return "expired";
  if (["cancel", "deny", "failed", "failure"].includes(status)) return "cancelled";

  return "pending";
}

export function getMidtransPaidAt(payload: MidtransTransaction) {
  const timestamp = payload.settlement_time ?? payload.transaction_time;

  if (!timestamp) return new Date();

  // Midtrans timestamps are in GMT+7 and omit an explicit offset.
  return new Date(`${timestamp.replace(" ", "T")}+07:00`);
}

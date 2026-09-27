import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db/client";
import { checkouts, couponRedemptions, paymentWebhookEvents } from "../../lib/db/schema";
import type { OperationLog } from "../../lib/observability";
import type { MidtransTransaction } from "./midtrans-client.server";
import { grantEntitlementForPaidCheckout, markCheckoutExpired } from "./payment-service";
import {
  getMidtransPaidAt,
  getMidtransPaymentState,
  isValidMidtransSignature,
  type MidtransNotificationPayload,
} from "./midtrans-payment";

export function isValidMidtransNotification(payload: unknown): payload is MidtransNotificationPayload {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) return false;
  if (!isMidtransNotificationPayload(payload)) return false;

  return isValidMidtransSignature(payload, serverKey);
}

export async function processMidtransWebhook(
  payload: MidtransNotificationPayload,
  logger?: OperationLog,
) {
  const checkout = await findCheckout(payload.order_id);
  const eventId = await storeWebhookEvent({
    checkoutId: checkout?.id ?? null,
    payload,
    processingResult: "stored",
  });

  logger?.set({
    midtransWebhook: {
      ...getSafeWebhookLogFields(payload),
      checkoutId: checkout?.id ?? null,
      eventId,
    },
  });

  if (!checkout) {
    await updateWebhookResult(eventId, "checkout_not_found");
    logger?.warn("midtrans webhook checkout not found", {
      midtransWebhook: {
        ...getSafeWebhookLogFields(payload),
        eventId,
        result: "checkout_not_found",
      },
    });
    return { ok: true, result: "checkout_not_found" };
  }

  const result = await applyMidtransTransactionToCheckout(payload, checkout, logger);

  await updateWebhookResult(eventId, result);
  logger?.info("midtrans webhook processed", {
    midtransWebhook: {
      ...getSafeWebhookLogFields(payload),
      checkoutId: checkout.id,
      eventId,
      result,
    },
  });

  return { ok: true, result };
}

export async function applyMidtransTransactionToCheckout(
  payload: MidtransTransaction,
  checkout: typeof checkouts.$inferSelect,
  logger?: OperationLog,
) {
  const state = getMidtransPaymentState(payload);

  if (checkout.status === "paid" && state !== "paid") {
    return "ignored_after_paid";
  }

  if (state === "paid") {
    return markCheckoutPaid(payload, checkout, logger);
  }

  if (state === "expired") {
    await markCheckoutExpired(checkout.id);
    await storeProviderStatus(checkout.id, payload);
    return "expired";
  }

  if (state === "cancelled") {
    await markCheckoutCancelled(checkout.id, payload);
    return "cancelled";
  }

  await storeProviderStatus(checkout.id, payload);
  return "status_stored";
}

async function markCheckoutPaid(
  payload: MidtransTransaction,
  checkout: typeof checkouts.$inferSelect,
  logger?: OperationLog,
) {
  const paidAmount = Number(payload.gross_amount);

  if (paidAmount !== checkout.finalAmount) {
    await db
      .update(checkouts)
      .set({
        status: "review_required",
        providerTransactionId: payload.transaction_id ?? null,
        providerStatus: payload.transaction_status,
        providerPayload: payload,
        amountMismatchPayload: payload,
        updatedAt: new Date(),
      })
      .where(eq(checkouts.id, checkout.id));

    logger?.warn("midtrans webhook amount mismatch", {
      checkout: {
        id: checkout.id,
        expectedAmount: checkout.finalAmount,
        paidAmount,
      },
      midtransWebhook: getSafeWebhookLogFields(payload),
    });
    return "amount_mismatch";
  }

  if (checkout.status === "paid") {
    await storeProviderStatus(checkout.id, payload);
    return "already_paid";
  }

  const paidAt = getMidtransPaidAt(payload);

  await db.transaction(async (tx) => {
    const [currentCheckout] = await tx
      .select()
      .from(checkouts)
      .where(eq(checkouts.id, checkout.id))
      .limit(1);

    if (!currentCheckout || currentCheckout.status === "paid") return;

    await tx
      .update(checkouts)
      .set({
        status: "paid",
        paidAt,
        providerTransactionId: payload.transaction_id ?? null,
        providerStatus: payload.transaction_status,
        providerPayload: payload,
        updatedAt: new Date(),
      })
      .where(and(eq(checkouts.id, checkout.id), eq(checkouts.status, currentCheckout.status)));

    await grantEntitlementForPaidCheckout(tx, currentCheckout, paidAt);
  });

  return "paid";
}

async function markCheckoutCancelled(
  checkoutId: string,
  payload: MidtransTransaction,
) {
  const now = new Date();

  await db.transaction(async (tx) => {
    const cancelledCheckouts = await tx
      .update(checkouts)
      .set({
        status: "cancelled",
        cancelledAt: now,
        providerTransactionId: payload.transaction_id ?? null,
        providerStatus: payload.transaction_status,
        providerPayload: payload,
        updatedAt: now,
      })
      .where(and(eq(checkouts.id, checkoutId), eq(checkouts.status, "pending")))
      .returning({ id: checkouts.id });

    if (cancelledCheckouts.length === 0) return;

    await tx
      .update(couponRedemptions)
      .set({ status: "released", releasedAt: now, updatedAt: now })
      .where(and(eq(couponRedemptions.checkoutId, checkoutId), eq(couponRedemptions.status, "reserved")));
  });
}

async function storeProviderStatus(checkoutId: string, payload: MidtransTransaction) {
  await db
    .update(checkouts)
    .set({
      providerTransactionId: payload.transaction_id ?? null,
      providerStatus: payload.transaction_status,
      providerPayload: payload,
      updatedAt: new Date(),
    })
    .where(eq(checkouts.id, checkoutId));
}

async function findCheckout(providerOrderId: string) {
  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(and(
      eq(checkouts.paymentProvider, "midtrans"),
      eq(checkouts.providerOrderId, providerOrderId),
    ))
    .limit(1);

  return checkout ?? null;
}

async function storeWebhookEvent({
  checkoutId,
  payload,
  processingResult,
}: {
  checkoutId: string | null;
  payload: MidtransNotificationPayload;
  processingResult: string;
}) {
  const [event] = await db
    .insert(paymentWebhookEvents)
    .values({
      checkoutId,
      paymentProvider: "midtrans",
      providerOrderId: payload.order_id,
      providerTransactionId: payload.transaction_id ?? null,
      providerStatus: payload.transaction_status,
      payload,
      processingResult,
    })
    .returning({ id: paymentWebhookEvents.id });

  return event?.id ?? null;
}

async function updateWebhookResult(eventId: string | null, result: string) {
  if (!eventId) return;

  await db
    .update(paymentWebhookEvents)
    .set({ processingResult: result, processedAt: new Date() })
    .where(eq(paymentWebhookEvents.id, eventId));
}

function getSafeWebhookLogFields(payload: MidtransTransaction) {
  return {
    orderId: payload.order_id,
    transactionId: payload.transaction_id ?? null,
    status: payload.transaction_status,
    statusCode: payload.status_code,
    grossAmount: payload.gross_amount,
    paymentType: payload.payment_type ?? null,
  };
}

function isMidtransNotificationPayload(payload: unknown): payload is MidtransNotificationPayload {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as Record<string, unknown>;

  return typeof candidate.order_id === "string"
    && typeof candidate.status_code === "string"
    && typeof candidate.gross_amount === "string"
    && typeof candidate.transaction_status === "string"
    && typeof candidate.signature_key === "string";
}

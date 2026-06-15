import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  checkouts,
  xenditWebhookEvents,
} from "../../lib/db/schema";
import {
  getCheckoutIdFromExternalId,
  grantEntitlementForPaidCheckout,
  markCheckoutExpired,
} from "./payment-service";
import type { OperationLog } from "../../lib/observability";
import type { XenditInvoice } from "./xendit-client.server";

export type XenditInvoicePayload = XenditInvoice & {
  paid_at?: string;
  updated?: string;
};

export function isValidXenditCallbackToken(headers: Headers) {
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!expectedToken) return false;

  return headers.get("x-callback-token") === expectedToken;
}

export async function processXenditInvoiceWebhook(
  payload: XenditInvoicePayload,
  logger?: OperationLog,
) {
  const checkoutId = getCheckoutIdFromExternalId(payload.external_id);
  const checkout = checkoutId ? await findCheckout(checkoutId) : null;
  const eventId = await storeWebhookEvent({
    checkoutId: checkout?.id ?? null,
    payload,
    processingResult: "stored",
  });

  logger?.set({
    xenditWebhook: {
      ...getSafeWebhookLogFields(payload),
      checkoutId,
      eventId,
    },
  });

  if (!checkout) {
    await updateWebhookResult(eventId, "checkout_not_found");
    logger?.warn("xendit webhook checkout not found", {
      xenditWebhook: {
        ...getSafeWebhookLogFields(payload),
        checkoutId,
        eventId,
        result: "checkout_not_found",
      },
    });
    return { ok: true, result: "checkout_not_found" };
  }

  const result = await applyXenditInvoiceToCheckout(payload, checkout, logger);

  await updateWebhookResult(eventId, result);
  logger?.info("xendit webhook processed", {
    xenditWebhook: {
      ...getSafeWebhookLogFields(payload),
      checkoutId: checkout.id,
      eventId,
      result,
    },
  });

  return { ok: true, result };
}

export async function applyXenditInvoiceToCheckout(
  payload: XenditInvoicePayload,
  checkout: typeof checkouts.$inferSelect,
  logger?: OperationLog,
) {
  if (isPaidXenditInvoice(payload)) {
    return markCheckoutPaidFromXendit(payload, checkout, logger);
  }

  if (payload.status === "EXPIRED") {
    await markCheckoutExpired(checkout.id);
    return "expired";
  }

  await db
    .update(checkouts)
    .set({
      xenditStatus: payload.status,
      providerPayload: payload,
      updatedAt: new Date(),
    })
    .where(eq(checkouts.id, checkout.id));

  return "status_stored";
}

function isPaidXenditInvoice(payload: XenditInvoicePayload) {
  const status = payload.status.toUpperCase();

  if (status === "PAID") return true;
  if (status === "SETTLED") return true;
  if (status === "SUCCESS") return true;
  if (payload.paid_at) return true;

  return false;
}

export async function findCheckoutByXenditInvoiceId(invoiceId: string) {
  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(eq(checkouts.xenditInvoiceId, invoiceId))
    .limit(1);

  return checkout ?? null;
}

async function markCheckoutPaidFromXendit(
  payload: XenditInvoicePayload,
  checkout: typeof checkouts.$inferSelect,
  logger?: OperationLog,
) {
  const paidAmount = Number(payload.paid_amount ?? payload.amount);
  const now = payload.paid_at ? new Date(payload.paid_at) : new Date();

  if (paidAmount !== checkout.finalAmount) {
    await db
      .update(checkouts)
      .set({
        status: "review_required",
        xenditStatus: payload.status,
        providerPayload: payload,
        amountMismatchPayload: payload,
        updatedAt: new Date(),
      })
      .where(eq(checkouts.id, checkout.id));

    logger?.warn("xendit webhook amount mismatch", {
      checkout: {
        id: checkout.id,
        expectedAmount: checkout.finalAmount,
        paidAmount,
      },
      xenditWebhook: getSafeWebhookLogFields(payload),
    });

    return "amount_mismatch";
  }

  if (checkout.status === "paid") {
    return "already_paid";
  }

  await db.transaction(async (tx) => {
    const [currentCheckout] = await tx
      .select()
      .from(checkouts)
      .where(eq(checkouts.id, checkout.id))
      .limit(1);

    if (!currentCheckout || currentCheckout.status === "paid") {
      return;
    }

    await tx
      .update(checkouts)
      .set({
        status: "paid",
        paidAt: now,
        xenditStatus: payload.status,
        providerPayload: payload,
        updatedAt: new Date(),
      })
      .where(and(eq(checkouts.id, checkout.id), eq(checkouts.status, currentCheckout.status)));

    await grantEntitlementForPaidCheckout(tx, currentCheckout, now);
  });

  return "paid";
}

function getSafeWebhookLogFields(payload: XenditInvoicePayload) {
  return {
    invoiceId: payload.id,
    externalId: payload.external_id,
    paymentId: payload.payment_id ?? null,
    status: payload.status,
    amount: payload.amount,
    paidAmount: payload.paid_amount ?? null,
  };
}

async function findCheckout(checkoutId: string) {
  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(eq(checkouts.id, checkoutId))
    .limit(1);

  return checkout ?? null;
}

async function storeWebhookEvent({
  checkoutId,
  payload,
  processingResult,
}: {
  checkoutId: string | null;
  payload: XenditInvoicePayload;
  processingResult: string;
}) {
  const [event] = await db
    .insert(xenditWebhookEvents)
    .values({
      checkoutId,
      xenditInvoiceId: payload.id,
      xenditExternalId: payload.external_id,
      xenditPaymentId: payload.payment_id ?? null,
      xenditStatus: payload.status,
      payload,
      processingResult,
    })
    .returning({ id: xenditWebhookEvents.id });

  return event?.id ?? null;
}

async function updateWebhookResult(eventId: string | null, result: string) {
  if (!eventId) return;

  await db
    .update(xenditWebhookEvents)
    .set({
      processingResult: result,
      processedAt: new Date(),
    })
    .where(eq(xenditWebhookEvents.id, eventId));
}

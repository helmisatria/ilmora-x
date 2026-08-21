import { Buffer } from "node:buffer";

export type MidtransTransaction = {
  transaction_id?: string;
  order_id: string;
  gross_amount: string;
  transaction_status: string;
  status_code: string;
  status_message?: string;
  payment_type?: string;
  fraud_status?: string;
  transaction_time?: string;
  settlement_time?: string;
  expiry_time?: string;
  signature_key?: string;
};

type CreateMidtransSnapTransactionInput = {
  orderId: string;
  amount: number;
  paymentDuration: number;
  customer: {
    firstName: string;
    email: string;
    phone?: string;
  };
  finishRedirectUrl: string;
  errorRedirectUrl: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
};

type MidtransSnapTransaction = {
  token: string;
  redirect_url: string;
};

export async function createMidtransSnapTransaction(input: CreateMidtransSnapTransactionInput) {
  return requestMidtrans<MidtransSnapTransaction>(getMidtransSnapBaseUrl(), "/snap/v1/transactions", {
    method: "POST",
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amount,
      },
      item_details: input.items.map((item) => ({
        id: item.id.slice(0, 50),
        price: item.price,
        quantity: item.quantity,
        name: item.name.slice(0, 50),
        category: item.category.slice(0, 50),
      })),
      customer_details: {
        first_name: input.customer.firstName.slice(0, 255),
        email: input.customer.email,
        ...(input.customer.phone ? { phone: input.customer.phone } : {}),
      },
      callbacks: {
        finish: input.finishRedirectUrl,
        error: input.errorRedirectUrl,
      },
      expiry: {
        start_time: formatMidtransTime(new Date()),
        duration: Math.ceil(input.paymentDuration / 60),
        unit: "minutes",
      },
    }),
  });
}

export async function getMidtransTransaction(orderId: string) {
  return requestMidtrans<MidtransTransaction>(
    getMidtransApiBaseUrl(),
    `/v2/${encodeURIComponent(orderId)}/status`,
    { method: "GET" },
  );
}

function getMidtransSnapBaseUrl() {
  return isMidtransProduction()
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function getMidtransApiBaseUrl() {
  return isMidtransProduction()
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function isMidtransProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() === "true";
}

async function requestMidtrans<TResponse>(baseUrl: string, path: string, init: RequestInit) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is required.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Accept": "application/json",
      "Authorization": `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = getMidtransErrorMessage(payload)
      ?? `Midtrans request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  return payload as TResponse;
}

function getMidtransErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const errorMessages = (payload as { error_messages?: unknown }).error_messages;

  if (Array.isArray(errorMessages)) {
    const messages = errorMessages.filter((message): message is string => typeof message === "string");

    if (messages.length > 0) return messages.join(" ");
  }

  const statusMessage = (payload as { status_message?: unknown }).status_message;

  return typeof statusMessage === "string" && statusMessage.trim() ? statusMessage : null;
}

function formatMidtransTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}:${value("second")} +0700`;
}

import { Buffer } from "node:buffer";

type XenditCustomer = {
  given_names: string;
  email: string;
  mobile_number?: string;
};

type XenditInvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  category: string;
};

export type XenditInvoice = {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  invoice_url?: string;
  expiry_date?: string;
  paid_at?: string;
  payment_id?: string;
  payment_method?: string;
  payment_channel?: string;
};

export type CreateXenditInvoiceInput = {
  externalId: string;
  amount: number;
  description: string;
  invoiceDuration: number;
  customer: XenditCustomer;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  items: XenditInvoiceItem[];
  metadata: Record<string, string | number | boolean | null>;
};

const xenditBaseUrl = "https://api.xendit.co";

export async function createXenditInvoice(input: CreateXenditInvoiceInput) {
  const response = await requestXendit<XenditInvoice>("/v2/invoices", {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      description: input.description,
      invoice_duration: input.invoiceDuration,
      customer: input.customer,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      currency: "IDR",
      items: input.items,
      metadata: input.metadata,
    }),
  });

  return response;
}

export async function getXenditInvoice(invoiceId: string) {
  return requestXendit<XenditInvoice>(`/v2/invoices/${encodeURIComponent(invoiceId)}`, {
    method: "GET",
  });
}

async function requestXendit<TResponse>(path: string, init: RequestInit) {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY is required.");
  }

  const response = await fetch(`${xenditBaseUrl}${path}`, {
    ...init,
    headers: {
      "Authorization": `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = getXenditErrorMessage(payload) ?? `Xendit request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  return payload as TResponse;
}

function getXenditErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const maybeMessage = (payload as { message?: unknown }).message;

  if (typeof maybeMessage === "string" && maybeMessage.trim()) {
    return maybeMessage;
  }

  return null;
}

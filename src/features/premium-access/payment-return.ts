import { z } from "zod";

const checkoutOrderPrefix = "checkout_";

export const paymentReturnSearchSchema = z.object({
  order_id: z.string().optional(),
  transaction_status: z.string().optional(),
  status_code: z.string().optional(),
});

export function getCheckoutIdFromPaymentReturn(orderId: string | undefined) {
  if (!orderId?.startsWith(checkoutOrderPrefix)) return null;

  const checkoutId = orderId.slice(checkoutOrderPrefix.length).trim();

  return checkoutId || null;
}

export function makePaymentReturnUrl(type: "finish" | "error") {
  const appUrl = process.env.APP_URL ?? "http://localhost:8090";

  return `${appUrl.replace(/\/+$/, "")}/payment/${type}`;
}

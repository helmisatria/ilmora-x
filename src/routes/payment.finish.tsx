import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getCheckoutIdFromPaymentReturn,
  paymentReturnSearchSchema,
} from "../features/premium-access/payment-return";

export const Route = createFileRoute("/payment/finish")({
  validateSearch: paymentReturnSearchSchema,
  beforeLoad: ({ search }) => {
    redirectToCheckoutStatus(search.order_id);
  },
});

function redirectToCheckoutStatus(orderId: string | undefined): never {
  const checkoutId = getCheckoutIdFromPaymentReturn(orderId);

  if (!checkoutId) {
    throw redirect({ to: "/premium" });
  }

  throw redirect({
    to: "/checkout/$checkoutId/status",
    params: { checkoutId },
  });
}

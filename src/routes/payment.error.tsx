import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getCheckoutIdFromPaymentReturn,
  paymentReturnSearchSchema,
} from "../features/premium-access/payment-return";

export const Route = createFileRoute("/payment/error")({
  validateSearch: paymentReturnSearchSchema,
  beforeLoad: ({ search }) => {
    const checkoutId = getCheckoutIdFromPaymentReturn(search.order_id);

    if (!checkoutId) {
      throw redirect({ to: "/premium" });
    }

    throw redirect({
      to: "/checkout/$checkoutId/status",
      params: { checkoutId },
    });
  },
});

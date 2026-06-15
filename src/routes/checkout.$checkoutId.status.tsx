import { createFileRoute } from "@tanstack/react-router";
import { CheckoutStatusPage } from "../features/premium-access/checkout-status-page";

export const Route = createFileRoute("/checkout/$checkoutId/status")({
  head: () => ({
    meta: [
      { title: "Status Checkout — IlmoraX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutStatusRoute,
});

function CheckoutStatusRoute() {
  const { checkoutId } = Route.useParams();

  return <CheckoutStatusPage checkoutId={checkoutId} />;
}

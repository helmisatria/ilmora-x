import { createFileRoute } from "@tanstack/react-router";
import {
  CheckoutPage,
  checkoutSearchSchema,
} from "../features/premium-access/checkout-page";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Checkout Premium — IlmoraX" },
      {
        name: "description",
        content:
          "Selesaikan pembelian IlmoraX. Pilih metode pembayaran, gunakan kode kupon, dan aktifkan akses.",
      },
      { property: "og:title", content: "Checkout Premium — IlmoraX" },
      {
        property: "og:description",
        content: "Selesaikan pembelian IlmoraX. Pilih metode pembayaran dan gunakan kode kupon.",
      },
    ],
  }),
  component: CheckoutRoute,
  validateSearch: checkoutSearchSchema,
});

function CheckoutRoute() {
  const { summary } = Route.useLoaderData();
  const { productId } = Route.useSearch();

  return <CheckoutPage productId={productId} summary={summary} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { PremiumPage } from "../features/premium-access/premium-page";
import { listMembershipProducts } from "../features/premium-access/checkout-functions";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/premium")({
  loader: async () => {
    const [summary, products] = await Promise.all([
      listProgressSummary(),
      listMembershipProducts(),
    ]);

    return { summary, products };
  },
  head: () => ({
    meta: [
      { title: "Upgrade Premium — IlmoraX" },
      {
        name: "description",
        content:
          "Buka semua tryout premium, video pembahasan lengkap, dan evaluation dashboard. Paket mulai dari Rp49rb/bulan. Tidak auto-renew.",
      },
      { property: "og:title", content: "Upgrade Premium — IlmoraX" },
      {
        property: "og:description",
        content:
          "Buka semua tryout premium, video pembahasan lengkap, dan evaluation dashboard. Paket mulai dari Rp49rb/bulan.",
      },
    ],
  }),
  component: PremiumRoute,
});

function PremiumRoute() {
  const { summary, products } = Route.useLoaderData();
  return <PremiumPage summary={summary} products={products} />;
}

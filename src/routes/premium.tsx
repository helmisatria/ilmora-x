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
      { title: "IlmoraX Premium | Evaluasi dan pembahasan UKAI" },
      {
        name: "description",
        content:
          "Temukan materi UKAI yang masih lemah, baca pembahasan soal, dan lanjutkan latihan dengan rekomendasi dari hasil tryout.",
      },
      { property: "og:title", content: "IlmoraX Premium | Belajar dari hasil tryout" },
      {
        property: "og:description",
        content:
          "Lihat materi yang masih lemah, baca pembahasannya, lalu lanjutkan dengan latihan yang disarankan.",
      },
    ],
  }),
  component: PremiumRoute,
});

function PremiumRoute() {
  const { summary, products } = Route.useLoaderData();
  return <PremiumPage summary={summary} products={products} />;
}

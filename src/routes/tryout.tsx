import { createFileRoute } from "@tanstack/react-router";
import { analyticsSearchSchema } from "../lib/product-analytics";
import { listProgressSummary } from "../features/student/student-progress-functions";
import { listPublishedTryouts } from "../features/tryout-content/student-tryout-catalog-functions";
import { TryoutCatalogPage } from "../features/tryout-content/tryout-catalog-page";

export const Route = createFileRoute("/tryout")({
  loader: async () => {
    const [summary, tryouts] = await Promise.all([
      listProgressSummary(),
      listPublishedTryouts(),
    ]);

    return { summary, tryouts };
  },
  head: () => ({
    meta: [
      { title: "Try-out UKAI — IlmoraX" },
      {
        name: "description",
        content:
          "Pilih dari 500+ soal UKAI dengan berbagai kategori. Latihan simulasi UKAI dengan timer, pembahasan lengkap, dan evaluasi detail. Gratis dan premium tersedia.",
      },
      { property: "og:title", content: "Try-out UKAI — IlmoraX" },
      {
        property: "og:description",
        content:
          "Pilih dari 500+ soal UKAI dengan berbagai kategori. Latihan simulasi UKAI dengan timer dan pembahasan lengkap.",
      },
    ],
  }),
  component: TryoutRoute,
  validateSearch: analyticsSearchSchema,
});

function TryoutRoute() {
  const { summary, tryouts } = Route.useLoaderData();
  const { intent } = Route.useSearch();

  return <TryoutCatalogPage intent={intent} summary={summary} tryouts={tryouts} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { EvaluationPage } from "../features/student-evaluation/evaluation-page";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/evaluation")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Evaluation Dashboard — IlmoraX" },
      {
        name: "description",
        content:
          "Analisis performa belajar lengkap. Lihat akurasi, breakdown kategori, pola salah, dan rekomendasi prioritas latihan. Fitur Premium.",
      },
      { property: "og:title", content: "Evaluation Dashboard — IlmoraX" },
      {
        property: "og:description",
        content: "Analisis performa belajar lengkap. Lihat akurasi, breakdown kategori, dan rekomendasi latihan.",
      },
    ],
  }),
  component: EvaluationRoute,
});

function EvaluationRoute() {
  const { summary } = Route.useLoaderData();
  return <EvaluationPage summary={summary} />;
}

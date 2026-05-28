import { createFileRoute } from "@tanstack/react-router";
import { listProgressSummary } from "../features/student/student-progress-functions";
import { getAttemptResult } from "../features/tryout-results/student-attempt-result-functions";
import { AttemptResultPage } from "../features/tryout-results/attempt-result-page";

export const Route = createFileRoute("/results/$attemptId")({
  loader: async ({ params }) => {
    const [result, summary] = await Promise.all([
      getAttemptResult({ data: { attemptId: params.attemptId } }),
      listProgressSummary(),
    ]);

    return { result, summary };
  },
  head: () => ({
    meta: [
      { title: "Hasil Tryout — IlmoraX" },
      {
        name: "description",
        content:
          "Lihat hasil tryout: skor, XP yang didapat, dan pembahasan soal. Review jawaban benar dan salah untuk evaluasi belajar.",
      },
      { property: "og:title", content: "Hasil Tryout — IlmoraX" },
      {
        property: "og:description",
        content: "Lihat hasil tryout: skor, XP yang didapat, dan pembahasan soal.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ResultsRoute,
});

function ResultsRoute() {
  const { attemptId } = Route.useParams();
  const { result, summary } = Route.useLoaderData();

  return <AttemptResultPage attemptId={attemptId} result={result} summary={summary} />;
}

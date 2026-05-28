import { createFileRoute } from "@tanstack/react-router";
import { getAttemptResult } from "../features/tryout-results/student-attempt-result-functions";
import {
  AttemptReviewPage,
  attemptReviewSearchSchema,
} from "../features/tryout-results/attempt-review-page";

export const Route = createFileRoute("/results/$attemptId/review")({
  loader: async ({ params }) => {
    const result = await getAttemptResult({ data: { attemptId: params.attemptId } });

    return { result };
  },
  head: () => ({
    meta: [
      { title: "Pembahasan Tryout — IlmoraX" },
      {
        name: "description",
        content:
          "Review dan pelajari pembahasan lengkap soal tryout. Lihat jawaban benar, penjelasan detail, dan video pembelajaran.",
      },
      { property: "og:title", content: "Pembahasan Tryout — IlmoraX" },
      {
        property: "og:description",
        content: "Review dan pelajari pembahasan lengkap soal tryout.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ReviewRoute,
  validateSearch: attemptReviewSearchSchema,
});

function ReviewRoute() {
  const { attemptId } = Route.useParams();
  const { result } = Route.useLoaderData();
  const search = Route.useSearch();

  return <AttemptReviewPage attemptId={attemptId} result={result} search={search} />;
}

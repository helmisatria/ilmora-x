import { createFileRoute } from "@tanstack/react-router";
import { listCategoryOptionsAdmin } from "../../features/admin/admin-taxonomy-functions";
import { listQuestionsAdmin } from "../../features/tryout-content/admin-question-functions";
import { AdminQuestionsPage } from "../../features/tryout-content/admin-questions-page";

export const Route = createFileRoute("/admin/questions")({
  loader: async () => {
    const [categories, questions] = await Promise.all([
      listCategoryOptionsAdmin(),
      listQuestionsAdmin(),
    ]);

    return { categories, questions };
  },
  head: () => ({
    meta: [
      { title: "Questions — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminQuestionsRoute,
});

function AdminQuestionsRoute() {
  const { categories, questions } = Route.useLoaderData();
  return <AdminQuestionsPage categories={categories} questions={questions} />;
}

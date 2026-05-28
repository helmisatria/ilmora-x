import { createFileRoute } from "@tanstack/react-router";
import { listCategoryOptionsAdmin } from "../../features/admin/admin-taxonomy-functions";
import { getTryoutWorkbookAdmin } from "../../features/tryout-content/admin-tryout-functions";
import { AdminTryoutDetailPage } from "../../features/tryout-content/admin-tryout-detail-page";

export const Route = createFileRoute("/admin/tryouts/$id")({
  loader: async ({ params }) => {
    const [workbook, categories] = await Promise.all([
      getTryoutWorkbookAdmin({ data: { tryoutId: params.id } }),
      listCategoryOptionsAdmin(),
    ]);

    return { workbook, categories };
  },
  head: () => ({
    meta: [
      { title: "Try-out Detail — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTryoutDetailRoute,
});

function AdminTryoutDetailRoute() {
  const { workbook, categories } = Route.useLoaderData();
  return <AdminTryoutDetailPage workbook={workbook} categories={categories} />;
}

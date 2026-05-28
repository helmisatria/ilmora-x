import { createFileRoute } from "@tanstack/react-router";
import { listCategoryOptionsAdmin } from "../../features/admin/admin-taxonomy-functions";
import { listTryoutsAdmin } from "../../features/tryout-content/admin-tryout-functions";
import { AdminTryoutsPage } from "../../features/tryout-content/admin-tryouts-page";

export const Route = createFileRoute("/admin/tryouts")({
  loader: async () => {
    const [categories, tryouts] = await Promise.all([
      listCategoryOptionsAdmin(),
      listTryoutsAdmin(),
    ]);

    return { categories, tryouts };
  },
  head: () => ({
    meta: [
      { title: "Try-outs — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTryoutsRoute,
});

function AdminTryoutsRoute() {
  const { categories, tryouts } = Route.useLoaderData();
  return <AdminTryoutsPage categories={categories} tryouts={tryouts} />;
}

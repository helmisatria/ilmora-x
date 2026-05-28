import { createFileRoute } from "@tanstack/react-router";
import { AdminCategoriesPage } from "../../features/admin/admin-categories-page";
import { listCategoryOptionsAdmin } from "../../features/admin/admin-taxonomy-functions";

export const Route = createFileRoute("/admin/categories")({
  loader: async () => {
    const categories = await listCategoryOptionsAdmin();

    return { categories };
  },
  head: () => ({
    meta: [
      { title: "Categories — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCategoriesRoute,
});

function AdminCategoriesRoute() {
  const { categories } = Route.useLoaderData();
  return <AdminCategoriesPage categories={categories} />;
}

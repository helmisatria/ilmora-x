import { createFileRoute } from "@tanstack/react-router";
import { listMediaAdmin } from "../../features/media/admin-media-functions";
import {
  AdminMediaPage,
  adminMediaSearchSchema,
} from "../../features/media/admin-media-page";

export const Route = createFileRoute("/admin/media")({
  validateSearch: adminMediaSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    type: search.type,
  }),
  loader: async ({ deps }) => {
    const mediaList = await listMediaAdmin({
      data: {
        page: deps.page,
        type: deps.type,
      },
    });

    return { mediaList };
  },
  head: () => ({
    meta: [
      { title: "Media — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMediaRoute,
});

function AdminMediaRoute() {
  const { mediaList } = Route.useLoaderData();
  const search = Route.useSearch();

  return <AdminMediaPage mediaList={mediaList} search={search} />;
}

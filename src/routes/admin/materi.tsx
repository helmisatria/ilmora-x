import { createFileRoute } from "@tanstack/react-router";
import {
  AdminMateriPage,
  type AdminMateriCounts,
} from "../../features/admin/admin-materi-page";
import { getAdminContentCounts } from "../../features/admin/admin-content-counts";

export const Route = createFileRoute("/admin/materi")({
  loader: async () => getAdminContentCounts(),
  head: () => ({
    meta: [
      { title: "Materi — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMateriRoute,
});

function AdminMateriRoute() {
  return (
    <AdminMateriPage counts={Route.useLoaderData() as AdminMateriCounts} />
  );
}

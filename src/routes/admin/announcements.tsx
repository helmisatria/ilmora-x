import { createFileRoute } from "@tanstack/react-router";
import { listAnnouncementsAdmin } from "../../features/announcement/admin-announcement-functions";
import { AdminAnnouncementsPage } from "../../features/announcement/admin-announcements-page";

export const Route = createFileRoute("/admin/announcements")({
  loader: async () => {
    const announcements = await listAnnouncementsAdmin();

    return { announcements };
  },
  head: () => ({
    meta: [
      { title: "Announcements — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAnnouncementsRoute,
});

function AdminAnnouncementsRoute() {
  const { announcements } = Route.useLoaderData();
  return <AdminAnnouncementsPage announcements={announcements} />;
}

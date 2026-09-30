import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentViewer } from "../lib/auth-functions";
import { listBadgeCatalog } from "../features/engagement-surface/badge-catalog-functions";
import { ProfilePage } from "../features/profile/profile-page";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/profile")({
  loader: async () => {
    const viewer = await getCurrentViewer();

    if (!viewer) {
      throw redirect({ to: "/auth/login" });
    }

    if (!viewer.admin && !viewer.profile?.completed) {
      throw redirect({ to: "/auth/complete-profile" });
    }

    const [summary, badgeCatalog] = await Promise.all([listProgressSummary(), listBadgeCatalog()]);

    return { summary, badgeCatalog, viewer };
  },
  head: () => ({
    meta: [
      { title: "Profil Belajar — IlmoraX" },
      {
        name: "description",
        content:
          "Kelola profil belajarmu, pantau level dan XP, lihat koleksi lencana, dan atur data akun. Progress belajar farmasi dalam satu tempat.",
      },
      { property: "og:title", content: "Profil Belajar — IlmoraX" },
      {
        property: "og:description",
        content:
          "Kelola profil belajarmu, pantau level dan XP, lihat koleksi lencana. Progress belajar farmasi dalam satu tempat.",
      },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { summary, badgeCatalog, viewer } = Route.useLoaderData();
  return <ProfilePage summary={summary} badgeCatalog={badgeCatalog} viewer={viewer} />;
}

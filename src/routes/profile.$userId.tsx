import { createFileRoute } from "@tanstack/react-router";
import { PublicProfilePage } from "../features/profile/public-profile-page";
import { getPublicStudentProfile } from "../features/profile/public-student-profile-functions";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/profile/$userId")({
  loader: async ({ params }) => {
    const [profile, summary] = await Promise.all([
      getPublicStudentProfile({ data: { studentUserId: params.userId } }),
      listProgressSummary(),
    ]);

    return { profile, summary };
  },
  head: () => ({
    meta: [
      { title: "Profil Pengguna — IlmoraX" },
      {
        name: "description",
        content:
          "Lihat profil publik pengguna IlmoraX. Pantau level, XP, streak, dan koleksi lencana yang telah dibuka.",
      },
      { property: "og:title", content: "Profil Pengguna — IlmoraX" },
      {
        property: "og:description",
        content: "Lihat profil publik pengguna IlmoraX. Pantau level, XP, dan koleksi lencana.",
      },
    ],
  }),
  component: PublicProfileRoute,
});

function PublicProfileRoute() {
  const { profile, summary } = Route.useLoaderData();
  return <PublicProfilePage profile={profile} summary={summary} />;
}

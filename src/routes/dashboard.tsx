import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { listProgressSummary } from "../features/student/student-progress-functions";
import { listPublishedTryouts } from "../features/tryout-content/student-tryout-catalog-functions";

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    const [summary, tryouts] = await Promise.all([
      listProgressSummary(),
      listPublishedTryouts(),
    ]);

    return { summary, tryouts };
  },
  head: () => ({
    meta: [
      { title: "Beranda — IlmoraX" },
      {
        name: "description",
        content:
          "Dashboard belajar IlmoraX. Lanjutkan latihan UKAI, pantau streak dan level, serta akses try-out dan fitur premium.",
      },
      { property: "og:title", content: "Beranda — IlmoraX" },
      {
        property: "og:description",
        content: "Dashboard belajar IlmoraX. Lanjutkan latihan UKAI, pantau streak dan level.",
      },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const data = Route.useLoaderData();
  return <DashboardPage summary={data.summary} tryouts={data.tryouts} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { getTryoutPreparation } from "../features/tryout-attempt/student-attempt-functions";
import { TryoutTakePage } from "../features/tryout-attempt/tryout-take-page";

export const Route = createFileRoute("/tryout/$id")({
  loader: async ({ params }) => {
    const tryout = await getTryoutPreparation({ data: { tryoutId: params.id } });

    return { tryout };
  },
  head: () => ({
    meta: [
      { title: "Try-out UKAI — IlmoraX" },
      {
        name: "description",
        content:
          "Kerjakan try-out UKAI dengan timer dan sistem penilaian real-time. Latihan simulasi UKAI dengan soal pilihan ganda dan pembahasan lengkap.",
      },
      { property: "og:title", content: "Try-out UKAI — IlmoraX" },
      {
        property: "og:description",
        content: "Kerjakan try-out UKAI dengan timer dan sistem penilaian real-time.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: TryoutRoute,
});

function TryoutRoute() {
  const { tryout } = Route.useLoaderData();
  return <TryoutTakePage tryout={tryout} />;
}

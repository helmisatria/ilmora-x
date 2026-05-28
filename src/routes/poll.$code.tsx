import { createFileRoute } from "@tanstack/react-router";
import { StudentPollPage } from "../features/poll-session/student-poll-page";

export const Route = createFileRoute("/poll/$code")({
  head: ({ params }) => ({
    meta: [
      { title: "Live Poll — IlmoraX" },
      {
        name: "description",
        content: `Gabung live poll dengan kode ${params.code}. Vote jawaban dan lihat hasil setelah round ditutup.`,
      },
      { property: "og:title", content: "Live Poll — IlmoraX" },
      { property: "og:description", content: "Gabung live poll dan vote jawaban secara real-time." },
    ],
  }),
  component: PollRoute,
});

function PollRoute() {
  const { code } = Route.useParams();
  return <StudentPollPage code={code} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { PollJoinPage } from "../features/poll-session/poll-join-page";

export const Route = createFileRoute("/poll/join")({
  head: () => ({
    meta: [
      { title: "Gabung Live Poll — IlmoraX" },
      {
        name: "description",
        content:
          "Gabung live poll dengan kode 6 digit dari pembimbing. Vote A/B/C/D/E secara real-time dan lihat hasil setelah round ditutup.",
      },
      { property: "og:title", content: "Gabung Live Poll — IlmoraX" },
      {
        property: "og:description",
        content: "Gabung live poll dengan kode 6 digit dari pembimbing. Vote secara real-time.",
      },
    ],
  }),
  component: PollJoinPage,
});

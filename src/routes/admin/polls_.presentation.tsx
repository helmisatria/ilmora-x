import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  PollPresentationPage,
  type PollSessionDetail,
} from "../../features/poll-session/poll-presentation-page";
import { getPollSessionAdmin } from "../../features/poll-session/poll-admin-functions";

const searchSchema = z.object({
  sessionId: z.string().min(1),
});

export const Route = createFileRoute("/admin/polls_/presentation")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ sessionId: search.sessionId }),
  loader: async ({ deps }) => {
    const detail = await getPollSessionAdmin({ data: { sessionId: deps.sessionId } });

    return { detail };
  },
  head: () => ({
    meta: [
      { title: "Poll Presentation — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PollPresentationRoute,
});

function PollPresentationRoute() {
  const { detail } = Route.useLoaderData() as {
    detail: PollSessionDetail;
  };

  return <PollPresentationPage detail={detail} />;
}

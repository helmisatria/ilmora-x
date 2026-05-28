import { createFileRoute } from "@tanstack/react-router";
import {
  AdminPollsPage,
  adminPollsSearchSchema,
} from "../../features/poll-session/admin-polls-page";
import {
  getPollSessionAdmin,
  listPollSessionsAdmin,
} from "../../features/poll-session/poll-admin-functions";

export const Route = createFileRoute("/admin/polls")({
  validateSearch: adminPollsSearchSchema,
  loaderDeps: ({ search }) => ({ sessionId: search.sessionId }),
  loader: async ({ deps }) => {
    const sessions = await listPollSessionsAdmin();
    const fallbackSessionId = sessions.find((session) => session.status === "open")?.id || sessions[0]?.id || "";
    const requestedSessionExists = Boolean(deps.sessionId && sessions.some((session) => session.id === deps.sessionId));
    const selectedSessionId = requestedSessionExists ? deps.sessionId || "" : fallbackSessionId;
    const detail = selectedSessionId
      ? await getPollSessionAdmin({ data: { sessionId: selectedSessionId } })
      : null;

    return { sessions, detail };
  },
  head: () => ({
    meta: [
      { title: "Polls — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPollsRoute,
});

function AdminPollsRoute() {
  const { sessions, detail } = Route.useLoaderData();
  return <AdminPollsPage sessions={sessions} detail={detail} />;
}

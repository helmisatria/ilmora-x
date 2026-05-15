import { createFileRoute } from "@tanstack/react-router";
import type { PollEvent } from "../../../lib/poll-events";

export const Route = createFileRoute("/api/polls/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const sessionId = url.searchParams.get("sessionId");

        if (!code && !sessionId) {
          return Response.json({ message: "Poll code or session ID is required." }, { status: 400 });
        }

        if (code && !/^\d{6}$/.test(code)) {
          return Response.json({ message: "Poll code is invalid." }, { status: 400 });
        }

        if (sessionId) {
          const { getCurrentViewerFromHeaders } = await import("../../../lib/auth-functions");
          const viewer = await getCurrentViewerFromHeaders(request.headers);

          if (!viewer) {
            return Response.json({ message: "Authentication is required." }, { status: 401 });
          }

          if (!viewer.admin) {
            return Response.json({ message: "Admin access is required." }, { status: 403 });
          }
        }

        return createPollEventResponse(request, (event) => {
          if (sessionId && event.sessionId === sessionId) return true;
          if (code && event.code === code) return true;

          return false;
        });
      },
    },
  },
});

function createPollEventResponse(request: Request, shouldSend: (event: PollEvent) => boolean) {
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let unsubscribe = () => {};
  let cancelled = false;

  const cleanup = () => {
    if (heartbeatId) {
      clearInterval(heartbeatId);
      heartbeatId = null;
    }

    unsubscribe();
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (value: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(value));
      };

      const close = () => {
        if (closed) return;

        closed = true;
        cancelled = true;
        cleanup();
        controller.close();
      };

      heartbeatId = setInterval(() => {
        send(": ping\n\n");
      }, 25_000);

      request.signal.addEventListener("abort", close);

      send("retry: 5000\n\n");

      try {
        const { subscribePollEvents } = await import("../../../lib/poll-events");

        unsubscribe = await subscribePollEvents((event) => {
          if (!shouldSend(event)) return;

          send(`event: poll-update\ndata: ${JSON.stringify(event)}\n\n`);
        });
      } catch (error) {
        cleanup();
        controller.error(error);
        return;
      }

      if (cancelled || request.signal.aborted) {
        cleanup();
      }
    },
    cancel() {
      cancelled = true;
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}

import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";

export const Route = createFileRoute("/api/healthz")({
  server: {
    handlers: {
      GET: async () => {
        const { db } = await import("../../lib/db/client");

        try {
          await db.execute(sql`SELECT 1`);
          return new Response(JSON.stringify({ status: "ok", database: "connected" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              status: "error",
              database: "disconnected",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});

# Use Server-Sent Events for Poll Session Live Updates

Poll Session live state updates use Server-Sent Events (SSE), not WebSockets. Mutations publish lightweight invalidation events through Postgres `LISTEN/NOTIFY`, and connected Admin/Student clients refetch the existing authoritative server state when an event arrives.

We chose SSE because Poll Sessions need one-way server-to-client updates, not bidirectional sockets. This keeps the existing TanStack Start server functions as the source of truth, avoids a separate realtime service, and still works across multiple Node instances that share the same Postgres database. Clients keep a slow HTTP refetch fallback so missed events or broken SSE connections self-heal without returning to 3-second polling.

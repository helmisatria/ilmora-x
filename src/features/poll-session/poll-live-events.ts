import { z } from "zod";

const pollEventChannel = "ilmorax_poll_events";

const pollEventSchema = z.object({
  type: z.literal("poll-updated"),
  sessionId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
  occurredAt: z.string().datetime(),
});

export type PollEvent = z.infer<typeof pollEventSchema>;

type PollEventListener = (event: PollEvent) => void;

const listeners = new Set<PollEventListener>();

let sqlPromise: Promise<Awaited<ReturnType<typeof createPollSql>>> | null = null;
let listenPromise: Promise<void> | null = null;

async function createPollSql() {
  if (typeof window !== "undefined") {
    throw new Error("Poll events are only available on the server.");
  }

  await import("dotenv/config");

  const { default: postgres } = await import("postgres");
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Poll events.");
  }

  return postgres(databaseUrl, { max: 2 });
}

async function getPollSql() {
  if (sqlPromise) return sqlPromise;

  sqlPromise = createPollSql();
  return sqlPromise;
}

function emitPollEvent(event: PollEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

function parsePollEvent(payload: string) {
  return pollEventSchema.parse(JSON.parse(payload));
}

async function startPollEventListener() {
  const sql = await getPollSql();

  await sql.listen(pollEventChannel, (payload) => {
    try {
      emitPollEvent(parsePollEvent(payload));
    } catch (error) {
      console.error("Invalid Poll event payload.", error);
    }
  });
}

async function ensurePollEventListener() {
  if (listenPromise) return listenPromise;

  listenPromise = startPollEventListener().catch((error) => {
    listenPromise = null;
    throw error;
  });

  return listenPromise;
}

export async function publishPollEvent(event: PollEvent) {
  const sql = await getPollSql();
  const payload = JSON.stringify(pollEventSchema.parse(event));

  await sql.notify(pollEventChannel, payload);
}

export async function subscribePollEvents(listener: PollEventListener) {
  await ensurePollEventListener();

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

import * as schema from "./schema";

const isServer = import.meta.env?.SSR === true || typeof window === "undefined";

if (isServer) {
  await import("dotenv/config");
}

async function createDb() {
  const [{ drizzle }, { default: postgres }] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("postgres"),
  ]);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const queryClient = postgres(databaseUrl, {
    max: 10,
  });

  return {
    db: drizzle(queryClient, { schema }),
    close: () => queryClient.end(),
  };
}

function createBrowserDbProxy() {
  return new Proxy({}, {
    get() {
      throw new Error("Database access is only available on the server.");
    },
  }) as Awaited<ReturnType<typeof createDb>>["db"];
}

const client = isServer ? await createDb() : null;

export const db = client?.db ?? createBrowserDbProxy();
export type Database = typeof db;

export async function closeDb() {
  await client?.close();
}

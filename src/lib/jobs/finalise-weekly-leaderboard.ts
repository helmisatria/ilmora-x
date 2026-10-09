import "dotenv/config";
import { sql } from "drizzle-orm";
import type { Database } from "../db/client";

const DATABASE_READY_ATTEMPTS = 6;
const DATABASE_READY_DELAY_MS = 5_000;

type ScriptOptions = {
  help: boolean;
  weekStartDate: string | null;
};

let closeDatabase: (() => Promise<void>) | null = null;

async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const [{ finalisePreviousWeeklyLeaderboard, finaliseWeeklyLeaderboard }, dbClient] = await Promise.all([
    import("../../features/leaderboard/leaderboard"),
    import("../db/client"),
  ]);

  closeDatabase = dbClient.closeDb;
  await waitForDatabase(dbClient.db);

  const startedAt = new Date();
  const result = options.weekStartDate
    ? await finaliseWeeklyLeaderboard(options.weekStartDate)
    : await finalisePreviousWeeklyLeaderboard();
  const finishedAt = new Date();

  console.log(JSON.stringify({
    job: "finalise-weekly-leaderboard",
    ok: true,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    ...result,
  }));
}

// The cron can start while Postgres is still waking up, so retry the first connection.
async function waitForDatabase(db: Database) {
  for (let attempt = 1; attempt <= DATABASE_READY_ATTEMPTS; attempt += 1) {
    try {
      await db.execute(sql`SELECT 1`);
      return;
    } catch (error) {
      if (attempt === DATABASE_READY_ATTEMPTS) throw error;

      console.warn(JSON.stringify({
        job: "finalise-weekly-leaderboard",
        waitingForDatabase: true,
        attempt,
        error: describeError(error),
      }));
      await new Promise((resolve) => setTimeout(resolve, DATABASE_READY_DELAY_MS));
    }
  }
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.cause) return `${error.message} (cause: ${describeError(error.cause)})`;

  return error.message;
}

function parseOptions(args: string[]): ScriptOptions {
  const options: ScriptOptions = {
    help: false,
    weekStartDate: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--week") {
      const weekStartDate = args[index + 1];

      if (!weekStartDate) {
        throw new Error("--week requires a value like 2026-05-04.");
      }

      options.weekStartDate = validateWeekStartDate(weekStartDate);
      index += 1;
      continue;
    }

    if (arg.startsWith("--week=")) {
      options.weekStartDate = validateWeekStartDate(arg.slice("--week=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function validateWeekStartDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  throw new Error("Week start date must use YYYY-MM-DD format.");
}

function printHelp() {
  console.log(`Usage:
  pnpm run jobs:finalise-weekly-leaderboard
  pnpm run jobs:finalise-weekly-leaderboard -- --week 2026-05-04

Railway Cron schedule for Monday 00:05 WIB:
  5 17 * * 0`);
}

main()
  .catch((error) => {
    console.error(JSON.stringify({
      job: "finalise-weekly-leaderboard",
      ok: false,
      error: describeError(error),
    }));

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase?.();
  });

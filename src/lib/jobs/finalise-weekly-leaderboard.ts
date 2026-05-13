import "dotenv/config";

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
    import("../domain/leaderboard"),
    import("../db/client"),
  ]);

  closeDatabase = dbClient.closeDb;

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
      error: error instanceof Error ? error.message : String(error),
    }));

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase?.();
  });

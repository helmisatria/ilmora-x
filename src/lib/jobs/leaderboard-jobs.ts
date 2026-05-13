import { PgBoss } from "pg-boss";
import { finalisePreviousWeeklyLeaderboard } from "../domain/leaderboard";

const weeklyFinalizationQueue = "weekly-leaderboard-finalization";
const jakartaTimezone = "Asia/Jakarta";

let startPromise: Promise<void> | null = null;

export function startLeaderboardJobs(options: { force?: boolean } = {}) {
  if (!options.force && getRuntimeEnv("ENABLE_PG_BOSS_JOBS") !== "true") {
    return Promise.resolve();
  }

  if (startPromise) return startPromise;

  startPromise = startLeaderboardJobsOnce();

  return startPromise;
}

async function startLeaderboardJobsOnce() {
  const databaseUrl = getRuntimeEnv("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start leaderboard jobs.");
  }

  const boss = new PgBoss(databaseUrl);

  boss.on("error", (error) => {
    console.error("pg-boss error:", error);
  });

  await boss.start();
  await boss.createQueue(weeklyFinalizationQueue);
  await boss.work(
    weeklyFinalizationQueue,
    { pollingIntervalSeconds: 30 },
    async () => {
      await finalisePreviousWeeklyLeaderboard();
    },
  );
  await boss.schedule(
    weeklyFinalizationQueue,
    "5 0 * * 1",
    null,
    { tz: jakartaTimezone },
  );

  registerShutdownHandler(boss);
}

function getRuntimeEnv(name: string) {
  return globalThis.process?.env?.[name];
}

function registerShutdownHandler(boss: PgBoss) {
  const processLike = globalThis.process;

  if (!processLike?.once) return;

  processLike.once("SIGTERM", async () => {
    await boss.stop({ graceful: true, timeout: 30_000 });
  });
}

import { spawn } from "node:child_process";

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 8000;

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

const retryOptions: RetryOptions = {
  maxAttempts: parsePositiveInteger(process.env.DB_MIGRATE_RETRIES, DEFAULT_MAX_ATTEMPTS),
  baseDelayMs: parsePositiveInteger(process.env.DB_MIGRATE_BASE_DELAY_MS, DEFAULT_BASE_DELAY_MS),
  maxDelayMs: parsePositiveInteger(process.env.DB_MIGRATE_MAX_DELAY_MS, DEFAULT_MAX_DELAY_MS),
};

const cliArgs = process.argv.slice(2);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt: number) {
  if (attempt <= 0) {
    return retryOptions.baseDelayMs;
  }
  const exponentialDelay = retryOptions.baseDelayMs * 2 ** (attempt - 1);
  return Math.min(exponentialDelay, retryOptions.maxDelayMs);
}

function runDrizzleMigration() {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("drizzle-kit", ["migrate", ...cliArgs], {
      stdio: "inherit",
      shell: false,
    });

    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`drizzle-kit migrate failed with exit code ${code}`));
    });
  });
}

async function runWithRetry() {
  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt += 1) {
    const isLastAttempt = attempt === retryOptions.maxAttempts;

    try {
      console.info(`Running migration attempt ${attempt}/${retryOptions.maxAttempts}...`);
      await runDrizzleMigration();
      console.info("Migration completed successfully.");
      return;
    } catch (error) {
      if (isLastAttempt) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Migration failed after ${attempt} attempts: ${message}`);
        process.exit(1);
      }

      const delay = computeBackoffMs(attempt);
      console.warn(`Migration attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

await runWithRetry();

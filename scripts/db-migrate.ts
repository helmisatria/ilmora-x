import { spawn } from "node:child_process";
import { stripVTControlCharacters } from "node:util";

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

type MigrationOutput = {
  stdout: string;
  stderr: string;
};

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 8000;
const MAX_FAILURE_LINES = 80;

class MigrationError extends Error {
  constructor(
    message: string,
    readonly output: MigrationOutput,
  ) {
    super(message);
    this.name = "MigrationError";
  }
}

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

function formatFailureOutput(label: string, value: string) {
  const lines = stripVTControlCharacters(value)
    .replaceAll("\r", "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return `${label}: <no output>`;
  }

  const visibleLines = lines.slice(-MAX_FAILURE_LINES);
  return `${label}:\n${visibleLines.join("\n")}`;
}

function printFailureOutput(output: MigrationOutput) {
  console.error("\nCaptured drizzle-kit output from failed attempt:");
  console.error(formatFailureOutput("stderr", output.stderr));
  console.error(formatFailureOutput("stdout", output.stdout));
}

function runDrizzleMigration() {
  return new Promise<void>((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const proc = spawn("drizzle-kit", ["migrate", ...cliArgs], {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
    });

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    proc.on("error", (error) => {
      reject(new MigrationError(error.message, { stdout, stderr }));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new MigrationError(`drizzle-kit migrate failed with exit code ${code}`, { stdout, stderr }));
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
        if (error instanceof MigrationError) {
          printFailureOutput(error.output);
        }
        process.exit(1);
      }

      const delay = computeBackoffMs(attempt);
      console.warn(`Migration attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (error instanceof MigrationError) {
        printFailureOutput(error.output);
      }
      await sleep(delay);
    }
  }
}

await runWithRetry();

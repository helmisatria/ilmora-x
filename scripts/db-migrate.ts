import "dotenv/config";

import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 8000;
const MIGRATIONS_FOLDER = process.env.DB_MIGRATIONS_FOLDER ?? "./drizzle";

class MigrationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationConfigurationError";
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

function getErrorField(error: unknown, field: string) {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const value = (error as Error & Record<string, unknown>)[field];

  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return value;
}

function formatMigrationError(error: unknown) {
  if (!(error instanceof Error)) {
    return `Unknown migration error: ${String(error)}`;
  }

  const lines = [`${error.name}: ${error.message}`];

  for (const field of ["code", "severity", "detail", "hint", "where", "schema_name", "table_name", "column_name"]) {
    const value = getErrorField(error, field);

    if (value) {
      lines.push(`${field}: ${value}`);
    }
  }

  if (error.stack) {
    lines.push(error.stack);
  }

  return lines.join("\n");
}

async function runDrizzleMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new MigrationConfigurationError("DATABASE_URL is required for database migrations.");
  }

  const migrationFiles = readMigrationFiles({
    migrationsFolder: MIGRATIONS_FOLDER,
  });

  console.info(`Found ${migrationFiles.length} migration file(s) in ${MIGRATIONS_FOLDER}.`);

  const queryClient = postgres(databaseUrl, {
    connect_timeout: parsePositiveInteger(process.env.DB_MIGRATE_CONNECT_TIMEOUT_SECONDS, 30),
    max: 1,
  });

  try {
    const db = drizzle(queryClient);

    await migrate(db, {
      migrationsFolder: MIGRATIONS_FOLDER,
    });
  } finally {
    await queryClient.end();
  }
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
      console.error("Migration attempt failed:");
      console.error(formatMigrationError(error));

      if (error instanceof MigrationConfigurationError || isLastAttempt) {
        console.error(`Migration failed after ${attempt} attempts.`);
        process.exit(1);
      }

      const delay = computeBackoffMs(attempt);
      console.warn(`Retrying migration in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

await runWithRetry();

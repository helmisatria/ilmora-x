#!/usr/bin/env node
// Local end-to-end run that mirrors .github/workflows/e2e.yml:
// a disposable database, migrations and seed, a build, fixtures, then Playwright.
//
//   pnpm test:e2e                 # whole suite, 3 workers
//   pnpm test:e2e admin.spec.ts   # extra args go to Playwright
//   E2E_LOCAL_DEV=1 pnpm test:e2e one.spec.ts   # dev server for a quick loop
import { spawn } from "node:child_process";
import { once } from "node:events";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ quiet: true });

const QA_DATABASE = "ilmora_admin_qa";
const DEFAULT_PORT = 8095;
const repoRoot = resolve(import.meta.dirname, "..");
const logPath = resolve(repoRoot, ".e2e-app.log");
// A production build matches CI and hydrates fast enough for parallel workers.
// The dev server is only a shortcut for iterating on one spec.
const prod = process.env.E2E_LOCAL_DEV !== "1";

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

function run(command, args, env) {
  return new Promise((done) => {
    const child = spawn(command, args, { cwd: repoRoot, env, stdio: "inherit" });
    child.on("exit", (code, signal) => done(code ?? (signal ? 1 : 0)));
  });
}

async function portIsFree(port) {
  return new Promise((done) => {
    const probe = createServer();
    probe.once("error", () => done(false));
    probe.once("listening", () => probe.close(() => done(true)));
    probe.listen(port, "127.0.0.1");
  });
}

async function findPort(start) {
  for (let port = start; port < start + 25; port += 1) {
    if (await portIsFree(port)) return port;
  }
  throw new Error(`No free port between ${start} and ${start + 24}. Set E2E_PORT to another range.`);
}

async function waitForHealth(baseURL) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/api/healthz`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await sleep(500);
  }
  throw new Error(`The app did not answer at ${baseURL}/api/healthz. Check .e2e-app.log.`);
}

async function stopServer(server) {
  if (!server.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    return;
  }
  const stopped = await Promise.race([once(server, "exit").then(() => true), sleep(5_000).then(() => false)]);
  if (!stopped) {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      // Already gone.
    }
  }
}

function resolveDatabaseURL() {
  const incomingTarget = process.env.E2E_BASE_URL;
  if (incomingTarget && !["localhost", "127.0.0.1"].includes(new URL(incomingTarget).hostname)) {
    throw new Error(
      `pnpm test:e2e always runs a local environment, but E2E_BASE_URL is ${incomingTarget}.\n` +
        'Use "pnpm test:e2e:full" for staging or another deployment.',
    );
  }

  const databaseURL = process.env.DATABASE_URL;
  if (!databaseURL) throw new Error("DATABASE_URL is required. Copy .env.example to .env first.");

  const base = new URL(databaseURL);
  if (!["localhost", "127.0.0.1"].includes(base.hostname)) {
    throw new Error(`Refusing to reset ${QA_DATABASE} on a non-local database host (${base.hostname}).`);
  }

  return databaseURL;
}

async function main() {
  const databaseURL = resolveDatabaseURL();
  const qaDatabaseURL = new URL(databaseURL);
  qaDatabaseURL.pathname = `/${QA_DATABASE}`;
  const maintenanceURL = new URL(databaseURL);
  maintenanceURL.pathname = "/postgres";

  const env = {
    ...process.env,
    DATABASE_URL: qaDatabaseURL.href,
    ADMIN_EMAILS: "e2e-admin@example.test",
  };

  console.log(`Resetting ${QA_DATABASE}...`);
  const maintenance = postgres(maintenanceURL.href, { max: 1, onnotice: () => undefined });
  try {
    await maintenance.unsafe(`drop database if exists ${QA_DATABASE} with (force)`);
    await maintenance.unsafe(`create database ${QA_DATABASE}`);
  } finally {
    await maintenance.end();
  }

  console.log("Migrating and seeding...");
  if ((await run("pnpm", ["db:migrate"], env)) !== 0) throw new Error("Database migration failed.");
  if ((await run("pnpm", ["db:seed"], env)) !== 0) throw new Error("Database seed failed.");

  const port = await findPort(Number(process.env.E2E_PORT ?? DEFAULT_PORT));
  const baseURL = `http://127.0.0.1:${port}`;

  if (prod) {
    console.log("Building for a production run...");
    if ((await run("pnpm", ["build"], env)) !== 0) throw new Error("Production build failed.");
  }

  const serverEnv = {
    ...env,
    HOST: "127.0.0.1",
    PORT: String(port),
    BETTER_AUTH_URL: baseURL,
    APP_URL: baseURL,
    ...(prod ? { RAILWAY_ENVIRONMENT_NAME: "staging" } : {}),
  };

  mkdirSync(resolve(repoRoot, "e2e/.auth"), { recursive: true });
  const logFd = openSync(logPath, "w");
  const server = spawn("pnpm", prod ? ["start"] : ["dev", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: repoRoot,
    env: serverEnv,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });

  const shutdown = async () => {
    await stopServer(server);
    closeSync(logFd);
  };
  process.once("SIGINT", async () => {
    await shutdown();
    process.exit(130);
  });

  try {
    console.log(`Waiting for ${baseURL}...`);
    await waitForHealth(baseURL);

    console.log("Preparing fixtures and browser sessions...");
    if ((await run("pnpm", ["exec", "tsx", "e2e/prepare-local.ts"], { ...env, E2E_BASE_URL: baseURL })) !== 0) {
      throw new Error("Fixture preparation failed.");
    }

    return await run("pnpm", ["exec", "playwright", "test", "--config=e2e/playwright.config.ts", ...process.argv.slice(2)], {
      ...env,
      E2E_BASE_URL: baseURL,
      E2E_REQUIRE_AUTH: "1",
      E2E_EXPECT_DEV_CONTROLS: prod ? "0" : "1",
      E2E_WORKERS: process.env.E2E_WORKERS ?? "3",
    });
  } finally {
    await shutdown();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });

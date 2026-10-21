import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const authDir = resolve("e2e/.auth");
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8095";
const hostname = new URL(baseURL).hostname;
const isLocal = ["localhost", "127.0.0.1"].includes(hostname);

if (["ilmorax.com", "www.ilmorax.com"].includes(hostname)) {
  throw new Error("This regression suite changes overdue Checkout state. Run it on staging or a local environment.");
}

// The two-account checks need the ordinary Admin that e2e/prepare-local.ts creates.
// Staging sessions are captured by hand, so they cannot be assumed to have that account.
const requiredStates = isLocal
  ? ["admin.json", "admin-b.json", "free-student.json"]
  : ["admin.json", "free-student.json"];

if (process.env.E2E_REQUIRE_AUTH === "1") {
  const missing = requiredStates.filter((file) => !existsSync(resolve(authDir, file)));

  if (missing.length > 0) {
    const hint = isLocal
      ? "Run pnpm test:e2e to build a fresh local environment and its sessions."
      : "Run pnpm test:e2e:auth for each role.";
    throw new Error(`Missing Playwright sessions for ${baseURL}: ${missing.join(", ")}. ${hint}`);
  }
}

export default defineConfig({
  testDir: "./tests",
  // Test files run in parallel. Tests inside a file stay ordered because several of them
  // share fixtures (for example the Admin Student filters restore the account they touch).
  fullyParallel: false,
  // Local runs use a disposable database, so files can run side by side.
  // CI keeps one worker to make a failure easy to attribute.
  workers: process.env.CI ? 1 : Number(process.env.E2E_WORKERS ?? 3),
  retries: 1,
  // Parallel local workers share one server, so a revalidated panel can take longer than
  // the 5s default to settle while another worker is using server functions.
  expect: { timeout: 10_000 },
  globalSetup: "./global-setup.ts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const authDir = resolve("e2e/.auth");
const requiredStates = ["admin.json", "free-student.json"];
const baseURL = process.env.E2E_BASE_URL ?? "https://staging.ilmorax.com";

if (["ilmorax.com", "www.ilmorax.com"].includes(new URL(baseURL).hostname)) {
  throw new Error("This regression suite changes overdue Checkout state. Run it on staging or a local environment.");
}

if (process.env.E2E_REQUIRE_AUTH === "1") {
  const missing = requiredStates.filter((file) => !existsSync(resolve(authDir, file)));

  if (missing.length > 0) {
    throw new Error(`Missing Playwright sessions: ${missing.join(", ")}. Run pnpm test:e2e:auth for each role.`);
  }
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    timezoneId: "Asia/Jakarta",
    launchOptions: {
      executablePath: process.env.E2E_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});

import { chmod, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { chromium } from "@playwright/test";

const role = process.argv[2];
const routes = {
  admin: "/admin/users",
  "free-student": "/evaluation",
};

if (!Object.hasOwn(routes, role)) {
  console.error("Usage: pnpm test:e2e:auth <admin|free-student>");
  process.exit(1);
}

const baseURL = process.env.E2E_BASE_URL ?? "https://staging.ilmorax.com";
if (["ilmorax.com", "www.ilmorax.com"].includes(new URL(baseURL).hostname)) {
  throw new Error("Capture a session from staging or a local environment, not production.");
}
const target = new URL(routes[role], baseURL);
const authDir = resolve("e2e/.auth");
const authFile = resolve(authDir, `${role}.json`);
const browser = await chromium.launch({
  headless: false,
  executablePath: process.env.E2E_CHROMIUM_EXECUTABLE_PATH || undefined,
});

try {
  const context = await browser.newContext({ timezoneId: "Asia/Jakarta" });
  const page = await context.newPage();
  const prompt = createInterface({ input: process.stdin, output: process.stdout });

  await page.goto(new URL("/auth/login", baseURL).href);
  try {
    await prompt.question(`Sign in as ${role} in the opened browser, then press Enter here. `);
  } finally {
    prompt.close();
  }

  await page.goto(target.href);
  if (new URL(page.url()).pathname.startsWith("/auth/")) {
    throw new Error("The session did not reach the protected page. Sign in and try again.");
  }

  if (role === "admin") {
    await page.getByRole("heading", { name: "Users", exact: true }).waitFor();
  } else {
    await page.getByText("Free", { exact: true }).waitFor();
    await page.getByRole("link", { name: "Unlock Breakdown" }).first().waitFor();
  }

  await mkdir(authDir, { recursive: true, mode: 0o700 });
  await context.storageState({ path: authFile });
  await chmod(authFile, 0o600);
  console.log(`Saved ${role} session to ${authFile}. Keep this file private.`);
} finally {
  await browser.close();
}

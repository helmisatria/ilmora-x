import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { request } from "@playwright/test";

const authDir = resolve("e2e/.auth");
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8095";
const isLocal = ["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname);

type Session = {
  file: string;
  path: string;
  kind: "super-admin" | "ordinary-admin" | "free-student";
};

// A local run is built by e2e/local.mjs: the seed puts the first ADMIN_EMAILS entry in as
// Super Admin, and prepare-local.ts adds an ordinary Admin plus a free Student.
// Staging sessions are captured by hand, so only freshness is checked there.
const sessions: Session[] = isLocal
  ? [
      { file: "admin.json", path: "/admin/users", kind: "super-admin" },
      { file: "admin-b.json", path: "/admin/users", kind: "ordinary-admin" },
      { file: "free-student.json", path: "/evaluation", kind: "free-student" },
    ]
  : [
      { file: "admin.json", path: "/admin/users", kind: "super-admin" },
      { file: "free-student.json", path: "/evaluation", kind: "free-student" },
    ];

function setupHint() {
  return isLocal
    ? 'Run "pnpm test:e2e" to rebuild the local database, fixtures, and sessions.'
    : 'Run "pnpm test:e2e:auth" for each role.';
}

export default async function globalSetup() {
  if (process.env.E2E_REQUIRE_AUTH !== "1") return;

  for (const session of sessions) {
    const state = resolve(authDir, session.file);

    if (!existsSync(state)) {
      throw new Error(`Missing ${session.file} for ${baseURL}. ${setupHint()}`);
    }

    const context = await request.newContext({ baseURL, storageState: state });

    try {
      const page = await context.get(session.path, { maxRedirects: 0 });

      if (page.status() >= 300 && page.status() < 400) {
        throw new Error(
          `${session.file} is not signed in for ${baseURL}. Sessions are tied to one origin and expire. ${setupHint()}`,
        );
      }

      if (page.status() !== 200) {
        throw new Error(`${session.file} returned ${page.status()} for ${session.path}. ${setupHint()}`);
      }

      if (isLocal && session.kind !== "free-student") {
        const monitoring = await context.get("/admin/monitoring", { maxRedirects: 0 });
        const restricted = monitoring.ok() && (await monitoring.text()).includes("Super Admin access required");
        const wantsSuperAdmin = session.kind === "super-admin";

        if (restricted === wantsSuperAdmin) {
          const detail = wantsSuperAdmin
            ? "is an ordinary Admin, but the Monitoring checks need the seeded Super Admin"
            : "is a Super Admin, but the two-account checks need the ordinary Admin from e2e/prepare-local.ts";
          throw new Error(`e2e/.auth/${session.file} ${detail}. ${setupHint()}`);
        }
      }
    } finally {
      await context.dispose();
    }
  }
}

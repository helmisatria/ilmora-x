# Playwright regression checks

`pnpm test:e2e` builds a disposable local environment and runs the whole suite: a fresh `ilmora_admin_qa` database, migrations and seed, a production build, fixtures and browser sessions, then Playwright with three workers. It mirrors `.github/workflows/e2e.yml` so a local pass means the same thing as a CI pass.

The checks cover login protection, Admin Student search and filters, Insights, weekly Leaderboard monitoring, overdue Checkout display, profile join date, and the free Evaluation breakdown. The tests do not create a payment or change an account. Opening Admin Payments can expire already overdue Checkouts and release their Coupon reservations, as the page normally does.

## Local run

```bash
pnpm install
pnpm test:e2e                    # whole suite
pnpm test:e2e admin.spec.ts      # one file
pnpm test:e2e --grep Insights    # one test
```

- `pretest:e2e` installs the Chromium build that the pinned Playwright version expects. Do not hand-point `launchOptions.executablePath` at a browser from another version; that only hides the mismatch.
- `e2e/local.mjs` drops and recreates `ilmora_admin_qa` on the host in `DATABASE_URL`, runs `db:migrate` and `db:seed` with `ADMIN_EMAILS=e2e-admin@example.test`, builds the app, starts it on port 8095 or the next free port, and runs `e2e/prepare-local.ts` before the tests.
- The app log goes to the ignored `.e2e-app.log`.
- `E2E_PORT` moves the starting port. `E2E_WORKERS` changes the worker count (default 3).
- `E2E_LOCAL_DEV=1 pnpm test:e2e admin-badges.spec.ts` starts the Vite dev server instead of a build. Use it for a quick loop on one spec; the dev server hydrates more slowly, so the whole suite should run against a build.

The run creates three sessions: the seeded Super Admin, an ordinary Admin, and a free Student with a completed Attempt and a category breakdown. `e2e/global-setup.ts` checks each session against the target origin and checks that the two Admin sessions have the roles the two-account tests expect. A stale or wrong-role session fails once, with the command that fixes it, instead of failing several tests with assertion errors.

Playwright writes failure screenshots and traces to the ignored `test-results/` directory. Run `pnpm exec playwright show-report` to inspect the HTML report.

## Staging

Sessions are bound to one origin and expire, so staging needs its own capture:

```bash
E2E_BASE_URL=https://staging.ilmorax.com pnpm test:e2e:auth admin
E2E_BASE_URL=https://staging.ilmorax.com pnpm test:e2e:auth free-student
E2E_BASE_URL=https://staging.ilmorax.com pnpm test:e2e:full
```

Each capture command opens a browser. Complete Google sign-in there, then press Enter in the terminal. The helper verifies that the account reached the intended page before saving its browser state. Session files live in the ignored `e2e/.auth/` directory and contain login cookies; keep them private.

`pnpm test:e2e:full` requires the session files and fails early when one is missing. `pnpm test:e2e:smoke` runs the public checks only and needs no account. `E2E_BASE_URL` defaults to `http://127.0.0.1:8095`, so staging always needs it set explicitly.

## Admin content checks

`admin-content.spec.ts` creates try-outs and questions and imports spreadsheets. It runs only when the target is localhost or 127.0.0.1 and a local Admin session exists, and is skipped on staging. It covers manual creation, answer/pembahasan persistence, invalid answers and order, publication guards, cancel/removal, Excel preview and repeated upload, export, the formatted template, and mobile navigation.

The local run above already prepares the database, the second ordinary Admin, and the sessions these checks need, so this is enough:

```sh
pnpm test:e2e admin-content.spec.ts
pnpm exec tsx e2e/check-admin-content.ts
```

`check-admin-content.ts` refuses any database other than a local database named `ilmora_admin_qa`. It checks shared-question image preservation, import rollback, the last-question guard, and lifetime-owner protection. Both commands leave QA fixtures in the dedicated database for inspection; the next `pnpm test:e2e` resets it. Never point fixture setup at staging or production.

### Concurrency checks

`pnpm exec tsx e2e/check-admin-concurrency.ts` runs eight test groups against localhost `ilmora_admin_qa`. It queues both operations behind the real advisory lock and tests both admission orders for competing imports, import versus manual edit, bank hide versus publication, and two bank hides. It also checks stale metadata, parallel removals, shared-bank revision invalidation, stale/legacy/wrong-try-out offline exports after reloading, and a 500-row import with another save queued. It leaves QA fixtures for inspection.

The CI workflow runs these database checks and all browser tests after a production build, using disposable PostgreSQL and two Admin sessions, with one worker so a failure is easy to attribute. A passing local run does not prove CI or staging behavior. Stale exports require a fresh download. Purchase/grant versus hide remains open in `docs/ADMIN_QA_REPORT.md`.

```sh
pnpm exec tsx e2e/check-admin-content.ts
pnpm exec tsx e2e/check-admin-concurrency.ts
```

Run the database checks with the same `DATABASE_URL` the local run used (`ilmora_admin_qa`). The browser suite needs the saved sessions for its origin.

# Playwright regression checks

These checks target staging by default. They cover login protection, Admin Student search and filters, Insights, weekly Leaderboard monitoring, overdue Checkout display, profile join date, and the free Evaluation breakdown. The tests do not create a payment or change an account. Opening Admin Payments can expire already overdue Checkouts and release their Coupon reservations, as the page normally does.

## First run

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test:e2e:smoke
```

The smoke command needs no account. To run the authenticated checks, capture a session for an Admin and a free Student with completed Attempts:

```bash
pnpm test:e2e:auth admin
pnpm test:e2e:auth free-student
pnpm test:e2e:full
```

Each capture command opens a browser. Complete Google sign-in there, then press Enter in the terminal. The helper verifies that the account reached the intended page before saving its browser state. Session files are stored in ignored `e2e/.auth/` files and contain login cookies. Keep them private and recapture them when they expire. The free Student must have a category breakdown so the locked state can be checked.

`pnpm test:e2e` runs every available check and reports authenticated checks as skipped if their session file is missing. `pnpm test:e2e:full` requires both files and fails early with a capture reminder if either is absent.

Set `E2E_BASE_URL` to test a local server or another staging deployment. Capture fresh sessions for that origin. If Playwright's Chromium is unavailable but a compatible Chromium is installed locally, set `E2E_CHROMIUM_EXECUTABLE_PATH` to its executable path.

Playwright writes failure screenshots and traces to the ignored `test-results/` directory. Run `pnpm exec playwright show-report` to inspect the HTML report.

## Admin content checks on a local database

`admin-content.spec.ts` creates try-outs and questions and imports spreadsheets. It runs only when `E2E_BASE_URL` is localhost or 127.0.0.1 and a local Admin session exists. It is skipped on staging. It covers manual creation, answer/pembahasan persistence, invalid answers and order, publication guards, cancel/removal, Excel preview and repeated upload, export, the formatted template, and mobile navigation.

Use a dedicated local PostgreSQL database. Run migrations and seed with its `DATABASE_URL`, start the local app, and run `E2E_BASE_URL=http://localhost:<port> node --import tsx e2e/prepare-local.ts` once. Add `e2e-admin@example.test` to the local `admin_members` table. The existing Monitoring check needs a `super_admin` account. Keep `e2e/.auth` private.

```sh
E2E_BASE_URL=http://localhost:<port> pnpm test:e2e admin-content.spec.ts
node --import tsx e2e/check-admin-content.ts
```

The second command refuses any database other than a local database named `ilmora_admin_qa`. It checks shared-question image preservation, import rollback, the last-question guard, and lifetime-owner protection. Both commands leave QA fixtures in the dedicated database for inspection. Use a fresh local database for the next run. Never point fixture setup at staging or production.

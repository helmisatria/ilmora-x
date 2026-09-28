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

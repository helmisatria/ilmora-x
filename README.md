# IlmoraX

IlmoraX is a web-based pharmacy exam prep platform. Students take timed Try-outs, review Attempts, track Student Evaluation, and compete on the weekly Leaderboard. Admins manage content, Students, Poll Sessions, reports, and operational monitoring.

For current milestone status and open work, see [Milestone closeout](docs/MILESTONE_CLOSEOUT.md). Phase 0 is finished. Midtrans is the MVP payment provider, and referral discounts are deferred. The dated proposals and older checklists remain as records of the scope at the time they were written.

## Commands

```sh
pnpm install
pnpm dev
pnpm test -- --test-reporter=spec
pnpm exec tsc --noEmit
pnpm build
```

The Vite dev server uses port `8090`.

## Midtrans payments

Paid Checkouts use Midtrans Snap hosted checkout. Configure these server-side variables:

```sh
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_TRANSACTION_DURATION_SECONDS=86400
APP_URL="https://your-public-app.example"
```

Each Snap transaction sends `X-Override-Notification: <APP_URL>/api/midtrans/webhook`, so Midtrans notifies the environment that created the payment. Staging and production can share one sandbox account, and a wrong `APP_URL` means payments never confirm. Still set the dashboard Payment Notification URL to the production webhook as a fallback:

```text
https://your-public-app.example/api/midtrans/webhook
```

Set the Snap redirection URLs to:

```text
Finish Redirect URL: https://your-public-app.example/payment/finish
Error Payment URL:  https://your-public-app.example/payment/error
```

Use sandbox credentials with `MIDTRANS_IS_PRODUCTION=false`. Switch it to `true` only with a production Server Key and production dashboard configuration.

Before launch: production currently runs on the sandbox key, so test cards can buy Premium. Swap in the production Server Key and set `MIDTRANS_IS_PRODUCTION=true` on the production Railway service.

## Jobs

| Command | What it does | When to run |
| --- | --- | --- |
| `pnpm jobs:finalise-weekly-leaderboard [-- --week YYYY-MM-DD]` | Finalizes the previous week (or the given week) and awards missing Top-N Badges. Safe to rerun. | Runs on Railway as the `leaderboard-cron` service, Mondays 00:05 WIB (`5 17 * * 0` UTC). Run by hand only to repair a missed week. |
| `pnpm jobs:leaderboard` | Starts an always-on pg-boss worker that does the same weekly finalization. | Not deployed. Use it instead of the cron service only if you need a long-running worker. Do not run both. |
| `pnpm jobs:recompute-attempt-xp [-- --apply]` | Recalculates stored Attempt EXP with the current formula. Without `--apply` it only prints what would change. Badges, Badge reward EXP, and finalized weeks are kept. | Once, after an EXP formula change. Run the dry run first. |

Railway has a `leaderboard-cron` service in both environments: production builds from `main`, staging from `dev`. It needs only `DATABASE_URL` (a reference to the Postgres service). The web service does not start any background jobs.

EXP, Level, Badge, and Leaderboard rules are in `CONTEXT.md` (Engagement surface terms and the Rules section).

## Code Map

- `src/routes/`: TanStack file routes only. Keep route files focused on `createFileRoute`, loader/head setup, and rendering feature views.
- `src/features/admin/`: Admin CMS home/pages, Admin access middleware, Admin User management, Admin report queue, Admin Taxonomy, Admin content counts, insights, and monitoring.
- `src/features/auth/`: Login and profile-completion page Implementations.
- `src/features/identity/`: Viewer-adjacent domain rules: Admin membership, Student profile completion, active Student checks, and Attempt ownership checks.
- `src/features/student/`: Student viewer access, Progress page, and Student progress summary functions.
- `src/features/tryout-attempt/`: Attempt lifecycle, Attempt autosave queue, daily Attempt windows, Try-out preparation/start/save/submit functions, question reporting, and Try-out taking support.
- `src/features/tryout-content/`: Try-out catalog and Admin Try-out pages. Student catalog reads live in `student-tryout-catalog-functions.ts`, Admin Try-out operations live in `admin-tryout-functions.ts`, Admin Question operations live in `admin-question-functions.ts`, workbook file parsing lives in `tryout-workbook.ts`, workbook sheet generation/export lives in `tryout-workbook-sheets.ts`, workbook taxonomy resolution lives in `tryout-workbook-taxonomy.ts`, copy-on-edit value rules live in `tryout-question-content-values.ts`, and mutation orchestration lives in `tryout-content-management.ts`.
- `src/features/tryout-results/`: Attempt result/review page Implementations and Attempt result read functions.
- `src/features/profile/`: Student profile page, public profile page, and public Student profile read functions.
- `src/features/student-evaluation/`: Student Evaluation page, read model, and pure summary builder.
- `src/features/poll-session/`: Poll Session operation. Admin mutations live in `poll-admin-functions.ts`, Student join/answer flow lives in `poll-student-functions.ts`, shared record loading/live invalidation lives in `poll-session-records.ts`, and pure projections live in `poll-session.ts`.
- `src/features/leaderboard/`: Weekly Leaderboard ranking, finalization, Student Leaderboard read functions, and Leaderboard view models.
- `src/features/engagement-surface/`: Level table (`level-catalog.ts`), Badge catalog and permanent EXP bonus (`badge-catalog.ts`), pure Badge eligibility and Streak rules (`engagement-surface-model.ts`), and Badge awarding (`engagement-surface.ts`). Attempt EXP is calculated in `src/features/tryout-attempt/attempt-xp.ts`.
- `src/features/premium-access/`: Premium Membership, Lifetime Try-out Purchase access rules, product catalog, and Coupon data.
- `src/features/media/`: Media asset URL, S3 storage, Admin media read functions/page/uploads, and Question picture storage support.
- `src/features/landing/`: Landing page Implementation, static landing content, icons, and link analytics.
- `src/features/dashboard/`, `src/features/coming-soon/`: page Implementations and view models for route shells.
- `src/lib/`: cross-cutting infrastructure only: auth transport, db, http errors/validation, analytics transport, observability, and route protection.
- `src/data/`: app provider state plus seed/demo data used by database seeding. Do not add feature rules here.
- `CONTEXT.md`: domain language and rules. Use its terms in code and docs.
- `docs/adr/`: durable architecture decisions.

## Placement Rules

- Put feature behavior behind a feature Module with a small Interface and readable Implementation.
- Keep broad `src/lib/*` files as infrastructure, not feature homes.
- If a route grows route-local parsing, formatting, or workbook logic, move that support code into the matching `src/features/*` folder.
- Preserve existing server function names and return shapes unless a behavior-changing PR explicitly says otherwise.
- Use easy-to-scan code: early returns, explicit names, no clever one-liners, and focused tests around Module Interfaces.

## Architecture References

- `CONTEXT.md` defines Try-out, Attempt, Student Evaluation, Engagement surface, Poll Session, Premium access, and Admin language.
- `docs/adr/0001-use-lifetime-purchase-instead-of-platinum-tryout-tier.md`
- `docs/adr/0002-finalize-weekly-leaderboards-for-top-n-badges.md`
- `docs/adr/0003-use-server-sent-events-for-poll-session-live-updates.md`
- `docs/adr/0004-organize-code-by-domain-feature-folders.md`
- `docs/adr/0005-migrate-taxonomy-to-topic-level.md`

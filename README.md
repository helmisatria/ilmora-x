# IlmoraX

IlmoraX is a web-based pharmacy exam prep platform. Students take timed Try-outs, review Attempts, track Student Evaluation, and compete on the weekly Leaderboard. Admins manage content, Students, Poll Sessions, reports, and operational monitoring.

## Commands

```sh
pnpm install
pnpm dev
pnpm test -- --test-reporter=spec
pnpm exec tsc --noEmit
pnpm build
```

The Vite dev server uses port `8090`.

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
- `src/features/engagement-surface/`: EXP, Level, Badge, Streak, and reward catalog rules.
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

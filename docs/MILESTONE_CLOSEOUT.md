# Milestone closeout

Updated 2026-09-28 against `origin/dev` at `5216eae`.

This is a code and document review, not staging acceptance or proof of a production deployment. The dated proposals record the original agreement. `CONTEXT.md` records later product rules. Helmi confirmed that Phase 0 is finished, Midtrans is the MVP payment provider, and referral discounts are deferred. Do not count those three items as open work.

The five plans in `plans/README.md` are done. They cover Admin payment workflows and navigation, not the full proposal.

Open action items are tracked on the [Ilmora X Trello board](https://trello.com/b/iL0ArxLw/ilmora-x).

## What exists

| Milestone | Confirmed in the code | Still open |
| --- | --- | --- |
| Phase 0 | Owner confirmed completion. | No Phase 0 implementation item is tracked here. |
| M1 | Google login and profile completion, Admin taxonomy and Try-out management, workbook import, timed Attempts, save and resume, results, reports, progress, and basic Insights. | Admin Student search and filters, paid-access revocation, several proposed Insights measures, and a clear suspended-account state. Standalone Materi CMS was moved out of M1 in `CONTEXT.md`. |
| M2 | Midtrans Snap checkout, signed notification handling, Products, Coupons, discount calculation, redemption limits, and Entitlements. | Server-side premium Evaluation access, the proposed emails, and standalone Materi management and access if it remains in project scope. |
| M3 | A 50-level catalog, 26 in-scope Badges, award records, current-week Leaderboard, weekly finalization code, Poll Sessions, public profiles, and Coming Soon links. | Level names and EXP thresholds do not match the supplied reference, plus permanent EXP bonuses, Admin Badge and Leaderboard controls, finalized-week history, accurate earned-Badge display, and one-time return-session Badge celebration. |

## To do

### M1

- [ ] Add Admin Student search and filters for name, email, status, and premium access. The current list renders all Students without search or filters. See `src/features/admin/admin-users-page.tsx`.
- [ ] Let Admin revoke a Student's paid access, as specified in the Phase 0 PRD. Manual grants exist, but the Admin workflow has no revoke action.
- [ ] Complete the proposed Users Insights. Add new users, premium and free users, activity in a stated time window, question activity, category performance, and recent activity. The current `activeStudents` count means accounts with active status, not Students active in a period. See `src/features/admin/admin-content-counts.ts` and the updated proposal's Users Insights section.
- [ ] Give suspended Students a clear blocked page or message. `src/lib/route-protection.ts` currently sends them to login.
- [ ] Prevent repeated submissions of the same Question report from creating duplicate moderation rows and activity events. `reportAttemptQuestion` inserts a new row on every request, and the old M1 checklist still marks this guard open.
- [ ] Record staging acceptance for first Google login, profile completion, Admin login, suspended access, an interrupted Attempt, result review, and workbook import. A working route in the repository is not a completed end-to-end check.

### M2

- [ ] Check Premium Membership on the server before returning premium Evaluation detail. `listProgressSummary` currently returns category detail and Attempt history to any authenticated Student, then the page hides parts of it in the browser. See `src/features/student/student-progress-functions.ts` and `CONTEXT.md` under Premium access.
- [ ] Add the emails still listed in the updated proposal: welcome or registration, payment success and purchase confirmation, and Question report acknowledgment. No mail delivery implementation was found in the current source or package dependencies. Confirm the sender and templates before staging acceptance.
- [ ] Settle standalone Materi scope. `CONTEXT.md` defers its CMS out of M1 but does not remove it from the project. The Admin Materi page is a placeholder. If Materi remains in scope, implement Admin create, edit, upload, publish and archive, Student access checks, and the Question Review backlink. If it is deferred beyond M3, record that decision in `CONTEXT.md` and the proposal addendum. Paid Materi purchases are already out of MVP scope.
- [ ] Test Midtrans sandbox checkout and notification handling in staging with full-price, discounted, zero-total, expired, cancelled, duplicate-notification, and amount-mismatch cases. Confirm the dashboard URLs and server variables without recording secrets in the repository.

### M3

- [ ] Match all 50 level names and EXP thresholds to `docs/IlmoraX - Experience level.ods`. The code uses 96,000 EXP for level 50; the supplied reference uses 42,280 EXP. Recheck every boundary and update tests.
- [ ] Apply the highest earned level-Badge permanent EXP bonus to future Attempt EXP only. The reference and `CONTEXT.md` require a 5% to 40% bonus for BADGE-004 through BADGE-011. `calculateAttemptXp` currently applies only the first-Attempt or retake rate.
- [ ] Add Admin Badge and Leaderboard management. The proposal includes basic Badge rule management and Leaderboard CMS. `src/features/admin/admin-shell.tsx` has no such pages. The weekly participant threshold is an environment variable, and past-week repair is a command-line script. Define which Badge fields Admins may edit without changing historical awards.
- [ ] Show finalized previous weeks to Students and Admins, including rank and Badge outcomes. The current `listLeaderboard` function only reads the live week. Show a finalizing state until a closed week has a snapshot.
- [ ] Use awarded Badge records as the source of truth for unlocked state. The Badge collection and public profile also infer unlocked Badges from progress. Their "unique Try-outs" display counts Attempts, so retakes can show an unearned Badge.
- [ ] Show a newly awarded Badge once when a Student returns after an offline or scheduled award. `student_badges.seen_at` exists, but no return-session acknowledgment flow was found.
- [ ] Verify the weekly finalization worker and a real Poll Session in staging. The schedule is implemented, but `ENABLE_PG_BOSS_JOBS` defaults to `false` in `.env.example`; repository checks cannot prove a worker is running.

### Release and document checks

- [ ] After the implementation items pass review, run the relevant automated checks and a staging demo, then record acceptance for M1, M2, and M3. Do not treat local tests as staging or payment-provider proof.
- [ ] Promote the accepted `dev` revision to `main` through the normal review process. At this audit, `origin/main` was behind `origin/dev`.

Referral discounts remain deferred. Paid Materi purchases remain out of MVP scope. The historical M1 checklist and completed payment plans retain their original checkboxes and examples; use this page for the current closeout list.

## Validation on 2026-09-24

- `pnpm exec tsc --noEmit` passed.
- `pnpm test -- --test-reporter=spec` passed, 48 tests.
- `pnpm build` passed. The local Node version was 24.13.0 while the project requests 26.7.0; Vite also warned about Node modules externalized for browser compatibility.
- Relative file links in the updated Markdown files resolved, and `git diff --check` passed.

These are local checks. They do not establish CI status, staging acceptance, Midtrans delivery, or a running weekly worker.

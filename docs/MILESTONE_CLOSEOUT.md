# Milestone closeout

Updated 2026-09-28 against `origin/dev` at `769a6eb`.

This combines a code and document review with focused staging checks listed below. It is not full milestone acceptance or proof of a production deployment. The dated proposals record the original agreement. `CONTEXT.md` records later product rules. Helmi confirmed that Phase 0 is finished, Midtrans is the MVP payment provider, and referral discounts are deferred. Do not count those three items as open work.

The five plans in `plans/README.md` are done. They cover Admin payment workflows and navigation, not the full proposal.

Open action items are tracked on the [Ilmora X Trello board](https://trello.com/b/iL0ArxLw/ilmora-x).

## What exists

| Milestone | Confirmed in the code | Still open |
| --- | --- | --- |
| Phase 0 | Owner confirmed completion. | No Phase 0 implementation item is tracked here. |
| M1 | Google login and profile completion, Admin taxonomy and Try-out management, workbook import, timed Attempts, save and resume, results, reports, progress, Student search and filters, and proposed basic Users Insights. | Paid-access revocation, a clear suspended-account state, duplicate Question report protection, and full end-to-end acceptance. Standalone Materi CMS was moved out of M1 in `CONTEXT.md`. |
| M2 | Midtrans Snap checkout, signed notification handling, Products, Coupons, discount calculation, redemption limits, and Entitlements. | Server-side premium Evaluation access, the proposed emails, and standalone Materi management and access if it remains in project scope. |
| M3 | A 50-level catalog, 26 in-scope Badges, award records, current-week Leaderboard, weekly finalization code, Poll Sessions, public profiles, and Coming Soon links. | Level names and EXP thresholds do not match the supplied reference, plus permanent EXP bonuses, Admin Badge and Leaderboard controls, finalized-week history, accurate earned-Badge display, and one-time return-session Badge celebration. |

## To do

### M1

- [x] Add Admin Student search and filters for name, email, status, and premium access. Verified search and premium filtering on staging after `769a6eb` deployed.
- [ ] Let Admin revoke a Student's paid access, as specified in the Phase 0 PRD. Manual grants exist, but the Admin workflow has no revoke action.
- [x] Complete the proposed Users Insights. Staging shows new, premium, free, and active Students; Attempts and answered Questions in a stated 30-day window; category performance; and recent activity after `769a6eb` deployed.
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
- [ ] Verify a scheduled weekly finalization run and a real Poll Session in staging. Railway has a separate `leaderboard-cron` service scheduled for Monday 00:05 WIB. A previous-week snapshot exists, but the scheduled trigger has not been confirmed from run logs. Optional pg-boss queues are not used for this cron.

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

## Focused staging checks on 2026-09-28

- Railway deployed `769a6eb` to staging. Admin Users search and Premium filtering worked; Insights displayed the added 30-day metrics and activity.
- Admin Payments changed four overdue Pending checkouts to Expired. The staging database then had zero Pending checkouts and zero reserved Coupon redemptions. This does not replace a full Midtrans sandbox acceptance pass.
- Admin Monitoring showed the previous-week Leaderboard snapshot for `2026-09-21`. The Railway cron schedule is configured, but its scheduled trigger remains unverified.
- The Student profile showed the account's actual 22 August 2026 join date and no development Premium switch. The refreshed free Evaluation page showed only the unlock action, with no placeholder Sub-category scores.

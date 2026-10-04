# Admin try-out QA, 4 October 2026

This report records local branch reconciliation, browser regression, the requested admin-content concurrency cases, and the UI follow-ups. The continuation includes the original work from draft PR #29. Release checks below still apply; local results do not establish deployment or staging acceptance.

## Local continuation results

- Merged remote `dev` at `0483785` into the PR branch without conflicts. The local merge commit is `f6d0407`.
- Created a fresh disposable `ilmora_admin_qa` database on localhost port 55437. Applied all 19 migrations and the seed. The earlier QA database on port 55436 was unchanged.
- Tested the reconciled production build at `http://127.0.0.1:8197`. No staging or production data was read or changed.
- Used two separate local Admin accounts and browser contexts. Focused checks used ordinary Admin permissions. The full regression used a local Super Admin for Monitoring and an ordinary second Admin, then restored the first account to Admin.
- Local Node was 26.5.0, with pnpm 11.21.0 and existing dependencies. The declared Node 26.7.0 and a fresh frozen-lockfile install still require CI verification.

| Check | Current result |
| --- | --- |
| Unit tests | 117 passed, no failures or skips. Includes latest dev coverage. |
| Full production browser suite | 18 passed, no failures or skips, in 57.1 seconds. |
| Two-admin browser checks | Five two-account checks passed. Stale metadata, try-out question, bank question, and Excel preview show the conflict message and retain unsaved input or preview. Old offline and legacy exports are blocked after reload; a fresh export saves its key, explanation, and image link. |
| Content database checks | All 4 passed again. Shared-question image preservation, rollback, last-question protection, and existing lifetime-owner protection. |
| Concurrency database checks | All 8 groups passed. Competing imports, import versus manual edit, bank hide versus publish, and two bank hides tested both write orders. Also checked stale metadata, parallel removals, shared-bank revision invalidation, and server rejection of offline stale/legacy/wrong-try-out replacements with a fresh page revision. |
| Large import contention | 500-row import plus a queued save completed in 453 ms on the local database. Both writes committed. This single run does not establish production capacity. |
| Production build and TypeScript | Passed. |
| Diff check | Passed. |

The database concurrency checks hold the actual content lock until both writers queue. They assert conflict responses, whole-workbook rollback, final published counts, and key, pembahasan, and image persistence. They do not rely on timing alone to make operations overlap.

The CI workflow now builds production, runs unit and database checks, prepares two local Admin sessions, and runs the browser suite on that production build. It uses the disposable database name required by the database-check guards. These workflow edits have not run in GitHub Actions.

Chromium first failed to launch inside the local sandbox. An approved run outside the sandbox launched successfully. New test fixtures initially used the wrong Excel confirmation label and an empty workbook that did not satisfy the required question-row rule. Correcting those fixtures produced the final passing full run. Neither failed run is counted as a pass.

The export-revision follow-up adds two unit checks and one database group. Downloads from the detail page now fetch a current, consistent content snapshot before creating the file. The static sample remains unchanged.

The changes and evidence below describe the earlier implementation. Its original counts and environment are historical. This continuation has not pushed its merge commit or local edits, merged PR #29, or deployed anything.

## Local UI and badge-access follow-up

- Insights now groups recent learning activity separately from lifetime learning results and content totals. Category accuracy uses comparison bars with answer counts; average score includes its completed-attempt count. Open reports link to review, and zero-attempt try-outs are omitted from participation results.
- Shared panel headers now keep a 12 px gap between headings and actions on phones, with actions beside headings on wider screens. Admin textareas have vertical padding for placeholder and entered text.
- Per the requested permission changes, both Badge and Leaderboard settings reads and saves now accept ordinary Admins. Student access remains blocked. Monitoring permissions are unchanged.
- The final production build and TypeScript passed. All three focused browser regressions passed: ordinary Admin badge editing and persistence with Student save rejection, Insights grouping and report navigation, and phone layout without page overflow. Desktop and phone screenshots and Announcement header spacing were checked locally.
- The badge test restored the original badge name after saving. The existing full-suite results above predate this UI follow-up. These changes remain local and have not run in CI or been deployed.
- The subsequent Leaderboard production build and TypeScript passed. Its ordinary Admin browser regression passed for opening, saving, reload persistence, fallback reset, and Student save rejection; the original threshold was restored. The first run found an ambiguous test locator that matched both the active threshold and change history. Narrowing it to the settings panel produced the passing run.
- Monitoring now renders an access-restriction card for ordinary Admins instead of throwing a page-load error. Its server functions still require Super Admin. The document, stylesheet links, and scripts now live in the root route shell so root error pages keep their styling; fallback SVGs also have explicit dimensions.
- The landing-page learning steps now use matching 28 px clock, book, and target icons. Other placements retain their existing default sizes. Desktop and phone screenshots were checked.
- The final production build and TypeScript passed, followed by all six focused browser checks: desktop and phone Monitoring restrictions with return navigation, restriction styling before JavaScript, root error styling and recovery, health/login, and signed-out redirects. A direct server-rendered check with `e2e-admin@example.test` returned the styled restriction with a 24 px lock icon. Both local Admin accounts remain ordinary Admins. The first test run incorrectly assumed a 12 px theme radius; the corrected assertion verifies that card styling is present without fixing the theme radius.

## Scope and environment

- Base commit `105629d`, from the local `dev` branch. Changes are isolated on `codex/admin-readiness`.
- Separate PostgreSQL database `ilmora_admin_qa` on localhost port 55436. No staging or production data was read or changed.
- Development app on port 8196. Production build tested on port 8197.
- Focused content checks used an ordinary Admin account. The existing regression suite temporarily used a local Super Admin for Monitoring, then restored the ordinary Admin role.
- Node 26.5.0 is installed. The package declares Node 26.7.0. No new software was installed. Checks used the existing dependency binaries directly because the pnpm wrapper requested reinstalling dependencies.
- The requested local unslop skill guided Indonesian copy. The spreadsheet skill was used to edit and visually verify the static Excel template.

## Fixed issues

| Previous behavior | Current behavior | Evidence |
| --- | --- | --- |
| Empty try-outs required Excel to add a question. | Tambah soal creates a question directly in the try-out, including its key, pembahasan, media links, access, and status. | Production browser manual flow passed. |
| The question bank could hide the last published question of a published try-out. | The server rejects that action and tells the admin which try-out needs another published question. | Production browser bank guard passed. |
| A failed upload could leave an earlier Excel preview ready to import. | Each accepted upload clears the earlier preview before reading the file. | Malformed file, cancel, correction, and repeated-upload browser checks passed. |
| Excel did not carry picture_url. Creating a copy of an edited shared question could lose its picture. | Export/import carries picture_url. Old workbooks without the column retain an existing image. | Workbook round trip and shared-question database checks passed. |
| Zero sort_order silently became a valid question order. | Invalid or duplicate orders produce a row-specific message. Manual duplicate order has a clear server error. | Unit and production browser checks passed. |
| Extra try-out rows were silently ignored. | The preview rejects files with more than one try-out row. | Unit check passed. |
| Some limits and publication errors appeared only after confirmation. | Preview checks the 500-question limit, title/description lengths, media URLs, and published try-outs without published questions. | Workbook unit checks passed. |
| Labels and Excel guidance assumed technical English. | Content pages use Indonesian labels and help. A formatted sample has a panduan tab, column guide, frozen headers, and key/access/status dropdowns. | Download, reimport, and visual workbook verification passed. |
| Forms accepted input before client handlers were ready. | Inputs wait for hydration and are disabled during a pending save. | Stable local production flows passed. |
| Question edits were hard to locate in large lists. | Search is available in the try-out list and Bank soal. Bank soal is in the sidebar. Try-out question rows show taxonomy names. | Browser search and visual review passed. |

The guide explains that Excel replaces the whole question list, that Keluarkan removes only a try-out assignment, and that changes through Bank soal affect every try-out using the question. It also distinguishes try-out access from paid pembahasan access.

## Initial verification

| Check | Result |
| --- | --- |
| Unit tests | 98 passed, 0 failed, 0 skipped. Includes 8 new workbook checks. |
| Focused admin content browser suite | 5 passed on the local production build, 0 skipped. |
| Existing public/admin/free-student browser suite | 8 passed on the local development app, 0 skipped. |
| Shared-question database checks | 4 passed. Image/content preservation, failed-import rollback, last-question guard, lifetime-owner guard. |
| Production build and TypeScript | Passed. |
| Static template | Reimported with 0 issues and 2 sample questions. The documentation copy and served copy are identical. Changed sheets were visually checked. |
| Whitespace/diff check | Passed. |
| Lint | Not run. The repository has no lint script or configured linter. |

The focused browser checks cover create/edit, required fields, key and pembahasan persistence after reload, draft/tayang states, empty try-outs, option E validation, duplicate order, cancel, safe removal, last-question safeguards, malformed Excel, correction/reupload, import/export, formatted sample download, mobile overflow, and back navigation.

Database checks also verify that a failed import leaves both the title and existing question assignments unchanged, and that editing a shared question through Excel creates a copy without changing the source explanation or image.

A development-only React Scan/router overlay intercepted the last-row button during one run. The same flow passed in the production build. The first production run used an incorrect local NODE_ENV setting and failed to render. Removing that QA-only setting and rebuilding with NODE_ENV=production resolved it. Neither was counted as a passing run.

Reproduction commands are in e2e/README.md. The local scripts leave test fixtures for inspection. Auth session files and environment secrets remain ignored and must not be committed.

## Before release

1. Run the release checks with the declared Node 26.7.0 runtime and a fresh lockfile-based dependency install in CI.
2. Verify Google sign-in, Admin membership, and session expiry in staging. Local checks used generated test accounts and saved local sessions.
3. Verify actual media upload/storage permissions, file limits, and video/image links in staging. Local QA verified link persistence and workbook handling, without uploading to an external storage service.
4. Review real question keys, pembahasan, access levels, statuses, and intended published question counts. Try-outs permit partially published question lists by the documented domain rule. Only published questions reach participants.
5. Review the remaining cross-workflow purchase/grant race and measure contention under representative deployment latency and admin load. The requested local admin-content concurrency cases passed, but they do not establish load capacity or payment-workflow safety.
6. Confirm database migrations, backups, monitoring, and a rollback plan for the target release. No deployment or migration against a live environment was performed.
7. README records a payment-provider launch prerequisite involving production credentials. That historical note needs live verification by the release owner. Payments and real purchases were outside this content QA.

The initial local QA did not push or publish a PR. The later handoff opened draft PR #29. This continuation has not pushed changes or performed a deployment or real account change.

## Draft PR handoff: concurrency follow-up

The local execution service disconnected during implementation and recovered when the draft PR was requested. The initial validated changes remain in commit `4d32862`; a separate follow-up commit contains the concurrency work.

A stale metadata edit was accepted before the fix and replaced Admin A's title with Admin B's older form. A local-only temporary delete trigger widened the removal timing window: both removals succeeded and left zero published questions. The trigger was removed after reproduction. Neither reproduction touched a live database.

The follow-up adds a shared transaction-scoped PostgreSQL advisory lock to admin content operations, checks the page's `updatedAt` value before writes, advances timestamps by at least one millisecond, and invalidates try-out revisions when a shared bank question changes. It keeps publication checks and writes within the same transaction and captures revision values when opening question editors and Excel previews. Admins receive an Indonesian message to copy any unsaved content, reload, and review the latest changes.

Follow-up checks recorded before this continuation:

- TypeScript, production build, and 98 unit tests passed after the API call sites were updated.
- Existing four database checks passed again.
- New regression script passed: stale metadata was rejected and only one of two parallel removals succeeded, leaving one published question.
- The earlier 13 browser checks passed on the initial commit. They have not been rerun after the concurrency changes.
- Static Excel style, instructions, dropdowns, and changed-sheet rendering were validated during the initial work; no workbook changes were made in the concurrency follow-up.

Original continuation checklist, with current status:

1. Complete locally. All 18 production-browser tests passed, including five two-account checks. Errors remain visible and unsaved input or preview remains available to copy.
2. Complete locally. All requested database races passed in both write orders, with rollback, published counts, and key/pembahasan/image assertions.
3. Implemented the owner decision to reject stale exports and require a fresh download. Exports now carry a hidden source try-out ID and revision. Replacements reject stale revisions, files from another try-out, and legacy files without source metadata. The preview checks these conditions and the server checks again under the content lock, independently of the current page revision. The sample still creates new try-outs. A fresh export can replace existing content. The source revision is a conflict check for trusted Admins, not a cryptographic proof of file origin.
4. Local contention check complete. The 500-row import and queued save completed in 453 ms. All admin content writes still share one lock. Measure representative deployment latency and multiple concurrent admins before claiming capacity.
5. Source review confirms a remaining race. `grantEntitlementForPaidCheckout` and `createAdminGrant` in `payment-service.ts` insert entitlements without taking the content lock. A purchase or grant can therefore commit after the hide transaction checks for lifetime owners. A hidden try-out may then have a lifetime owner. Local admin-content results do not resolve this policy or prove live impact. Decide whether both workflows must share a lock or whether hidden content remains accessible to owners, then test that policy separately.
6. Complete locally. Merged remote `dev` at `0483785` into the PR branch. The merge commit and new QA changes have not been pushed.

For staging approval, provide the exact staging URL/environment, two designated test admin accounts, disposable content IDs, and the storage bucket/prefix where test uploads and cleanup are allowed. Do not use customer accounts or production data. No external staging write was performed.

Before deployment, the release owner should record the application commit and database migration version, create a provider snapshot plus a protected logical database backup, and restore that backup into a separate disposable database to confirm it opens. Retain the previous application release and compatible schema. If rollback is required, decide whether an application-only rollback is sufficient; a database restore requires explicit approval and a plan for writes received after the backup. No production backup, restore, migration, or deployment was executed here.

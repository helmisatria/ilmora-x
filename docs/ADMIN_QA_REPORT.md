# Admin try-out QA, 4 October 2026

The content flows work in the isolated local production build. This is a local release candidate, with staging integration and release checks still required.

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

## Verification

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
5. Check simultaneous multi-admin edits and imports before broad admin rollout. Existing replacements have no revision check, and some publication checks and writes are separate operations. This QA does not establish concurrency safety or load capacity.
6. Confirm database migrations, backups, monitoring, and a rollback plan for the target release. No deployment or migration against a live environment was performed.
7. README records a payment-provider launch prerequisite involving production credentials. That historical note needs live verification by the release owner. Payments and real purchases were outside this content QA.

No branch was pushed, no PR was published, and no deployment or real account change was performed.

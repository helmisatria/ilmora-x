# Organize Code by Domain Feature Folders

IlmoraX code is organized by domain feature folders under `src/features/*`, while `src/routes/*` stays as the TanStack file-route layer and `src/lib/*` stays as cross-cutting infrastructure.

We chose this because new joiners need to quickly find which code supports Student, Admin, Dashboard, Try-out, Poll Session, Leaderboard, Student Evaluation, Premium access, and the Engagement surface. Broad files such as `admin-functions.ts`, `student-functions.ts`, and `poll-functions.ts` made the first scan easy by audience but hard by feature. Domain feature folders give stronger locality: the Module Interface, Implementation, and tests for a feature sit together.

Existing route paths, server function names, return shapes, database schema, and user-visible behavior are preserved. Avoid adding pass-through compatibility Adapters: new feature work should import from the owning `src/features/*` Module directly.

When one feature folder has multiple audiences, split by domain use rather than by framework primitive. For example, Poll Session keeps Admin operation, Student participation, shared record loading, live invalidation, and pure projections in separate Modules inside `src/features/poll-session/`.

Avoid broad audience catch-alls such as `admin/server-functions.ts` and `student/server-functions.ts`. Put server functions beside the feature they support: Try-out catalog reads in Try-out Content, Attempt commands in Try-out Attempt, Attempt result reads in Try-out Results, public profile reads in Profile, Leaderboard reads in Leaderboard, and Admin media reads in Media.

When one feature folder has a large workflow, split the stable sub-rules into named Modules. For example, Try-out Content keeps workbook parsing, workbook sheet generation/export, workbook taxonomy resolution, Question copy-on-edit values, and mutation orchestration separate so a new joiner can find the rule they need without reading the full import path.

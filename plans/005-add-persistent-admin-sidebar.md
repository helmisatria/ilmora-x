# Plan 005: Add a Persistent Admin Sidebar Shell

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4f9a420..HEAD -- src/features/admin/admin-home-page.tsx src/routes/admin.tsx src/styles/app.css src/components/ui package.json pnpm-lock.yaml`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding. On mismatch, stop and report.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/004-improve-checkout-entitlement-support-workflows.md`
- **Category**: direction
- **Planned at**: commit `4f9a420`, 2026-06-15

## Why this matters

Admin has grown past a landing-card navigation model. Users, Try-outs, Payments, Media, Categories, Polls, Reports, Insights, and Monitoring are separate workflows, but subpages still rely on back links and the `/admin` hub. A persistent sidebar makes admin navigation predictable and keeps Products, Coupons, Grants, and Checkout repair easier to reach while working.

## Current state

- `src/features/admin/admin-home-page.tsx` owns `adminSections` and returns `<Outlet />` when the route is not exactly `/admin`.
- `src/routes/admin.tsx` renders `AdminHomePage` as the `/admin` route component.
- Every admin feature page renders its own `<main className="admin-shell page-enter">`.
- `src/styles/app.css` defines shared admin shell, lane, panel, button, and row classes.
- There is no `components.json` for shadcn CLI.
- `src/components/ui/dialog.tsx` already follows a shadcn-like copied component model.

Relevant excerpts:

```tsx
// src/features/admin/admin-home-page.tsx:3
const adminSections = [
  { label: "Users", to: "/admin/users", description: "Student accounts, status, and profile details.", icon: UsersIcon },
  { label: "Try-outs", to: "/admin/tryouts", description: "Assessment setup, publishing, and question assignment.", icon: BookIcon },
  { label: "Payments", to: "/admin/payments", description: "Products, Coupons, manual grants, and checkout repair.", icon: PaymentIcon },
  // ...
] as const;

// src/features/admin/admin-home-page.tsx:18
if (location.pathname !== "/admin") {
  return <Outlet />;
}

// src/features/admin/admin-home-page.tsx:23
<main className="admin-shell page-enter">
  <div className="admin-lane-narrow">
    // admin card hub
  </div>
</main>

// src/styles/app.css:300
.admin-shell {
  @apply min-h-screen px-5 py-7 text-stone-900 sm:px-6 lg:px-8;
  background:
    radial-gradient(900px 300px at 10% -14%, rgba(32, 80, 114, 0.13), transparent 64%),
    radial-gradient(760px 300px at 92% -10%, rgba(245, 158, 11, 0.1), transparent 68%),
    linear-gradient(180deg, #f4f8f7 0%, #fbfaf7 42%, #fafaf9 100%);
}
```

Current dependency facts:

- `@radix-ui/react-dialog` is installed.
- `@radix-ui/react-tooltip`, `@radix-ui/react-separator`, and `@radix-ui/react-icons` are not installed unless earlier plans added icons.
- shadcn Sidebar docs recommend `npx shadcn@latest add sidebar` and the generated component depends on button, separator, sheet, and tooltip registry components.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Add shadcn config if absent | create `components.json` manually | file matches Tailwind v4 and `~/` aliases |
| Add shadcn Sidebar | `pnpm dlx shadcn@latest add sidebar button separator sheet tooltip` | files added under `src/components/ui` |
| Add icons if absent | `pnpm add @radix-ui/react-icons` | dependency added |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no TypeScript errors |
| Tests | `pnpm test -- --test-reporter=spec` | all tests pass |

## Suggested executor toolkit

- Use the shadcn Sidebar as source code to customize, not as a black box.
- Keep the visual language aligned with `admin-shell`: stone surfaces, primary teal, restrained amber only as secondary support color.
- Use `@radix-ui/react-icons` or existing inline SVG icons. Do not use lucide unless the operator explicitly accepts that dependency.

## Scope

**In scope**:

- `components.json` (create if missing)
- `package.json`
- `pnpm-lock.yaml`
- `src/components/ui/sidebar.tsx` (generated/adapted)
- `src/components/ui/button.tsx` (generated/adapted if shadcn adds it)
- `src/components/ui/separator.tsx` (generated/adapted if shadcn adds it)
- `src/components/ui/sheet.tsx` (generated/adapted if shadcn adds it)
- `src/components/ui/tooltip.tsx` (generated/adapted if shadcn adds it)
- `src/features/admin/admin-home-page.tsx`
- `src/features/admin/admin-shell.tsx` (create)
- `src/styles/app.css`

**Out of scope**:

- Redesigning every admin page.
- Changing admin auth or permissions.
- Moving route files.
- Adding dark mode.

## Git workflow

- Branch: `advisor/005-admin-sidebar`
- Commit message: `feat: add admin sidebar shell`
- Do not push or open a PR unless asked.

## Steps

### Step 1: Add shadcn config for this Vite/Tailwind v4 repo

If `components.json` is missing, create it with this shape and adjust only if the shadcn CLI requires a newer schema:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/app.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/utils/cn",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "hooks": "~/hooks"
  },
  "iconLibrary": "radix"
}
```

If the CLI rejects `iconLibrary: "radix"`, remove that field and replace any generated lucide imports manually with `@radix-ui/react-icons` or existing inline SVGs.

**Verify**: `test -f components.json && pnpm exec tsc --noEmit` -> file exists and typecheck exits 0.

### Step 2: Generate Sidebar-related UI components

Run:

```sh
pnpm dlx shadcn@latest add sidebar button separator sheet tooltip
```

Review every generated file. The repo owns copied shadcn code, so simplify or restyle it to match existing conventions.

**Verify**: `test -f src/components/ui/sidebar.tsx` -> exits 0.

### Step 3: Create a shared AdminShell component

Create `src/features/admin/admin-shell.tsx`.

Responsibilities:

- owns the admin navigation item list
- renders sidebar on desktop
- renders a sheet/offcanvas sidebar on mobile
- highlights the active admin section based on `useLocation()`
- renders `Outlet` content in a main content area
- includes an `Open Student App` link

Move `adminSections` from `admin-home-page.tsx` into this file or a small local helper in the same feature folder.

Keep route labels from the current admin hub:

- Users
- Try-outs
- Payments
- Media
- Categories
- Polls
- Reports
- Insights
- Monitoring

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 4: Rewire `AdminHomePage`

Change `AdminHomePage` so it always renders `AdminShell`.

Inside the shell:

- when path is `/admin`, show the existing admin overview content, but simplify it because the sidebar now carries primary navigation
- when path is not `/admin`, render `<Outlet />`

Avoid double shells. Admin child pages currently render `<main className="admin-shell">`; do not wrap them in another full-page background. Either:

- make `AdminShell` own the background and gradually remove child page `<main className="admin-shell">` wrappers, or
- keep child wrappers for this plan and make the sidebar fixed outside them.

Prefer the first approach only if it stays scoped and easy to verify.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 5: Customize Sidebar visuals

Restyle the generated Sidebar classes to match the existing IlmoraX admin look:

- background: soft stone/clinic tone, not default gray-only shadcn
- active item: primary tint with primary-dark text
- radius: use existing `--radius-md` or `--radius-lg`
- no purple, no neon, no emoji
- compact enough for admin work

Keep animations transform/opacity based. Do not animate width manually outside the generated shadcn pattern.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 6: Manual browser QA

Run or use the existing dev server if already running.

Check:

- `/admin`
- `/admin/payments`
- `/admin/users`
- a mobile viewport around 390px wide
- desktop viewport around 1440px wide

Expected:

- sidebar visible on desktop
- mobile menu opens and closes
- active route is highlighted
- content does not overlap sidebar
- no horizontal overflow on mobile

**Verify**: `pnpm exec tsc --noEmit && pnpm test -- --test-reporter=spec` -> both exit 0.

## Test plan

- No automated DOM test framework exists for this repo at plan time.
- Run typecheck and full test suite.
- Perform manual browser QA for desktop and mobile admin routes.

## Done criteria

- [ ] Admin has a persistent sidebar navigation.
- [ ] `/admin/payments` is reachable through the sidebar and active state works.
- [ ] Mobile admin navigation works through a sheet/offcanvas pattern.
- [ ] shadcn-generated components are customized to match existing admin tokens.
- [ ] No admin page content overlaps or gets hidden under the sidebar.
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm test -- --test-reporter=spec` exits 0.
- [ ] `plans/README.md` status row for plan 005 is updated.

## STOP conditions

Stop and report if:

- shadcn CLI cannot initialize cleanly with this Tailwind v4/Vite setup.
- Generated components introduce many unrelated design tokens that conflict with `src/styles/app.css`.
- Rewiring AdminShell requires editing more than three admin feature pages directly.
- The mobile sidebar cannot work without broad route/layout changes.

## Maintenance notes

The sidebar should become the only source of admin navigation. After it lands, avoid adding new admin links in one-off page headers. Add them to `AdminShell` navigation so the whole admin area remains discoverable.

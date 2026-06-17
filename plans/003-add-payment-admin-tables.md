# Plan 003: Replace Product and Coupon Rows with Admin Tables

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4f9a420..HEAD -- src/features/premium-access/admin-payments-page.tsx package.json pnpm-lock.yaml`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding. On mismatch, stop and report.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-add-coupon-usage-summaries.md`, `plans/002-move-payment-create-edit-into-dialogs.md`
- **Category**: direction
- **Planned at**: commit `4f9a420`, 2026-06-15

## Why this matters

The current row layout spreads actions vertically on the right and hides operational fields in paragraph text. For Products and Coupons, admins need sortable columns, quick scanning, and action buttons that do not stretch row height. TanStack Table fits this repo because TanStack Router/Start is already core to the app, and the table library is headless, so it can reuse the existing admin visual language.

## Current state

- Product and Coupon lists use the generic `.admin-list-row` layout.
- Product rows show name, active state, type, price, and description.
- Coupon rows show code, active state, scope, discount, and date window.
- Plan 001 should add coupon usage fields before this plan starts.
- Plan 002 should move create/edit into dialogs before this plan starts.

Relevant excerpts:

```tsx
// src/features/premium-access/admin-payments-page.tsx:400
function ProductList({ products, onEdit, onToggle }: {
  products: ProductRow[];
  onEdit: (form: ProductForm) => void;
  onToggle: (product: ProductRow) => void;
}) {
  return (
    <div>
      {products.map((product) => (
        <div key={product.id} className="admin-list-row">
          // row content and vertical actions
        </div>
      ))}
    </div>
  );
}

// src/features/premium-access/admin-payments-page.tsx:433
function CouponList({ coupons, onEdit, onToggle, onDelete, busyAction }: {
  coupons: CouponRow[];
  onEdit: (coupon: CouponRow) => void;
  onToggle: (coupon: CouponRow) => void;
  onDelete: (coupon: CouponRow) => void;
  busyAction: string;
}) {
  return (
    <div>
      {coupons.map((coupon) => (
        <div key={coupon.id} className="admin-list-row">
          // row content and vertical actions
        </div>
      ))}
    </div>
  );
}
```

Current library facts:

- `@tanstack/react-table` is not in `package.json`.
- `@radix-ui/react-icons` is not in `package.json`.
- The repo already has `clsx` and `tailwind-merge`, plus `cn` in `~/utils/cn`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install table and icons | `pnpm add @tanstack/react-table @radix-ui/react-icons` | dependencies added and lockfile updated |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no TypeScript errors |
| Tests | `pnpm test -- --test-reporter=spec` | all tests pass |

## Suggested executor toolkit

- TanStack Table docs: use `useReactTable`, stable `columns` via `useMemo`, `getCoreRowModel`, `getSortedRowModel`, and `getFilteredRowModel`.
- Use `@radix-ui/react-icons` for small sort/action icons. Do not use emoji.

## Scope

**In scope**:

- `package.json`
- `pnpm-lock.yaml`
- `src/features/premium-access/admin-payments-page.tsx`
- `src/features/premium-access/admin-payment-tables.tsx` (create)
- `src/features/premium-access/admin-payment-table-formatters.ts` (create if pure formatters need tests)
- `src/features/premium-access/admin-payment-table-formatters.test.ts` (create if pure formatters are extracted)

**Out of scope**:

- Checkouts and Entitlements tables. Those are plan 004.
- Server-side pagination.
- Bulk actions.
- CSV export.

## Git workflow

- Branch: `advisor/003-payment-admin-tables`
- Commit message: `feat: add payment admin tables`
- Do not push or open a PR unless asked.

## Steps

### Step 1: Install table dependencies

Run:

```sh
pnpm add @tanstack/react-table @radix-ui/react-icons
```

**Verify**: `grep -n "@tanstack/react-table" package.json` -> one dependency entry exists.

### Step 2: Create a small reusable AdminTable shell

Create `src/features/premium-access/admin-payment-tables.tsx`.

Add a local `AdminTable` helper that:

- accepts a TanStack table instance
- renders a semantic `<table>`
- uses compact admin styling
- supports horizontal overflow on narrow screens
- renders a concise empty state

Keep this local to premium-access for now. Do not create a global table abstraction until at least two admin features need it.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 3: Implement ProductTable

Replace `ProductList` with `ProductTable`.

Columns:

- Product: name plus description
- Type: human-readable product type
- Price: rupiah formatted
- Access target: duration for Premium Membership, Try-out target id or label for Lifetime Try-out Purchase
- Status: active/inactive pill
- Actions: edit, activate/deactivate

Sorting:

- Product
- Type
- Price
- Status

Use stable `columns` with `useMemo`.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 4: Implement CouponTable

Replace `CouponList` with `CouponTable`.

Columns:

- Coupon: code
- Discount: percentage or fixed amount
- Scope: all, Premium Membership, Lifetime Try-out Purchase, Materi
- Usage: `activeUses / maxTotalUses` or `activeUses active`
- Window: start and end date
- Status: active/inactive, and optionally expired if `endsAt` is in the past
- Actions: edit, enable/disable, remove

Sorting:

- Code
- Usage
- End date
- Status

Filtering:

- Add a small text filter for Coupon code.
- Add a simple status filter if it stays under 20 lines of straightforward code. Otherwise defer it.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 5: Keep actions horizontally compact

Use icon+text buttons or short text buttons, but keep all actions in one row on desktop. On mobile, allow wrapping inside the actions cell rather than stacking the entire row into tall blocks.

Use existing button classes:

- `admin-button-ghost text-primary`
- `admin-button-ghost text-amber-600`
- `admin-button-ghost text-rose-600`

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 6: Add formatter tests if extracted

If you extracted helpers for status labels, rupiah formatting, or usage labels, test them.

Suggested cases:

- `premium_membership` -> `Premium Membership`
- fixed discount -> `Rp10.000`
- percentage discount -> `20%`
- capped usage -> `2 / 10`
- unlimited usage -> `2 active`

**Verify**: `pnpm test -- --test-reporter=spec` -> all tests pass.

## Test plan

- Pure formatter tests are preferred.
- Manual browser QA:
  - product columns fit on desktop
  - coupon usage is visible
  - sorting headers work
  - coupon code filter works
  - mobile view scrolls horizontally without text overlap

## Done criteria

- [ ] Product rows are rendered through TanStack Table.
- [ ] Coupon rows are rendered through TanStack Table.
- [ ] Coupon usage from plan 001 is visible in the Coupon table.
- [ ] Actions stay compact and usable.
- [ ] Empty states exist for Products and Coupons.
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm test -- --test-reporter=spec` exits 0.
- [ ] `plans/README.md` status row for plan 003 is updated.

## STOP conditions

Stop and report if:

- Plan 001 usage fields are not present.
- Plan 002 dialogs are not present and edit still expects to fill inline form state.
- TanStack Table conflicts with the current React 19 setup.
- Implementing filters requires server-side pagination or a route search-param redesign.

## Maintenance notes

Keep the table API local and small. If later admin Users, Reports, or Media pages adopt tables, extract a shared `src/components/admin/AdminTable.tsx` after patterns stabilize.

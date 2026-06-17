# Plan 002: Move Payment Create and Edit Flows into Dialogs

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4f9a420..HEAD -- src/features/premium-access/admin-payments-page.tsx src/components/ui/dialog.tsx package.json pnpm-lock.yaml`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding. On mismatch, stop and report.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-add-coupon-usage-summaries.md`
- **Category**: direction
- **Planned at**: commit `4f9a420`, 2026-06-15

## Why this matters

The current `/admin/payments` page keeps Product and Coupon create/edit forms permanently expanded above the rows. Editing a row fills a distant form, which is especially hard on long pages and wide screens. Dialog-based create/edit flows keep list scanning clean, put the action next to the selected entity, and allow field-level validation instead of vague toast errors.

## Current state

- `src/features/premium-access/admin-payments-page.tsx` is a single large client component that owns all form state, server mutations, lists, and support actions.
- `src/components/ui/dialog.tsx` already wraps Radix Dialog and is used by `PremiumDialog`.
- `package.json` already includes `zod`, `@radix-ui/react-dialog`, and `sonner`.
- `package.json` does not include `react-hook-form` or `@hookform/resolvers`.

Relevant excerpts:

```tsx
// src/features/premium-access/admin-payments-page.tsx:55
const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
const [couponForm, setCouponForm] = useState<CouponForm>(() => makeEmptyCouponForm());
const [busyAction, setBusyAction] = useState("");

// src/features/premium-access/admin-payments-page.tsx:194
<section className="admin-panel mt-6">
  <div className="admin-panel-header">
    <h2 className="admin-panel-title">Product</h2>
  </div>
  <div className="grid gap-5 p-5 sm:p-6">
    // permanently expanded Product form
  </div>
  <ProductList products={data.products} onEdit={setProductForm} ... />
</section>

// src/features/premium-access/admin-payments-page.tsx:255
<section className="admin-panel mt-6">
  <div className="admin-panel-header">
    <h2 className="admin-panel-title">Coupon</h2>
  </div>
  <div className="grid gap-5 p-5 sm:p-6">
    // permanently expanded Coupon form
  </div>
  <CouponList coupons={data.coupons} onEdit={(coupon) => setCouponForm(couponToForm(coupon))} ... />
</section>

// src/components/ui/dialog.tsx:25
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content ...>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
```

Design constraints:

- Use labels above inputs.
- Include helper/error text below fields when validation fails.
- Use existing `admin-control`, `admin-button-primary`, `admin-button-secondary`, and Dialog styling instead of introducing a second visual system.
- Do not use emoji in UI chrome.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install form helpers | `pnpm add react-hook-form @hookform/resolvers` | dependencies added and lockfile updated |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no TypeScript errors |
| Tests | `pnpm test -- --test-reporter=spec` | all tests pass |

## Suggested executor toolkit

- Read `src/components/PremiumDialog.tsx` for the existing Dialog composition style.
- Use `react-hook-form` only inside the form dialog components. Keep state local to each dialog.

## Scope

**In scope**:

- `package.json`
- `pnpm-lock.yaml`
- `src/features/premium-access/admin-payments-page.tsx`
- `src/features/premium-access/admin-payment-form-values.ts` (create)
- `src/features/premium-access/admin-payment-form-values.test.ts` (create if pure mapping helpers are extracted)

**Out of scope**:

- Server mutation behavior.
- Database schema.
- Checkout status page.
- Student-facing premium or checkout UI.

## Git workflow

- Branch: `advisor/002-payment-dialogs`
- Commit message: `refactor: move payment admin forms into dialogs`
- Do not push or open a PR unless asked.

## Steps

### Step 1: Install form dependencies

Run:

```sh
pnpm add react-hook-form @hookform/resolvers
```

Use the package manager already present in the repo.

**Verify**: `grep -n "react-hook-form" package.json` -> one dependency entry exists.

### Step 2: Extract form value mapping helpers

Create `src/features/premium-access/admin-payment-form-values.ts`.

Move these pure helpers out of `admin-payments-page.tsx`:

- `productToForm`
- `couponToForm`
- `makeEmptyCouponForm`
- `toDateTimeLocal`

Also add explicit parse helpers for mutation payloads. Keep early returns and plain English names. Avoid clever one-liners.

Suggested helper names:

- `makeProductFormDefaults`
- `makeCouponFormDefaults`
- `makeProductSaveInput`
- `makeCouponSaveInput`

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 3: Add Product dialog state and component

In `admin-payments-page.tsx`, replace the always-expanded Product form with:

- a compact Product section header containing `Create Product`
- a `ProductList` edit action that opens a dialog with that Product
- a `ProductDialog` component in the same file or a new local file if the page becomes too long

Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter` from `src/components/ui/dialog.tsx`.

Dialog behavior:

- Closed by default.
- `Create Product` opens with defaults.
- `Edit` opens with selected Product values.
- Successful save closes dialog, resets state, shows success toast, and calls `router.invalidate()`.
- Failed save keeps dialog open and shows field errors where possible.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 4: Add Coupon dialog state and component

Repeat the same pattern for Coupons:

- Coupon section header contains `Create Coupon`
- `Edit` opens selected Coupon in the dialog
- Successful save closes the dialog and refreshes
- Validation should show specific messages for missing code, invalid discount, invalid date window, and invalid max uses

Use the schema rules from `admin-payment-functions.ts`:

- code: non-empty, max 80
- discount type: `percentage` or `fixed`
- percentage value: 1 to 100
- fixed value: at least 1
- end time must be after start time
- max total uses: empty or integer >= 1

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 5: Remove the old inline forms

Delete the permanently expanded Product and Coupon form markup from the main page. The page should show lists first, with create actions in section headers.

Keep Manual Grant inline for now. Manual Grant is handled in plan 004.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 6: Add pure mapping tests

If you created `admin-payment-form-values.ts`, add `admin-payment-form-values.test.ts`.

Cover:

- Product defaults for Premium Membership
- Product DTO to form for Lifetime Try-out Purchase
- Coupon default end date is after start date
- Coupon save input converts local datetime values to ISO strings
- Empty `maxTotalUses` becomes `null`

**Verify**: `pnpm test -- --test-reporter=spec` -> all tests pass.

## Test plan

- Add pure helper tests for mapping and parsing.
- Manual browser QA after implementation:
  - open `/admin/payments`
  - create Product dialog opens and closes
  - edit Product dialog opens with row values
  - create Coupon dialog opens and closes
  - edit Coupon dialog opens with row values
  - invalid Coupon date window shows a field-level or dialog-level error

## Done criteria

- [ ] Product create/edit no longer uses an always-expanded page form.
- [ ] Coupon create/edit no longer uses an always-expanded page form.
- [ ] Dialogs reuse `src/components/ui/dialog.tsx`.
- [ ] Field-level validation exists for common form errors.
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm test -- --test-reporter=spec` exits 0.
- [ ] `plans/README.md` status row for plan 002 is updated.

## STOP conditions

Stop and report if:

- Adding `react-hook-form` conflicts with React 19 or the current TypeScript setup.
- The Dialog wrapper cannot support the required form layout without broad changes to `src/components/ui/dialog.tsx`.
- The page was already split by another change and the old inline form markup is gone.
- Typecheck fails twice after reasonable fixes.

## Maintenance notes

Keep dialog components boring and local. Do not introduce global form state. If later admin pages need the same pattern, extract shared admin form primitives after two or three pages converge on the same shape.

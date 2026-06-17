# Plan 004: Improve Checkout, Entitlement, and Manual Grant Support Workflows

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4f9a420..HEAD -- src/features/premium-access/admin-payment-functions.ts src/features/premium-access/admin-payments-page.tsx src/lib/db/schema.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding. On mismatch, stop and report.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/003-add-payment-admin-tables.md`
- **Category**: direction
- **Planned at**: commit `4f9a420`, 2026-06-15

## Why this matters

Checkouts and Entitlements are support surfaces. Admins need to answer "who paid?", "which Coupon was used?", "did Xendit sync?", "when does access expire?", and "why was this manually granted?" quickly. The current row layout shows product name, status, amount, coupon code, id, and dates, but it omits Student identity in the UI and keeps support actions visually disconnected.

## Current state

- `getPaymentAdminData` loads raw Checkouts and Entitlements without joining Student user/profile display data.
- `toCheckoutDto` returns `studentUserId` but not Student name/email.
- `toEntitlementDto` returns `studentUserId`, source, grant reason, and grant admin id, but not Student display info.
- Manual Grant is an inline form above the Checkout and Entitlement lists.

Relevant excerpts:

```ts
// src/features/premium-access/admin-payment-functions.ts:92
db.select().from(checkouts).orderBy(desc(checkouts.createdAt)).limit(30),
db.select().from(entitlements).orderBy(desc(entitlements.createdAt)).limit(30),

// src/features/premium-access/admin-payment-functions.ts:349
function toCheckoutDto(checkout: typeof checkouts.$inferSelect) {
  return {
    id: checkout.id,
    studentUserId: checkout.studentUserId,
    productName: checkout.productName,
    productType: checkout.productType,
    couponCode: checkout.couponCode,
    status: checkout.status,
    total: checkout.finalAmount,
    xenditInvoiceId: checkout.xenditInvoiceId,
    xenditStatus: checkout.xenditStatus,
    createdAt: checkout.createdAt.toISOString(),
    paidAt: checkout.paidAt?.toISOString() ?? null,
    expiresAt: checkout.expiresAt?.toISOString() ?? null,
  };
}

// src/features/premium-access/admin-payments-page.tsx:316
<section className="admin-panel mt-6">
  <div className="admin-panel-header">
    <h2 className="admin-panel-title">Manual Grant</h2>
  </div>
  <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end">
    // inline grant fields
  </div>
</section>
```

Domain constraints from `CONTEXT.md`:

- Admin manual grants are explicit support actions.
- Manual Entitlement grants must preserve an audit trail.
- Admin payment repair uses the same transition rules as webhooks.
- Browser redirects never grant access by themselves.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no TypeScript errors |
| Tests | `pnpm test -- --test-reporter=spec` | all tests pass |

## Scope

**In scope**:

- `src/features/premium-access/admin-payment-functions.ts`
- `src/features/premium-access/admin-payments-page.tsx`
- `src/features/premium-access/admin-payment-tables.tsx`
- `src/features/premium-access/admin-payment-support-formatters.ts` (create if useful)
- `src/features/premium-access/admin-payment-support-formatters.test.ts` (create if pure helpers are extracted)

**Out of scope**:

- Changing Xendit webhook behavior.
- Changing Entitlement creation rules.
- Adding server-side pagination.
- Adding admin audit log tables.

## Git workflow

- Branch: `advisor/004-payment-support-workflows`
- Commit message: `feat: improve payment support workflows`
- Do not push or open a PR unless asked.

## Steps

### Step 1: Add Student display data to Checkout and Entitlement DTOs

Update the admin loader so recent Checkouts and Entitlements include:

- `studentName`
- `studentEmail`

Use left joins to `user` and `studentProfiles`, similar to the existing student dropdown query in the same loader. Keep the result shape explicit.

Avoid duplicating a lot of mapping logic. A small helper like `makeStudentLabel({ displayName, name, email })` is fine.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 2: Add CheckoutTable

In the table file from plan 003, add `CheckoutTable`.

Columns:

- Checkout: short id plus created date
- Student: name and email
- Product: product name and type
- Amount: final amount and Coupon code if present
- Status: local checkout status and Xendit status
- Timeline: paid/expires date
- Actions: `Sync Xendit` only when `xenditInvoiceId` exists

Keep `Sync Xendit` disabled while its row is busy.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 3: Add EntitlementTable

Add `EntitlementTable`.

Columns:

- Student: name and email
- Access: Premium Membership or Lifetime Try-out Purchase
- Source: Checkout or Admin Grant
- Target: global access or content target
- Window: starts and ends/lifetime
- Grant reason: visible when source is `admin_grant`

Use human-readable labels. Do not expose only enum values like `premium_membership` when the UI has room for readable text.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 4: Move Manual Grant into a dialog or compact support panel

If plan 002 already established dialog form patterns, use a `Grant Access` dialog.

Dialog fields:

- Student
- Product
- Reason

Validation:

- Student required
- Product required
- Reason required, max 500 characters

Successful grant:

- close dialog
- clear reason
- toast success
- refresh route

Failure:

- keep dialog open
- show clear error text

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 5: Add filters only where they reduce support time

Add lightweight client filters if the table implementation from plan 003 supports them cleanly:

- Checkout status
- Entitlement source

Do not add complicated date range filters in this plan.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 6: Add formatter tests if helpers were extracted

Suggested test cases:

- global Premium Membership target -> `Global access`
- lifetime access with no end date -> `Lifetime`
- checkout source label -> `Checkout`
- admin grant source label -> `Admin Grant`
- local status plus Xendit status display does not duplicate empty values

**Verify**: `pnpm test -- --test-reporter=spec` -> all tests pass.

## Test plan

- Add pure formatter tests if helpers exist.
- Manual browser QA:
  - Checkouts show Student name/email
  - Entitlements show Student name/email
  - Checkout status and Xendit status are distinguishable
  - Manual Grant opens in a dialog or compact panel
  - Grant reason is required
  - Sync Xendit remains disabled without an invoice id

## Done criteria

- [ ] Recent Checkouts include Student identity in the admin UI.
- [ ] Recent Entitlements include Student identity in the admin UI.
- [ ] Checkouts and Entitlements use table layouts instead of tall generic rows.
- [ ] Manual Grant is no longer a wide always-expanded form.
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm test -- --test-reporter=spec` exits 0.
- [ ] `plans/README.md` status row for plan 004 is updated.

## STOP conditions

Stop and report if:

- Student joins introduce ambiguous column names that make the loader brittle.
- Admin support requires more than the recent 30 records and therefore needs server-side pagination first.
- Moving Manual Grant conflicts with the dialog architecture from plan 002.
- Sync Xendit behavior needs server-side changes beyond UI wiring.

## Maintenance notes

These tables are operational, not analytics. Keep them optimized for support tasks. If admins later need reconciliation or finance reporting, add a separate reporting surface instead of overloading `/admin/payments`.

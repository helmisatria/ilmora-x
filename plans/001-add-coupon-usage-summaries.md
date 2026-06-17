# Plan 001: Show Coupon Usage Summaries in Admin Payments

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4f9a420..HEAD -- src/features/premium-access/admin-payment-functions.ts src/features/premium-access/admin-payments-page.tsx src/features/premium-access/payment-service.ts src/lib/db/schema.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding. On mismatch, stop and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `4f9a420`, 2026-06-15

## Why this matters

Coupon management is incomplete without usage visibility. The domain model already tracks coupon reservations, finalized redemptions, and released reservations, but `/admin/payments` only shows coupon code, status, scope, discount, and date window. Admins need to see how many times each Coupon has been used, how many are currently reserved, and whether it is near or past `maxTotalUses`.

## Current state

- `src/features/premium-access/admin-payment-functions.ts` owns the admin data loader for `/admin/payments`.
- `src/features/premium-access/admin-payments-page.tsx` renders the Coupon list.
- `src/features/premium-access/payment-service.ts` already has a single-coupon active usage helper.
- `src/lib/db/schema.ts` defines `coupon_redemptions` with `reserved`, `finalized`, and `released` statuses.

Relevant excerpts:

```ts
// src/features/premium-access/admin-payment-functions.ts:70
const [productRows, couponRows, studentRows, tryoutRows, checkoutRows, entitlementRows] = await Promise.all([
  db.select().from(products).orderBy(products.type, products.price, products.name),
  db.select().from(coupons).orderBy(desc(coupons.createdAt)),
  // ...
]);

// src/features/premium-access/admin-payment-functions.ts:97
coupons: couponRows.map(toCouponDto),

// src/features/premium-access/admin-payment-functions.ts:335
function toCouponDto(coupon: typeof coupons.$inferSelect) {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    productScope: coupon.productScope,
    startsAt: coupon.startsAt.toISOString(),
    endsAt: coupon.endsAt.toISOString(),
    maxTotalUses: coupon.maxTotalUses,
    active: coupon.active,
  };
}

// src/features/premium-access/payment-service.ts:356
export async function countActiveCouponReservations(couponId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(couponRedemptions)
    .where(and(
      eq(couponRedemptions.couponId, couponId),
      inArray(couponRedemptions.status, ["reserved", "finalized"]),
    ));

  return Number(row?.count ?? 0);
}

// src/lib/db/schema.ts:408
export const couponRedemptions = pgTable("coupon_redemptions", {
  couponId: text("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("reserved"),
  // ...
}, (table) => [
  index("coupon_redemptions_coupon_status_idx").on(table.couponId, table.status),
  check("coupon_redemptions_status_check", sql`${table.status} in ('reserved', 'finalized', 'released')`),
]);
```

Domain vocabulary to preserve from `CONTEXT.md`:

- Use **Coupon**, not promo, voucher, or discount code.
- Coupon `max_total_uses` is a global cap.
- Coupon redemption is per-Student.
- Limited Coupon use is reserved at Checkout creation, finalized on paid Checkout, and released on expired Checkout.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no TypeScript errors |
| Tests | `pnpm test -- --test-reporter=spec` | all tests pass |

## Scope

**In scope**:

- `src/features/premium-access/admin-payment-functions.ts`
- `src/features/premium-access/admin-payments-page.tsx`
- `src/features/premium-access/admin-coupon-usage.test.ts` (create if adding a pure helper worth testing)

**Out of scope**:

- Database migrations. The needed tables and indexes already exist.
- Checkout redemption lifecycle changes.
- Student-facing checkout coupon behavior.

## Git workflow

- Branch: `advisor/001-coupon-usage-summaries`
- Commit message style: conventional commits are used in recent history. Use `feat: show coupon usage in admin payments`.
- Do not push or open a PR unless asked.

## Steps

### Step 1: Add a grouped coupon usage read

In `admin-payment-functions.ts`, add a grouped query for `couponRedemptions` alongside the existing `couponRows` load. Do not call `countActiveCouponReservations` in a loop, because that would create an N+1 query.

Target data shape per coupon:

```ts
type CouponUsageSummary = {
  reservedUses: number;
  finalizedUses: number;
  releasedUses: number;
  activeUses: number; // reserved + finalized
};
```

Use `couponRedemptions.couponId` and conditional SQL counts grouped by coupon id. Keep the code explicit and easy to scan. If Drizzle conditional count syntax gets awkward, prefer a small result reduction over clever SQL, but still use one grouped query.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 2: Return usage in the Coupon DTO

Change `toCouponDto` to accept the usage summary for that coupon and return:

- `reservedUses`
- `finalizedUses`
- `releasedUses`
- `activeUses`
- `maxTotalUses`

When a coupon has no rows in `coupon_redemptions`, return zeroes.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 3: Render usage in the Coupon list

In `CouponList`, show usage as a first-class row metric:

- Unlimited coupon: `X active uses`
- Capped coupon: `X / N active uses`
- Include a secondary text or pill for finalized uses if space allows: `Y paid`

Use existing `admin-meta-tag` / `admin-status-pill` classes or simple Tailwind. Do not add a chart or progress bar yet.

**Verify**: `pnpm exec tsc --noEmit` -> exit 0.

### Step 4: Add a small pure test if you introduce formatting logic

If usage label formatting becomes a helper, put it in a pure function and test it in `src/features/premium-access/admin-coupon-usage.test.ts`.

Cover:

- no cap, zero usage
- no cap, active usage
- capped coupon below limit
- capped coupon at limit

**Verify**: `pnpm test -- --test-reporter=spec` -> all tests pass, including the new usage helper tests if created.

## Test plan

- Prefer a pure helper test only for label/status calculation.
- Do not try to integration-test TanStack server functions unless the repo already has a DB test harness by the time this plan is executed.
- Always run full typecheck and the existing test suite.

## Done criteria

- [ ] `getPaymentAdminData` returns coupon usage fields.
- [ ] Coupon rows display usage count clearly.
- [ ] No N+1 query was added for coupon usage.
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm test -- --test-reporter=spec` exits 0.
- [ ] `plans/README.md` status row for plan 001 is updated.

## STOP conditions

Stop and report if:

- `coupon_redemptions` no longer has the `status` values shown above.
- The admin loader has already been split or moved and the line references no longer match.
- Adding usage requires a migration.
- Typecheck fails twice after reasonable fixes.

## Maintenance notes

This usage summary should become the source used by any future Coupon table, filters, and detail view. If new coupon statuses are added later, update the usage summary in the same change as the schema/status transition.

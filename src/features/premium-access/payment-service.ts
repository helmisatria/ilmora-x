import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../../lib/db/client";
import {
  checkouts,
  couponRedemptions,
  coupons,
  entitlements,
  products,
} from "../../lib/db/schema";
import { badRequest, conflict, notFound } from "../../lib/http/errors";

export type ProductType = "premium_membership" | "lifetime_tryout" | "material";
export type ContentType = "tryout" | "material";
export type CouponDiscountType = "percentage" | "fixed";

export const checkoutExternalIdPrefix = "checkout_";

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function makeCheckoutExternalId(checkoutId: string) {
  return `${checkoutExternalIdPrefix}${checkoutId}`;
}

export function makePaymentId() {
  return globalThis.crypto.randomUUID();
}

export function getCheckoutIdFromExternalId(externalId: string | null | undefined) {
  if (!externalId?.startsWith(checkoutExternalIdPrefix)) return null;

  return externalId.slice(checkoutExternalIdPrefix.length);
}

export function getInvoiceDurationSeconds() {
  const parsed = Number.parseInt(process.env.XENDIT_INVOICE_DURATION_SECONDS ?? "", 10);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return 86_400;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);

  next.setDate(next.getDate() + days);
  return next;
}

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export function calculateDiscountAmount({
  price,
  discountType,
  discountValue,
}: {
  price: number;
  discountType: CouponDiscountType;
  discountValue: number;
}) {
  if (discountType === "percentage") {
    return Math.min(price, Math.round(price * (discountValue / 100)));
  }

  return Math.min(price, discountValue);
}

export async function listActiveProductsByType(type: ProductType) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.type, type), eq(products.active, true)))
    .orderBy(products.price, products.name);
}

export async function getProductForCheckout(productId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);

  if (!product) {
    throw notFound("Product was not found.");
  }

  return product;
}

export async function getValidCouponForProduct({
  code,
  productType,
  now = new Date(),
}: {
  code: string;
  productType: ProductType;
  now?: Date;
}) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) return null;

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(
      eq(coupons.code, normalizedCode),
      eq(coupons.active, true),
      lte(coupons.startsAt, now),
      gt(coupons.endsAt, now),
      or(eq(coupons.productScope, "all"), eq(coupons.productScope, productType)),
    ))
    .limit(1);

  if (!coupon) {
    throw badRequest("Coupon is invalid or not active for this Product.");
  }

  return coupon;
}

export async function expireCheckoutIfNeeded(checkout: typeof checkouts.$inferSelect, now = new Date()) {
  if (checkout.status !== "pending") return checkout;
  if (!checkout.expiresAt || checkout.expiresAt > now) return checkout;

  await markCheckoutExpired(checkout.id, now);

  return {
    ...checkout,
    status: "expired",
    updatedAt: now,
  };
}

export async function markCheckoutExpired(checkoutId: string, now = new Date()) {
  await db.transaction(async (tx) => {
    await tx
      .update(checkouts)
      .set({
        status: "expired",
        updatedAt: now,
      })
      .where(and(eq(checkouts.id, checkoutId), eq(checkouts.status, "pending")));

    await tx
      .update(couponRedemptions)
      .set({
        status: "released",
        releasedAt: now,
        updatedAt: now,
      })
      .where(and(eq(couponRedemptions.checkoutId, checkoutId), eq(couponRedemptions.status, "reserved")));
  });
}

export async function getEffectivePremiumMembership(studentUserId: string) {
  const now = new Date();

  const [membership] = await db
    .select()
    .from(entitlements)
    .where(and(
      eq(entitlements.studentUserId, studentUserId),
      eq(entitlements.productType, "premium_membership"),
      gt(entitlements.endsAt, now),
    ))
    .orderBy(desc(entitlements.endsAt))
    .limit(1);

  return membership ?? null;
}

export async function hasActivePremiumMembership(studentUserId: string) {
  return Boolean(await getEffectivePremiumMembership(studentUserId));
}

export async function hasLifetimeTryoutPurchase(studentUserId: string, tryoutId: string) {
  const now = new Date();

  const [purchase] = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(
      eq(entitlements.studentUserId, studentUserId),
      eq(entitlements.productType, "lifetime_tryout"),
      eq(entitlements.contentType, "tryout"),
      eq(entitlements.contentId, tryoutId),
      or(isNull(entitlements.endsAt), gt(entitlements.endsAt, now)),
    ))
    .limit(1);

  return Boolean(purchase);
}

export async function getTryoutEntitlementAccess(studentUserId: string, tryoutId: string) {
  const [hasPremium, hasLifetime] = await Promise.all([
    hasActivePremiumMembership(studentUserId),
    hasLifetimeTryoutPurchase(studentUserId, tryoutId),
  ]);

  return {
    hasPremiumMembership: hasPremium,
    hasLifetimeTryoutPurchase: hasLifetime,
  };
}

export async function grantEntitlementForPaidCheckout(
  tx: any,
  checkout: typeof checkouts.$inferSelect,
  now = new Date(),
) {
  const sourceId = checkout.id;
  const existing = await tx
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.source, "checkout"), eq(entitlements.sourceId, sourceId)))
    .limit(1);

  if (existing.length > 0) return;

  const entitlementWindow = await getEntitlementWindow(tx, checkout, now);

  await tx.insert(entitlements).values({
    studentUserId: checkout.studentUserId,
    source: "checkout",
    sourceId,
    productId: checkout.productId,
    productType: checkout.productType,
    contentType: checkout.contentType,
    contentId: checkout.contentId,
    startsAt: entitlementWindow.startsAt,
    endsAt: entitlementWindow.endsAt,
    metadata: {
      checkoutId: checkout.id,
      productName: checkout.productName,
      finalAmount: checkout.finalAmount,
    },
  }).onConflictDoNothing();

  await tx
    .update(couponRedemptions)
    .set({
      status: "finalized",
      finalizedAt: now,
      updatedAt: now,
    })
    .where(and(eq(couponRedemptions.checkoutId, checkout.id), eq(couponRedemptions.status, "reserved")));
}

async function getEntitlementWindow(
  tx: any,
  checkout: typeof checkouts.$inferSelect,
  now: Date,
) {
  if (checkout.productType !== "premium_membership") {
    return {
      startsAt: now,
      endsAt: null,
    };
  }

  if (!checkout.durationDays) {
    throw badRequest("Premium Membership duration is required.");
  }

  const [latestMembership] = await tx
    .select({ endsAt: entitlements.endsAt })
    .from(entitlements)
    .where(and(
      eq(entitlements.studentUserId, checkout.studentUserId),
      eq(entitlements.productType, "premium_membership"),
      gt(entitlements.endsAt, now),
    ))
    .orderBy(desc(entitlements.endsAt))
    .limit(1);

  const extensionStart = latestMembership?.endsAt && latestMembership.endsAt > now
    ? latestMembership.endsAt
    : now;

  return {
    startsAt: now,
    endsAt: addDays(extensionStart, checkout.durationDays),
  };
}

export async function createAdminGrant({
  studentUserId,
  product,
  grantedByAdminUserId,
  reason,
}: {
  studentUserId: string;
  product: typeof products.$inferSelect;
  grantedByAdminUserId: string;
  reason: string;
}) {
  const now = new Date();
  const checkoutLike = {
    id: makePaymentId(),
    studentUserId,
    productId: product.id,
    productType: product.type,
    contentType: product.contentType,
    contentId: product.contentId,
    durationDays: product.durationDays,
    productName: product.name,
    finalAmount: 0,
  } as typeof checkouts.$inferSelect;
  const window = await getEntitlementWindow(db, checkoutLike, now);

  await db.insert(entitlements).values({
    studentUserId,
    source: "admin_grant",
    sourceId: `admin_grant:${makePaymentId()}`,
    productId: product.id,
    productType: product.type,
    contentType: product.contentType,
    contentId: product.contentId,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    grantedByAdminUserId,
    grantReason: reason,
    metadata: {
      productName: product.name,
    },
  });
}

export function assertSupportedMvpProduct(product: typeof products.$inferSelect) {
  if (product.type === "material") {
    throw badRequest("Materi purchases are not available yet.");
  }
}

export function assertProductShape(product: {
  type: string;
  durationDays: number | null;
  contentType: string | null;
  contentId: string | null;
}) {
  if (product.type === "premium_membership" && !product.durationDays) {
    throw badRequest("Premium Membership products need a duration.");
  }

  if (product.type === "lifetime_tryout" && (product.contentType !== "tryout" || !product.contentId)) {
    throw badRequest("Lifetime Try-out products need one Try-out target.");
  }
}

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

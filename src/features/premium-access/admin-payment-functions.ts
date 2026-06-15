import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  checkouts,
  couponRedemptions,
  coupons,
  entitlements,
  products,
  studentProfiles,
  tryouts,
  user,
} from "../../lib/db/schema";
import { badRequest, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "../admin/admin-access";
import {
  assertProductShape,
  createAdminGrant,
  normalizeCouponCode,
} from "./payment-service";
import { applyXenditInvoiceToCheckout } from "./xendit-webhook.server";
import { getXenditInvoice } from "./xendit-client.server";

const productSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["premium_membership", "lifetime_tryout"]),
  price: z.number().int().min(0),
  active: z.boolean(),
  durationDays: z.number().int().min(1).max(3650).optional().nullable(),
  contentId: z.string().trim().min(1).optional().nullable(),
});

const couponSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(80),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().int().min(1),
  productScope: z.enum(["all", "premium_membership", "lifetime_tryout", "material"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  maxTotalUses: z.number().int().min(1).optional().nullable(),
  active: z.boolean(),
});

const productIdSchema = z.object({
  productId: z.string().trim().min(1),
});

const couponIdSchema = z.object({
  couponId: z.string().trim().min(1),
});

const manualGrantSchema = z.object({
  studentUserId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(500),
});

const checkoutIdSchema = z.object({
  checkoutId: z.string().trim().min(1),
});

export const getPaymentAdminData = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const [productRows, couponRows, studentRows, tryoutRows, checkoutRows, entitlementRows] = await Promise.all([
      db.select().from(products).orderBy(products.type, products.price, products.name),
      db.select().from(coupons).orderBy(desc(coupons.createdAt)),
      db
        .select({
          userId: user.id,
          email: user.email,
          name: user.name,
          displayName: studentProfiles.displayName,
        })
        .from(user)
        .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
        .orderBy(user.email),
      db
        .select({
          id: tryouts.id,
          title: tryouts.title,
          accessLevel: tryouts.accessLevel,
          status: tryouts.status,
        })
        .from(tryouts)
        .orderBy(tryouts.title),
      db.select().from(checkouts).orderBy(desc(checkouts.createdAt)).limit(30),
      db.select().from(entitlements).orderBy(desc(entitlements.createdAt)).limit(30),
    ]);

    return {
      products: productRows.map(toProductDto),
      coupons: couponRows.map(toCouponDto),
      students: studentRows.map((student) => ({
        userId: student.userId,
        email: student.email,
        name: student.displayName || student.name || student.email,
      })),
      tryouts: tryoutRows.map((tryout) => ({
        id: tryout.id,
        title: tryout.title,
        accessLevel: tryout.accessLevel,
        status: tryout.status,
      })),
      checkouts: checkoutRows.map(toCheckoutDto),
      entitlements: entitlementRows.map(toEntitlementDto),
    };
  });

export const saveProductAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(productSchema, input))
  .handler(async ({ data }) => {
    const values = makeProductValues(data);

    assertProductShape(values);

    if (values.type === "lifetime_tryout") {
      await ensureTryoutExists(values.contentId);
    }

    if (data.id) {
      await db
        .update(products)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(products.id, data.id));
      return { ok: true };
    }

    await db.insert(products).values(values);
    return { ok: true };
  });

export const setProductActiveAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(productIdSchema.extend({ active: z.boolean() }), input))
  .handler(async ({ data }) => {
    await db
      .update(products)
      .set({
        active: data.active,
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.productId));

    return { ok: true };
  });

export const saveCouponAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(couponSchema, input))
  .handler(async ({ data }) => {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (endsAt <= startsAt) {
      throw badRequest("Coupon end time must be after start time.");
    }

    const values = {
      code: normalizeCouponCode(data.code),
      discountType: data.discountType,
      discountValue: data.discountValue,
      productScope: data.productScope,
      startsAt,
      endsAt,
      maxTotalUses: data.maxTotalUses ?? null,
      active: data.active,
    };

    if (data.id) {
      await db
        .update(coupons)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, data.id));
      return { ok: true };
    }

    await db.insert(coupons).values(values);
    return { ok: true };
  });

export const setCouponActiveAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(couponIdSchema.extend({ active: z.boolean() }), input))
  .handler(async ({ data }) => {
    await db
      .update(coupons)
      .set({
        active: data.active,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, data.couponId));

    return { ok: true };
  });

export const deleteCouponAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(couponIdSchema, input))
  .handler(async ({ data }) => {
    const [checkoutReference] = await db
      .select({ id: checkouts.id })
      .from(checkouts)
      .where(eq(checkouts.couponId, data.couponId))
      .limit(1);

    const [redemptionReference] = await db
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, data.couponId))
      .limit(1);

    if (checkoutReference || redemptionReference) {
      throw badRequest("Coupon already has checkout history. Disable it instead of deleting it.");
    }

    await db.delete(coupons).where(eq(coupons.id, data.couponId));

    return { ok: true };
  });

export const grantEntitlementAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(manualGrantSchema, input))
  .handler(async ({ context, data }) => {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!product) {
      throw notFound("Product was not found.");
    }

    await createAdminGrant({
      studentUserId: data.studentUserId,
      product,
      grantedByAdminUserId: context.viewer.sessionUserId,
      reason: data.reason,
    });

    return { ok: true };
  });

export const syncCheckoutWithXenditAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(checkoutIdSchema, input))
  .handler(async ({ data }) => {
    const [checkout] = await db
      .select()
      .from(checkouts)
      .where(eq(checkouts.id, data.checkoutId))
      .limit(1);

    if (!checkout) {
      throw notFound("Checkout was not found.");
    }

    if (!checkout.xenditInvoiceId) {
      throw badRequest("Checkout has no Xendit invoice.");
    }

    const invoice = await getXenditInvoice(checkout.xenditInvoiceId);
    const result = await applyXenditInvoiceToCheckout(invoice, checkout);

    return { ok: true, result };
  });

function makeProductValues(data: z.infer<typeof productSchema>) {
  if (data.type === "premium_membership") {
    return {
      name: data.name,
      type: data.type,
      description: data.description ?? "",
      price: data.price,
      active: data.active,
      durationDays: data.durationDays ?? 30,
      contentType: null,
      contentId: null,
    };
  }

  return {
    name: data.name,
    type: data.type,
    description: data.description ?? "",
    price: data.price,
    active: data.active,
    durationDays: null,
    contentType: "tryout",
    contentId: data.contentId ?? null,
  };
}

async function ensureTryoutExists(tryoutId: string | null) {
  if (!tryoutId) {
    throw badRequest("Lifetime Try-out Product needs a Try-out target.");
  }

  const [tryout] = await db.select({ id: tryouts.id }).from(tryouts).where(eq(tryouts.id, tryoutId)).limit(1);

  if (!tryout) {
    throw badRequest("Selected Try-out was not found.");
  }
}

function toProductDto(product: typeof products.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    description: product.description,
    price: product.price,
    active: product.active,
    durationDays: product.durationDays,
    contentType: product.contentType,
    contentId: product.contentId,
    createdAt: product.createdAt.toISOString(),
  };
}

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

function toEntitlementDto(entitlement: typeof entitlements.$inferSelect) {
  return {
    id: entitlement.id,
    studentUserId: entitlement.studentUserId,
    source: entitlement.source,
    productType: entitlement.productType,
    contentType: entitlement.contentType,
    contentId: entitlement.contentId,
    startsAt: entitlement.startsAt.toISOString(),
    endsAt: entitlement.endsAt?.toISOString() ?? null,
    grantedByAdminUserId: entitlement.grantedByAdminUserId,
    grantReason: entitlement.grantReason,
  };
}

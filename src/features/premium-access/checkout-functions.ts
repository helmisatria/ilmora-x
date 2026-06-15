import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  checkouts,
  couponRedemptions,
  coupons,
  products,
} from "../../lib/db/schema";
import { badRequest, conflict, forbidden, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { getStudentViewer } from "../student/student-viewer.server";
import {
  addSeconds,
  assertProductShape,
  assertSupportedMvpProduct,
  calculateDiscountAmount,
  countActiveCouponReservations,
  expireCheckoutIfNeeded,
  getInvoiceDurationSeconds,
  makePaymentId,
  getProductForCheckout,
  getValidCouponForProduct,
  grantEntitlementForPaidCheckout,
  listActiveProductsByType,
  makeCheckoutExternalId,
  normalizeCouponCode,
  type ProductType,
} from "./payment-service";
import { createXenditInvoice } from "./xendit-client.server";

const productIdSchema = z.object({
  productId: z.string().trim().min(1),
});

const couponPreviewSchema = z.object({
  productId: z.string().trim().min(1),
  couponCode: z.string().trim().max(80),
});

const startCheckoutSchema = z.object({
  productId: z.string().trim().min(1),
  couponCode: z.string().trim().max(80).optional(),
});

const checkoutIdSchema = z.object({
  checkoutId: z.string().trim().min(1),
});

export const listMembershipProducts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await listActiveProductsByType("premium_membership");

  return rows.map(toProductDto);
});

export const getCheckoutProduct = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(productIdSchema, input))
  .handler(async ({ data }) => {
    const product = await getProductForCheckout(data.productId);

    assertSupportedMvpProduct(product);
    assertProductShape(product);

    return toProductDto(product);
  });

export const previewCheckoutCoupon = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(couponPreviewSchema, input))
  .handler(async ({ data }) => {
    const product = await getProductForCheckout(data.productId);
    const coupon = await getValidCouponForProduct({
      code: data.couponCode,
      productType: product.type as ProductType,
    });

    if (!coupon) {
      return {
        type: "none" as const,
        subtotal: product.price,
        discountAmount: 0,
        total: product.price,
      };
    }

    await assertCouponUseAvailable({
      coupon,
      studentUserId: (await getStudentViewer()).userId,
    });

    const discountAmount = calculateDiscountAmount({
      price: product.price,
      discountType: coupon.discountType as "percentage" | "fixed",
      discountValue: coupon.discountValue,
    });

    return {
      type: "coupon" as const,
      code: coupon.code,
      label: makeCouponLabel(coupon),
      subtotal: product.price,
      discountAmount,
      total: Math.max(0, product.price - discountAmount),
    };
  });

export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(startCheckoutSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();
    const product = await getProductForCheckout(data.productId);

    assertSupportedMvpProduct(product);
    assertProductShape(product);

    const coupon = data.couponCode
      ? await getValidCouponForProduct({
          code: data.couponCode,
          productType: product.type as ProductType,
        })
      : null;
    const reusableCheckout = await findReusableCheckout({
      studentUserId: viewer.userId,
      productId: product.id,
      couponId: coupon?.id ?? null,
    });

    if (reusableCheckout) {
      return makeCheckoutResult(reusableCheckout);
    }

    const discountAmount = coupon
      ? calculateDiscountAmount({
          price: product.price,
          discountType: coupon.discountType as "percentage" | "fixed",
          discountValue: coupon.discountValue,
        })
      : 0;
    const finalAmount = Math.max(0, product.price - discountAmount);
    const now = new Date();
    const invoiceDuration = getInvoiceDurationSeconds();
    const expiresAt = addSeconds(now, invoiceDuration);
    const checkoutId = makePaymentId();
    const externalId = makeCheckoutExternalId(checkoutId);

    const checkout = await db.transaction(async (tx) => {
      if (coupon) {
        await assertCouponUseAvailable({
          coupon,
          studentUserId: viewer.userId,
        });
      }

      const [createdCheckout] = await tx
        .insert(checkouts)
        .values({
          id: checkoutId,
          studentUserId: viewer.userId,
          productId: product.id,
          couponId: coupon?.id ?? null,
          status: finalAmount === 0 ? "paid" : "pending",
          productName: product.name,
          productType: product.type,
          productDescription: product.description,
          durationDays: product.durationDays,
          contentType: product.contentType,
          contentId: product.contentId,
          couponCode: coupon?.code ?? null,
          baseAmount: product.price,
          discountAmount,
          finalAmount,
          paymentProvider: finalAmount === 0 ? "manual_zero_amount" : "xendit",
          xenditExternalId: finalAmount === 0 ? null : externalId,
          paidAt: finalAmount === 0 ? now : null,
          expiresAt: finalAmount === 0 ? null : expiresAt,
        })
        .returning();

      if (!createdCheckout) {
        throw new Error("Checkout was not created.");
      }

      if (coupon) {
        await tx.insert(couponRedemptions).values({
          couponId: coupon.id,
          studentUserId: viewer.userId,
          checkoutId: createdCheckout.id,
          status: finalAmount === 0 ? "finalized" : "reserved",
          discountAmount,
          finalizedAt: finalAmount === 0 ? now : null,
        });
      }

      if (finalAmount === 0) {
        await grantEntitlementForPaidCheckout(tx, createdCheckout, now);
      }

      return createdCheckout;
    });

    if (finalAmount === 0) {
      return makeCheckoutResult(checkout);
    }

    try {
      const invoice = await createXenditInvoice({
        externalId,
        amount: finalAmount,
        description: checkout.productName,
        invoiceDuration,
        customer: {
          given_names: viewer.profile?.displayName || viewer.name || "Student IlmoraX",
          email: viewer.email,
          ...(viewer.profile?.phone ? { mobile_number: viewer.profile.phone } : {}),
        },
        successRedirectUrl: makeCheckoutStatusUrl(checkout.id),
        failureRedirectUrl: makeCheckoutStatusUrl(checkout.id),
        items: [
          {
            name: checkout.productName,
            quantity: 1,
            price: finalAmount,
            category: checkout.productType,
          },
        ],
        metadata: {
          checkout_id: checkout.id,
          student_user_id: viewer.userId,
          product_id: product.id,
          product_type: product.type,
          coupon_code: coupon?.code ?? null,
        },
      });

      const [updatedCheckout] = await db
        .update(checkouts)
        .set({
          xenditInvoiceId: invoice.id,
          xenditInvoiceUrl: invoice.invoice_url ?? null,
          xenditStatus: invoice.status,
          providerPayload: invoice,
          updatedAt: new Date(),
        })
        .where(eq(checkouts.id, checkout.id))
        .returning();

      return makeCheckoutResult(updatedCheckout ?? checkout);
    } catch (error) {
      await cancelCheckoutAfterProviderFailure(checkout.id);

      throw error;
    }
  });

export const getCheckoutStatus = createServerFn({ method: "GET" })
  .inputValidator((input) => parseInput(checkoutIdSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getStudentViewer();
    const checkout = await getCheckoutForStudent(data.checkoutId, viewer.userId);
    const currentCheckout = await expireCheckoutIfNeeded(checkout);

    return toCheckoutStatusDto(currentCheckout);
  });

async function findReusableCheckout({
  studentUserId,
  productId,
  couponId,
}: {
  studentUserId: string;
  productId: string;
  couponId: string | null;
}) {
  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(and(
      eq(checkouts.studentUserId, studentUserId),
      eq(checkouts.productId, productId),
      couponId ? eq(checkouts.couponId, couponId) : isNull(checkouts.couponId),
      eq(checkouts.status, "pending"),
    ))
    .orderBy(sql`${checkouts.createdAt} desc`)
    .limit(1);

  if (!checkout) return null;

  const currentCheckout = await expireCheckoutIfNeeded(checkout);

  if (currentCheckout.status !== "pending") return null;

  return currentCheckout;
}

async function assertCouponUseAvailable({
  coupon,
  studentUserId,
}: {
  coupon: typeof coupons.$inferSelect;
  studentUserId: string;
}) {
  const [studentUse] = await db
    .select({ status: couponRedemptions.status })
    .from(couponRedemptions)
    .where(and(
      eq(couponRedemptions.couponId, coupon.id),
      eq(couponRedemptions.studentUserId, studentUserId),
      inArray(couponRedemptions.status, ["reserved", "finalized"]),
    ))
    .limit(1);

  if (studentUse?.status === "finalized") {
    throw conflict("Coupon has already been used by this Student.");
  }

  if (studentUse?.status === "reserved") {
    throw conflict("Coupon is already reserved by another pending Checkout.");
  }

  if (!coupon.maxTotalUses) return;

  const activeUses = await countActiveCouponReservations(coupon.id);

  if (activeUses >= coupon.maxTotalUses) {
    throw conflict("Coupon usage limit has been reached.");
  }
}

async function getCheckoutForStudent(checkoutId: string, studentUserId: string) {
  const [checkout] = await db
    .select()
    .from(checkouts)
    .where(eq(checkouts.id, checkoutId))
    .limit(1);

  if (!checkout) {
    throw notFound("Checkout was not found.");
  }

  if (checkout.studentUserId !== studentUserId) {
    throw forbidden("You do not have access to this Checkout.");
  }

  return checkout;
}

async function cancelCheckoutAfterProviderFailure(checkoutId: string) {
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(checkouts)
      .set({
        status: "cancelled",
        cancelledAt: now,
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

function makeCheckoutResult(checkout: typeof checkouts.$inferSelect) {
  return {
    checkoutId: checkout.id,
    status: checkout.status,
    paymentProvider: checkout.paymentProvider,
    invoiceUrl: checkout.xenditInvoiceUrl,
    redirectUrl: checkout.xenditInvoiceUrl ?? makeCheckoutStatusUrl(checkout.id),
    statusUrl: makeCheckoutStatusUrl(checkout.id),
  };
}

function makeCheckoutStatusUrl(checkoutId: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:8090";

  return `${appUrl.replace(/\/+$/, "")}/checkout/${checkoutId}/status`;
}

function makeCouponLabel(coupon: typeof coupons.$inferSelect) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}%`;
  }

  return `Rp${coupon.discountValue.toLocaleString("id-ID")}`;
}

function toProductDto(product: typeof products.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    type: product.type as ProductType,
    description: product.description,
    price: product.price,
    active: product.active,
    durationDays: product.durationDays,
    contentType: product.contentType,
    contentId: product.contentId,
  };
}

function toCheckoutStatusDto(checkout: typeof checkouts.$inferSelect) {
  return {
    id: checkout.id,
    status: checkout.status,
    productName: checkout.productName,
    productType: checkout.productType,
    subtotal: checkout.baseAmount,
    discountAmount: checkout.discountAmount,
    total: checkout.finalAmount,
    invoiceUrl: checkout.xenditInvoiceUrl,
    paidAt: checkout.paidAt?.toISOString() ?? null,
    expiresAt: checkout.expiresAt?.toISOString() ?? null,
    paymentProvider: checkout.paymentProvider,
  };
}

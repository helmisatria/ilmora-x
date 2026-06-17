import assert from "node:assert/strict";
import test from "node:test";
import {
  makeCouponFormDefaults,
  makeCouponSaveInput,
  makeProductFormDefaults,
} from "./admin-payment-form-values";

test("builds Product defaults for Premium Membership", () => {
  const values = makeProductFormDefaults();

  assert.equal(values.type, "premium_membership");
  assert.equal(values.price, "49000");
  assert.equal(values.durationDays, "30");
  assert.equal(values.active, true);
});

test("maps a Lifetime Try-out Purchase Product to form values", () => {
  const values = makeProductFormDefaults({
    id: "product_1",
    name: "Try-out Nasional",
    description: "Lifetime access",
    type: "lifetime_tryout",
    price: 99000,
    active: true,
    durationDays: null,
    contentId: "tryout_1",
  });

  assert.equal(values.type, "lifetime_tryout");
  assert.equal(values.price, "99000");
  assert.equal(values.durationDays, "30");
  assert.equal(values.contentId, "tryout_1");
});

test("builds Coupon defaults with an end date after the start date", () => {
  const values = makeCouponFormDefaults();

  assert.equal(new Date(values.endsAt).getTime() > new Date(values.startsAt).getTime(), true);
});

test("converts Coupon local datetime values to ISO strings for saving", () => {
  const input = makeCouponFormDefaults({
    id: "coupon_1",
    code: "HEMAT",
    discountType: "fixed",
    discountValue: 10000,
    productScope: "all",
    startsAt: "2026-06-15T01:00:00.000Z",
    endsAt: "2026-06-16T01:00:00.000Z",
    maxTotalUses: 10,
    active: true,
  });

  const saveInput = makeCouponSaveInput(input);

  assert.equal(saveInput.startsAt.endsWith("Z"), true);
  assert.equal(saveInput.endsAt.endsWith("Z"), true);
});

test("converts empty Coupon max total uses to null", () => {
  const input = makeCouponFormDefaults();
  const saveInput = makeCouponSaveInput({ ...input, maxTotalUses: "" });

  assert.equal(saveInput.maxTotalUses, null);
});

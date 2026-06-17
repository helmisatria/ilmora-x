import assert from "node:assert/strict";
import test from "node:test";
import { formatCouponUsage } from "./admin-coupon-usage";

test("formats unlimited Coupon usage with zero active usage", () => {
  assert.equal(formatCouponUsage({ activeUses: 0, maxTotalUses: null }), "0 active uses");
});

test("formats unlimited Coupon usage with active usage", () => {
  assert.equal(formatCouponUsage({ activeUses: 3, maxTotalUses: null }), "3 active uses");
});

test("formats capped Coupon usage below the limit", () => {
  assert.equal(formatCouponUsage({ activeUses: 4, maxTotalUses: 10 }), "4 / 10 active uses");
});

test("formats capped Coupon usage at the limit", () => {
  assert.equal(formatCouponUsage({ activeUses: 10, maxTotalUses: 10 }), "10 / 10 active uses");
});

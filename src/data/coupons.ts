import type { ProductType } from "./entitlements";

export interface Coupon {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: ProductType | "all";
  startTime: string;
  endTime: string;
  maxTotalUses: number | null;
  currentUses: number;
  status: "active" | "expired" | "disabled";
}

export const seedCoupons: Coupon[] = [
  { id: 1, code: "WELCOME10", discountType: "percentage", discountValue: 10, appliesTo: "all", startTime: "2026-04-01", endTime: "2026-06-28", maxTotalUses: null, currentUses: 45, status: "active" },
  { id: 2, code: "PREMIUM50", discountType: "fixed", discountValue: 50000, appliesTo: "premium_membership", startTime: "2026-04-01", endTime: "2026-06-01", maxTotalUses: 100, currentUses: 32, status: "active" },
  { id: 3, code: "TRYOUT5K", discountType: "fixed", discountValue: 5000, appliesTo: "lifetime_tryout", startTime: "2026-04-01", endTime: "2026-06-01", maxTotalUses: null, currentUses: 12, status: "active" },
  { id: 4, code: "EXPIRED01", discountType: "percentage", discountValue: 5, appliesTo: "all", startTime: "2026-03-01", endTime: "2026-03-15", maxTotalUses: null, currentUses: 89, status: "expired" },
];

export function applyCoupon(price: number, coupon: Coupon): number {
  if (coupon.discountType === "percentage") {
    return Math.round(price * (1 - coupon.discountValue / 100));
  }
  return Math.max(0, price - coupon.discountValue);
}

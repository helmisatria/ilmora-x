export interface Coupon {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startTime: string;
  endTime: string;
  maxTotalUses: number | null;
  currentUses: number;
  status: "active" | "expired" | "disabled";
}

export const mockCoupons: Coupon[] = [
  { id: 1, code: "WELCOME10", discountType: "percentage", discountValue: 10, startTime: "2026-04-01", endTime: "2026-04-28", maxTotalUses: null, currentUses: 45, status: "active" },
  { id: 2, code: "ILMORAX50", discountType: "fixed", discountValue: 50000, startTime: "2026-04-01", endTime: "2026-05-01", maxTotalUses: 100, currentUses: 32, status: "active" },
  { id: 3, code: "EXPIRED01", discountType: "percentage", discountValue: 5, startTime: "2026-03-01", endTime: "2026-03-15", maxTotalUses: null, currentUses: 89, status: "expired" },
];

export function applyCoupon(price: number, coupon: Coupon): number {
  if (coupon.discountType === "percentage") {
    return Math.round(price * (1 - coupon.discountValue / 100));
  }
  return Math.max(0, price - coupon.discountValue);
}
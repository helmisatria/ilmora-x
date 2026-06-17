type CouponUsageInput = {
  activeUses: number;
  maxTotalUses: number | null;
};

export function formatCouponUsage(coupon: CouponUsageInput) {
  if (!coupon.maxTotalUses) {
    return `${coupon.activeUses} active uses`;
  }

  return `${coupon.activeUses} / ${coupon.maxTotalUses} active uses`;
}

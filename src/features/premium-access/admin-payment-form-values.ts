export type ProductFormValues = {
  id: string;
  name: string;
  description: string;
  type: "premium_membership" | "lifetime_tryout";
  price: string;
  active: boolean;
  durationDays: string;
  contentId: string;
};

export type CouponFormValues = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  productScope: "all" | "premium_membership" | "lifetime_tryout" | "material";
  startsAt: string;
  endsAt: string;
  maxTotalUses: string;
  active: boolean;
};

type ProductFormSource = {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  active: boolean;
  durationDays: number | null;
  contentId: string | null;
};

type CouponFormSource = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  productScope: string;
  startsAt: string;
  endsAt: string;
  maxTotalUses: number | null;
  active: boolean;
};

export const emptyProductFormValues: ProductFormValues = {
  id: "",
  name: "",
  description: "",
  type: "premium_membership",
  price: "49000",
  active: true,
  durationDays: "30",
  contentId: "",
};

export function makeProductFormDefaults(product?: ProductFormSource | null): ProductFormValues {
  if (!product) {
    return emptyProductFormValues;
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type === "lifetime_tryout" ? "lifetime_tryout" : "premium_membership",
    price: String(product.price),
    active: product.active,
    durationDays: product.durationDays ? String(product.durationDays) : "30",
    contentId: product.contentId ?? "",
  };
}

export function makeCouponFormDefaults(coupon?: CouponFormSource | null): CouponFormValues {
  if (coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType === "percentage" ? "percentage" : "fixed",
      discountValue: String(coupon.discountValue),
      productScope: parseCouponProductScope(coupon.productScope),
      startsAt: toDateTimeLocal(coupon.startsAt),
      endsAt: toDateTimeLocal(coupon.endsAt),
      maxTotalUses: coupon.maxTotalUses ? String(coupon.maxTotalUses) : "",
      active: coupon.active,
    };
  }

  const now = new Date();
  const nextMonth = new Date(now);

  nextMonth.setDate(nextMonth.getDate() + 30);

  return {
    id: "",
    code: "",
    discountType: "fixed",
    discountValue: "10000",
    productScope: "all",
    startsAt: toDateTimeLocal(now.toISOString()),
    endsAt: toDateTimeLocal(nextMonth.toISOString()),
    maxTotalUses: "",
    active: true,
  };
}

export function makeProductSaveInput(values: ProductFormValues) {
  return {
    id: values.id || undefined,
    name: values.name,
    description: values.description,
    type: values.type,
    price: Number(values.price),
    active: values.active,
    durationDays: values.type === "premium_membership" ? Number(values.durationDays) : null,
    contentId: values.type === "lifetime_tryout" ? values.contentId : null,
  };
}

export function makeCouponSaveInput(values: CouponFormValues) {
  return {
    id: values.id || undefined,
    code: values.code,
    discountType: values.discountType,
    discountValue: Number(values.discountValue),
    productScope: values.productScope,
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: new Date(values.endsAt).toISOString(),
    maxTotalUses: values.maxTotalUses ? Number(values.maxTotalUses) : null,
    active: values.active,
  };
}

export function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseCouponProductScope(value: string): CouponFormValues["productScope"] {
  if (value === "premium_membership") return value;
  if (value === "lifetime_tryout") return value;
  if (value === "material") return value;

  return "all";
}

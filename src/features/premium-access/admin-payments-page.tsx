import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  deleteCouponAdmin,
  getPaymentAdminData,
  grantEntitlementAdmin,
  saveCouponAdmin,
  saveProductAdmin,
  setCouponActiveAdmin,
  setProductActiveAdmin,
  syncCheckoutWithXenditAdmin,
} from "./admin-payment-functions";
import {
  makeCouponFormDefaults,
  makeCouponSaveInput,
  makeProductFormDefaults,
  makeProductSaveInput,
  type CouponFormValues,
  type ProductFormValues,
} from "./admin-payment-form-values";
import { CheckoutTable, CouponTable, EntitlementTable, ProductTable } from "./admin-payment-tables";

type PaymentAdminData = Awaited<ReturnType<typeof getPaymentAdminData>>;
type ProductRow = PaymentAdminData["products"][number];
type CouponRow = PaymentAdminData["coupons"][number];
type GrantFormValues = {
  studentUserId: string;
  productId: string;
  reason: string;
};
type ProductFormErrors = Partial<Record<keyof ProductFormValues | "root", string>>;

const productFormSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required.").max(180, "Name must be 180 characters or fewer."),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer."),
  type: z.enum(["premium_membership", "lifetime_tryout"]),
  price: z.string().trim().min(1, "Price is required."),
  active: z.boolean(),
  durationDays: z.string().trim(),
  contentId: z.string().trim(),
}).superRefine((values, context) => {
  if (!isIntegerText(values.price) || Number(values.price) < 0) {
    context.addIssue({
      code: "custom",
      message: "Price must be a whole number.",
      path: ["price"],
    });
  }

  if (values.type === "premium_membership" && (!isIntegerText(values.durationDays) || Number(values.durationDays) < 1)) {
    context.addIssue({
      code: "custom",
      message: "Duration must be at least 1 day.",
      path: ["durationDays"],
    });
  }

  if (values.type === "lifetime_tryout" && !values.contentId) {
    context.addIssue({
      code: "custom",
      message: "Choose the Try-out this Product unlocks.",
      path: ["contentId"],
    });
  }
});

const couponFormSchema = z.object({
  id: z.string(),
  code: z.string().trim().min(1, "Code is required.").max(80, "Code must be 80 characters or fewer."),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().trim().min(1, "Discount value is required."),
  productScope: z.enum(["all", "premium_membership", "lifetime_tryout", "material"]),
  startsAt: z.string().trim().min(1, "Start time is required."),
  endsAt: z.string().trim().min(1, "End time is required."),
  maxTotalUses: z.string().trim(),
  active: z.boolean(),
}).superRefine((values, context) => {
  const discountValue = Number(values.discountValue);

  if (!isIntegerText(values.discountValue)) {
    context.addIssue({
      code: "custom",
      message: "Discount value must be a whole number.",
      path: ["discountValue"],
    });
  } else if (values.discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
    context.addIssue({
      code: "custom",
      message: "Percentage must be from 1 to 100.",
      path: ["discountValue"],
    });
  } else if (values.discountType === "fixed" && discountValue < 1) {
    context.addIssue({
      code: "custom",
      message: "Fixed discount must be at least 1.",
      path: ["discountValue"],
    });
  }

  if (!isValidDateTimeText(values.startsAt)) {
    context.addIssue({
      code: "custom",
      message: "Start time must be valid.",
      path: ["startsAt"],
    });
  }

  if (!isValidDateTimeText(values.endsAt)) {
    context.addIssue({
      code: "custom",
      message: "End time must be valid.",
      path: ["endsAt"],
    });
  }

  if (isValidDateTimeText(values.startsAt) && isValidDateTimeText(values.endsAt)) {
    const startsAt = new Date(values.startsAt);
    const endsAt = new Date(values.endsAt);

    if (endsAt <= startsAt) {
      context.addIssue({
        code: "custom",
        message: "End time must be after start time.",
        path: ["endsAt"],
      });
    }
  }

  if (values.maxTotalUses && (!isIntegerText(values.maxTotalUses) || Number(values.maxTotalUses) < 1)) {
    context.addIssue({
      code: "custom",
      message: "Max total uses must be empty or at least 1.",
      path: ["maxTotalUses"],
    });
  }
});

const grantFormSchema = z.object({
  studentUserId: z.string().trim().min(1, "Student is required."),
  productId: z.string().trim().min(1, "Product is required."),
  reason: z.string().trim().min(1, "Reason is required.").max(500, "Reason must be 500 characters or fewer."),
});

export function AdminPaymentsPage({ data }: { data: PaymentAdminData }) {
  const router = useRouter();
  const routerRef = useRef(router);
  const [productDialogProduct, setProductDialogProduct] = useState<ProductRow | null>(null);
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);
  const [couponDialogCoupon, setCouponDialogCoupon] = useState<CouponRow | null>(null);
  const [isCouponDialogOpen, setCouponDialogOpen] = useState(false);
  const [isGrantDialogOpen, setGrantDialogOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const paidTryouts = useMemo(
    () => data.tryouts.filter((tryout) => tryout.accessLevel === "premium"),
    [data.tryouts],
  );

  routerRef.current = router;

  const refresh = useCallback(async () => {
    await routerRef.current.invalidate();
  }, []);

  const openProductDialog = useCallback((product: ProductRow | null) => {
    setProductDialogProduct(product);
    setProductDialogOpen(true);
  }, []);

  const openCouponDialog = useCallback((coupon: CouponRow | null) => {
    setCouponDialogCoupon(coupon);
    setCouponDialogOpen(true);
  }, []);

  const closeProductDialog = useCallback(() => {
    setProductDialogOpen(false);
    setProductDialogProduct(null);
  }, []);

  const closeCouponDialog = useCallback(() => {
    setCouponDialogOpen(false);
    setCouponDialogCoupon(null);
  }, []);

  const saveProduct = useCallback(async (values: ProductFormValues) => {
    setBusyAction("product");

    try {
      await saveProductAdmin({
        data: makeProductSaveInput(values),
      });
      toast.success("Product saved.");
      void refresh().catch(() => {
        toast.error("Product saved, but the table was not refreshed.");
      });
      return true;
    } catch {
      toast.error("Product was not saved. Check the required fields.");
      return false;
    } finally {
      setBusyAction("");
    }
  }, [refresh]);

  const saveCoupon = useCallback(async (values: CouponFormValues) => {
    setBusyAction("coupon");

    try {
      await saveCouponAdmin({
        data: makeCouponSaveInput(values),
      });
      toast.success("Coupon saved.");
      await refresh();
      return true;
    } catch {
      toast.error("Coupon was not saved. Check code, value, and validity window.");
      return false;
    } finally {
      setBusyAction("");
    }
  }, [refresh]);

  const grantAccess = useCallback(async (values: GrantFormValues) => {
    setBusyAction("grant");

    try {
      await grantEntitlementAdmin({
        data: {
          studentUserId: values.studentUserId,
          productId: values.productId,
          reason: values.reason,
        },
      });
      toast.success("Access granted.");
      await refresh();
      return true;
    } catch {
      toast.error("Access was not granted.");
      return false;
    } finally {
      setBusyAction("");
    }
  }, [refresh]);

  const syncCheckout = useCallback(async (checkoutId: string) => {
    setBusyAction(`sync:${checkoutId}`);

    try {
      const result = await syncCheckoutWithXenditAdmin({ data: { checkoutId } });

      toast.info(`Checkout sync result: ${result.result}`);
      await refresh();
    } catch {
      toast.error("Checkout was not synced.");
    } finally {
      setBusyAction("");
    }
  }, [refresh]);

  const deleteCoupon = useCallback(async (coupon: CouponRow) => {
    if (!window.confirm(`Remove coupon ${coupon.code}? This only works when the coupon has no checkout history.`)) {
      return;
    }

    setBusyAction(`delete-coupon:${coupon.id}`);

    try {
      await deleteCouponAdmin({ data: { couponId: coupon.id } });
      closeCouponDialog();
      toast.success("Coupon removed.");
      await refresh();
    } catch {
      toast.error("Coupon was not removed. Disable it if it already has checkout history.");
    } finally {
      setBusyAction("");
    }
  }, [closeCouponDialog, refresh]);

  const toggleProduct = useCallback(async (product: ProductRow) => {
    await setProductActiveAdmin({ data: { productId: product.id, active: !product.active } });
    await refresh();
  }, [refresh]);

  const toggleCoupon = useCallback(async (coupon: CouponRow) => {
    await setCouponActiveAdmin({ data: { couponId: coupon.id, active: !coupon.active } });
    await refresh();
  }, [refresh]);

  const handleProductOpenChange = useCallback((open: boolean) => {
    if (open) {
      setProductDialogOpen(true);
      return;
    }

    closeProductDialog();
  }, [closeProductDialog]);

  const handleCouponOpenChange = useCallback((open: boolean) => {
    if (open) {
      setCouponDialogOpen(true);
      return;
    }

    closeCouponDialog();
  }, [closeCouponDialog]);

  const couponTableBusyAction = busyAction.startsWith("delete-coupon:") ? busyAction : "";
  const checkoutTableBusyAction = busyAction.startsWith("sync:") ? busyAction : "";

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Payments</h1>
          <p className="admin-description">
            Manage Products, Coupons, manual access grants, and Xendit Checkout repair.
          </p>
        </header>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Product</h2>
            <button
              className="admin-button-primary"
              onClick={() => openProductDialog(null)}
              type="button"
            >
              Create Product
            </button>
          </div>
          <ProductTable products={data.products} tryouts={data.tryouts} onEdit={openProductDialog} onToggle={toggleProduct} />
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Coupon</h2>
            <button
              className="admin-button-primary"
              onClick={() => openCouponDialog(null)}
              type="button"
            >
              Create Coupon
            </button>
          </div>
          <CouponTable
            busyAction={couponTableBusyAction}
            coupons={data.coupons}
            onDelete={deleteCoupon}
            onEdit={openCouponDialog}
            onToggle={toggleCoupon}
          />
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Manual Grant</h2>
            <button className="admin-button-primary" onClick={() => setGrantDialogOpen(true)} type="button">
              Grant Access
            </button>
          </div>
          <div className="p-5 text-sm font-semibold text-stone-500 sm:p-6">
            Use Manual Grant for explicit support actions with an audit reason.
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Recent Checkouts</h2>
          </div>
          <CheckoutTable checkouts={data.checkouts} busyAction={checkoutTableBusyAction} onSync={syncCheckout} />
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Recent Entitlements</h2>
          </div>
          <EntitlementTable entitlements={data.entitlements} />
        </section>

        <ProductDialog
          busy={busyAction === "product"}
          open={isProductDialogOpen}
          product={productDialogProduct}
          paidTryouts={paidTryouts}
          onOpenChange={handleProductOpenChange}
          onSave={saveProduct}
        />

        <CouponDialog
          busy={busyAction === "coupon"}
          coupon={couponDialogCoupon}
          open={isCouponDialogOpen}
          onOpenChange={handleCouponOpenChange}
          onSave={saveCoupon}
        />

        <GrantAccessDialog
          busy={busyAction === "grant"}
          open={isGrantDialogOpen}
          products={data.products}
          students={data.students}
          onOpenChange={setGrantDialogOpen}
          onGrant={grantAccess}
        />
      </div>
    </main>
  );
}

function ProductDialog({
  busy,
  open,
  product,
  paidTryouts,
  onOpenChange,
  onSave,
}: {
  busy: boolean;
  open: boolean;
  product: ProductRow | null;
  paidTryouts: PaymentAdminData["tryouts"];
  onOpenChange: (open: boolean) => void;
  onSave: (values: ProductFormValues) => Promise<boolean>;
}) {
  const defaultValues = useMemo(() => makeProductFormDefaults(product), [product]);
  const [values, setValues] = useState<ProductFormValues>(defaultValues);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const productType = values.type;

  useEffect(() => {
    if (!open) return;

    setValues(defaultValues);
    setErrors({});
  }, [defaultValues, open]);

  const updateField = <TField extends keyof ProductFormValues>(
    field: TField,
    value: ProductFormValues[TField],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setErrors((currentErrors) => clearProductFieldError(currentErrors, field));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    const result = productFormSchema.safeParse(values);

    if (!result.success) {
      setErrors(makeProductFormErrors(result.error.issues));
      return;
    }

    const saved = await onSave(result.data);

    if (saved) {
      onOpenChange(false);
      return;
    }

    setErrors({
      root: "Product was not saved. Check the fields and try again.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,760px)] max-w-[min(94vw,760px)]">
        <form className="flex min-h-0 flex-col" onSubmit={submit}>
          <DialogHeader className="border-b-2 border-stone-100 px-5 py-4 sm:px-6">
            <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              Configure the paid access Product shown to Students.
            </DialogDescription>
          </DialogHeader>

        <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <input
                className="admin-control"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </Field>
            <Field label="Type" error={errors.type}>
              <select
                className="admin-control"
                value={values.type}
                onChange={(event) => updateField("type", event.target.value as ProductFormValues["type"])}
              >
                <option value="premium_membership">Premium Membership</option>
                <option value="lifetime_tryout">Lifetime Try-out Purchase</option>
              </select>
            </Field>
          </div>

          <Field label="Description" error={errors.description}>
            <textarea
              className="admin-control min-h-20"
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Price" error={errors.price}>
              <input
                className="admin-control"
                inputMode="numeric"
                value={values.price}
                onChange={(event) => updateField("price", event.target.value)}
              />
            </Field>

            {productType === "premium_membership" ? (
              <Field label="Duration days" error={errors.durationDays}>
                <input
                  className="admin-control"
                  inputMode="numeric"
                  value={values.durationDays}
                  onChange={(event) => updateField("durationDays", event.target.value)}
                />
              </Field>
            ) : (
              <Field label="Try-out target" error={errors.contentId}>
                <select
                  className="admin-control"
                  value={values.contentId}
                  onChange={(event) => updateField("contentId", event.target.value)}
                >
                  <option value="">Select Try-out</option>
                  {paidTryouts.map((tryout) => (
                    <option key={tryout.id} value={tryout.id}>{tryout.title}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Status">
              <label className="flex h-12 items-center gap-2 rounded-[var(--radius-md)] border-2 border-stone-100 px-3 text-sm font-bold text-stone-600">
                <input
                  checked={values.active}
                  onChange={(event) => updateField("active", event.target.checked)}
                  type="checkbox"
                />
                Active
              </label>
            </Field>
          </div>

          {errors.root && (
            <p className="rounded-[var(--radius-md)] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {errors.root}
            </p>
          )}
        </div>

          <DialogFooter className="border-t-2 border-stone-100 px-5 py-4 sm:px-6">
          <button className="admin-button-secondary" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </button>
          <button className="admin-button-primary" disabled={busy} type="submit">
            {product ? "Update Product" : "Create Product"}
          </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CouponDialog({
  busy,
  coupon,
  open,
  onOpenChange,
  onSave,
}: {
  busy: boolean;
  coupon: CouponRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CouponFormValues) => Promise<boolean>;
}) {
  const defaultValues = useMemo(() => makeCouponFormDefaults(coupon), [coupon]);
  const form = useForm<CouponFormValues>({
    defaultValues,
  });
  const resetRef = useRef(form.reset);

  resetRef.current = form.reset;

  useEffect(() => {
    if (!open) return;

    resetRef.current(defaultValues);
  }, [defaultValues, open]);

  const submit = form.handleSubmit(async (values) => {
    const result = couponFormSchema.safeParse(values);

    if (!result.success) {
      applyFormErrors(form.setError, result.error.issues);
      return;
    }

    const saved = await onSave(result.data);

    if (saved) {
      onOpenChange(false);
      return;
    }

    form.setError("root", {
      message: "Coupon was not saved. Check the fields and try again.",
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,840px)] max-w-[min(94vw,840px)]">
        <form className="flex min-h-0 flex-col" onSubmit={submit}>
          <DialogHeader className="border-b-2 border-stone-100 px-5 py-4 sm:px-6">
            <DialogTitle>{coupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
            <DialogDescription>
              Configure Coupon eligibility, value, usage cap, and validity window.
            </DialogDescription>
          </DialogHeader>

        <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-4">
            <Field label="Code" error={form.formState.errors.code?.message}>
              <input className="admin-control uppercase" {...form.register("code")} />
            </Field>
            <Field label="Discount type" error={form.formState.errors.discountType?.message}>
              <select className="admin-control" {...form.register("discountType")}>
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
            </Field>
            <Field label="Discount value" error={form.formState.errors.discountValue?.message}>
              <input className="admin-control" inputMode="numeric" {...form.register("discountValue")} />
            </Field>
            <Field label="Product scope" error={form.formState.errors.productScope?.message}>
              <select className="admin-control" {...form.register("productScope")}>
                <option value="all">All paid products</option>
                <option value="premium_membership">Premium Membership</option>
                <option value="lifetime_tryout">Lifetime Try-out Purchase</option>
                <option value="material">Materi</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <Field label="Starts at" error={form.formState.errors.startsAt?.message}>
              <input className="admin-control" type="datetime-local" {...form.register("startsAt")} />
            </Field>
            <Field label="Ends at" error={form.formState.errors.endsAt?.message}>
              <input className="admin-control" type="datetime-local" {...form.register("endsAt")} />
            </Field>
            <Field label="Max total uses" error={form.formState.errors.maxTotalUses?.message}>
              <input className="admin-control" inputMode="numeric" placeholder="Unlimited" {...form.register("maxTotalUses")} />
            </Field>
            <Field label="Status">
              <label className="flex h-12 items-center gap-2 rounded-[var(--radius-md)] border-2 border-stone-100 px-3 text-sm font-bold text-stone-600">
                <input type="checkbox" {...form.register("active")} />
                Active
              </label>
            </Field>
          </div>

          {form.formState.errors.root?.message && (
            <p className="rounded-[var(--radius-md)] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>

          <DialogFooter className="border-t-2 border-stone-100 px-5 py-4 sm:px-6">
          <button className="admin-button-secondary" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </button>
          <button className="admin-button-primary" disabled={busy || form.formState.isSubmitting} type="submit">
            {coupon ? "Update Coupon" : "Create Coupon"}
          </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GrantAccessDialog({
  busy,
  open,
  products,
  students,
  onOpenChange,
  onGrant,
}: {
  busy: boolean;
  open: boolean;
  products: PaymentAdminData["products"];
  students: PaymentAdminData["students"];
  onOpenChange: (open: boolean) => void;
  onGrant: (values: GrantFormValues) => Promise<boolean>;
}) {
  const defaultValues = useMemo(
    () => ({
      studentUserId: students[0]?.userId ?? "",
      productId: products[0]?.id ?? "",
      reason: "",
    }),
    [products, students],
  );
  const form = useForm<GrantFormValues>({
    defaultValues,
  });
  const resetRef = useRef(form.reset);

  resetRef.current = form.reset;

  useEffect(() => {
    if (!open) return;

    resetRef.current(defaultValues);
  }, [defaultValues, open]);

  const submit = form.handleSubmit(async (values) => {
    const result = grantFormSchema.safeParse(values);

    if (!result.success) {
      applyFormErrors(form.setError, result.error.issues);
      return;
    }

    const granted = await onGrant(result.data);

    if (granted) {
      onOpenChange(false);
      resetRef.current(defaultValues);
      return;
    }

    form.setError("root", {
      message: "Access was not granted. Check the fields and try again.",
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,720px)] max-w-[min(94vw,720px)]">
        <form className="flex min-h-0 flex-col" onSubmit={submit}>
          <DialogHeader className="border-b-2 border-stone-100 px-5 py-4 sm:px-6">
            <DialogTitle>Grant Access</DialogTitle>
            <DialogDescription>
              Create an explicit manual Entitlement with an audit reason.
            </DialogDescription>
          </DialogHeader>

        <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Student" error={form.formState.errors.studentUserId?.message}>
              <select className="admin-control" {...form.register("studentUserId")}>
                {students.map((student) => (
                  <option key={student.userId} value={student.userId}>{student.name} ({student.email})</option>
                ))}
              </select>
            </Field>
            <Field label="Product" error={form.formState.errors.productId?.message}>
              <select className="admin-control" {...form.register("productId")}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <textarea
              className="admin-control min-h-24"
              placeholder="Offline payment confirmed"
              {...form.register("reason")}
            />
          </Field>

          {form.formState.errors.root?.message && (
            <p className="rounded-[var(--radius-md)] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>

          <DialogFooter className="border-t-2 border-stone-100 px-5 py-4 sm:px-6">
          <button className="admin-button-secondary" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </button>
          <button className="admin-button-primary" disabled={busy || form.formState.isSubmitting} type="submit">
            Grant Access
          </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
      {error && <span className="mt-2 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  );
}

function isIntegerText(value: string) {
  const parsedValue = Number(value.trim());

  return Number.isInteger(parsedValue);
}

function isValidDateTimeText(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function makeProductFormErrors(issues: z.ZodIssue[]) {
  const errors: ProductFormErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field !== "string") continue;

    errors[field as keyof ProductFormValues] = issue.message;
  }

  return errors;
}

function clearProductFieldError(errors: ProductFormErrors, field: keyof ProductFormValues) {
  if (!errors[field] && !errors.root) {
    return errors;
  }

  const nextErrors = { ...errors };

  delete nextErrors[field];
  delete nextErrors.root;

  return nextErrors;
}

function applyFormErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  issues: z.ZodIssue[],
) {
  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field !== "string") continue;

    setError(field as Path<TFieldValues>, {
      message: issue.message,
    });
  }
}

import { useRouter } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
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

type PaymentAdminData = Awaited<ReturnType<typeof getPaymentAdminData>>;
type ProductRow = PaymentAdminData["products"][number];
type CouponRow = PaymentAdminData["coupons"][number];

type ProductForm = {
  id: string;
  name: string;
  description: string;
  type: "premium_membership" | "lifetime_tryout";
  price: string;
  active: boolean;
  durationDays: string;
  contentId: string;
};

type CouponForm = {
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

const emptyProductForm: ProductForm = {
  id: "",
  name: "",
  description: "",
  type: "premium_membership",
  price: "49000",
  active: true,
  durationDays: "30",
  contentId: "",
};

export function AdminPaymentsPage({ data }: { data: PaymentAdminData }) {
  const router = useRouter();
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [couponForm, setCouponForm] = useState<CouponForm>(() => makeEmptyCouponForm());
  const [grantStudentId, setGrantStudentId] = useState(data.students[0]?.userId ?? "");
  const [grantProductId, setGrantProductId] = useState(data.products[0]?.id ?? "");
  const [grantReason, setGrantReason] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const paidTryouts = useMemo(
    () => data.tryouts.filter((tryout) => tryout.accessLevel === "premium"),
    [data.tryouts],
  );

  const refresh = async () => {
    await router.invalidate();
  };

  const saveProduct = async () => {
    setBusyAction("product");

    try {
      await saveProductAdmin({
        data: {
          id: productForm.id || undefined,
          name: productForm.name,
          description: productForm.description,
          type: productForm.type,
          price: Number(productForm.price),
          active: productForm.active,
          durationDays: productForm.type === "premium_membership" ? Number(productForm.durationDays) : null,
          contentId: productForm.type === "lifetime_tryout" ? productForm.contentId : null,
        },
      });
      setProductForm(emptyProductForm);
      toast.success("Product saved.");
      await refresh();
    } catch {
      toast.error("Product was not saved. Check the required fields.");
    } finally {
      setBusyAction("");
    }
  };

  const saveCoupon = async () => {
    setBusyAction("coupon");

    try {
      await saveCouponAdmin({
        data: {
          id: couponForm.id || undefined,
          code: couponForm.code,
          discountType: couponForm.discountType,
          discountValue: Number(couponForm.discountValue),
          productScope: couponForm.productScope,
          startsAt: new Date(couponForm.startsAt).toISOString(),
          endsAt: new Date(couponForm.endsAt).toISOString(),
          maxTotalUses: couponForm.maxTotalUses ? Number(couponForm.maxTotalUses) : null,
          active: couponForm.active,
        },
      });
      setCouponForm(makeEmptyCouponForm());
      toast.success("Coupon saved.");
      await refresh();
    } catch {
      toast.error("Coupon was not saved. Check code, value, and validity window.");
    } finally {
      setBusyAction("");
    }
  };

  const grantAccess = async () => {
    if (!grantStudentId || !grantProductId || !grantReason.trim()) return;

    setBusyAction("grant");

    try {
      await grantEntitlementAdmin({
        data: {
          studentUserId: grantStudentId,
          productId: grantProductId,
          reason: grantReason,
        },
      });
      setGrantReason("");
      toast.success("Access granted.");
      await refresh();
    } catch {
      toast.error("Access was not granted.");
    } finally {
      setBusyAction("");
    }
  };

  const syncCheckout = async (checkoutId: string) => {
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
  };

  const deleteCoupon = async (coupon: CouponRow) => {
    if (!window.confirm(`Remove coupon ${coupon.code}? This only works when the coupon has no checkout history.`)) {
      return;
    }

    setBusyAction(`delete-coupon:${coupon.id}`);

    try {
      await deleteCouponAdmin({ data: { couponId: coupon.id } });
      if (couponForm.id === coupon.id) {
        setCouponForm(makeEmptyCouponForm());
      }
      toast.success("Coupon removed.");
      await refresh();
    } catch {
      toast.error("Coupon was not removed. Disable it if it already has checkout history.");
    } finally {
      setBusyAction("");
    }
  };

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
          </div>
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Name">
                <input className="admin-control" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
              </Field>
              <Field label="Type">
                <select className="admin-control" value={productForm.type} onChange={(event) => setProductForm({ ...productForm, type: event.target.value as ProductForm["type"] })}>
                  <option value="premium_membership">Premium Membership</option>
                  <option value="lifetime_tryout">Lifetime Try-out Purchase</option>
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea className="admin-control min-h-20" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
            </Field>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Price">
                <input className="admin-control" inputMode="numeric" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
              </Field>
              {productForm.type === "premium_membership" ? (
                <Field label="Duration days">
                  <input className="admin-control" inputMode="numeric" value={productForm.durationDays} onChange={(event) => setProductForm({ ...productForm, durationDays: event.target.value })} />
                </Field>
              ) : (
                <Field label="Try-out target">
                  <select className="admin-control" value={productForm.contentId} onChange={(event) => setProductForm({ ...productForm, contentId: event.target.value })}>
                    <option value="">Select Try-out</option>
                    {paidTryouts.map((tryout) => (
                      <option key={tryout.id} value={tryout.id}>{tryout.title}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Status">
                <label className="flex h-12 items-center gap-2 rounded-[var(--radius-md)] border-2 border-stone-100 px-3 text-sm font-bold text-stone-600">
                  <input checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} type="checkbox" />
                  Active
                </label>
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="admin-button-primary" disabled={busyAction === "product"} onClick={saveProduct} type="button">
                {productForm.id ? "Update Product" : "Create Product"}
              </button>
              {productForm.id && (
                <button className="admin-button-secondary" onClick={() => setProductForm(emptyProductForm)} type="button">
                  Clear
                </button>
              )}
            </div>
          </div>
          <ProductList products={data.products} onEdit={setProductForm} onToggle={async (product) => {
            await setProductActiveAdmin({ data: { productId: product.id, active: !product.active } });
            await refresh();
          }} />
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Coupon</h2>
          </div>
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-4">
              <Field label="Code">
                <input className="admin-control uppercase" value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })} />
              </Field>
              <Field label="Discount type">
                <select className="admin-control" value={couponForm.discountType} onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value as CouponForm["discountType"] })}>
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </Field>
              <Field label="Discount value">
                <input className="admin-control" inputMode="numeric" value={couponForm.discountValue} onChange={(event) => setCouponForm({ ...couponForm, discountValue: event.target.value })} />
              </Field>
              <Field label="Product scope">
                <select className="admin-control" value={couponForm.productScope} onChange={(event) => setCouponForm({ ...couponForm, productScope: event.target.value as CouponForm["productScope"] })}>
                  <option value="all">All paid products</option>
                  <option value="premium_membership">Premium Membership</option>
                  <option value="lifetime_tryout">Lifetime Try-out Purchase</option>
                  <option value="material">Materi</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              <Field label="Starts at">
                <input className="admin-control" type="datetime-local" value={couponForm.startsAt} onChange={(event) => setCouponForm({ ...couponForm, startsAt: event.target.value })} />
              </Field>
              <Field label="Ends at">
                <input className="admin-control" type="datetime-local" value={couponForm.endsAt} onChange={(event) => setCouponForm({ ...couponForm, endsAt: event.target.value })} />
              </Field>
              <Field label="Max total uses">
                <input className="admin-control" inputMode="numeric" placeholder="Unlimited" value={couponForm.maxTotalUses} onChange={(event) => setCouponForm({ ...couponForm, maxTotalUses: event.target.value })} />
              </Field>
              <Field label="Status">
                <label className="flex h-12 items-center gap-2 rounded-[var(--radius-md)] border-2 border-stone-100 px-3 text-sm font-bold text-stone-600">
                  <input checked={couponForm.active} onChange={(event) => setCouponForm({ ...couponForm, active: event.target.checked })} type="checkbox" />
                  Active
                </label>
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="admin-button-primary" disabled={busyAction === "coupon"} onClick={saveCoupon} type="button">
                {couponForm.id ? "Update Coupon" : "Create Coupon"}
              </button>
              {couponForm.id && (
                <button className="admin-button-secondary" onClick={() => setCouponForm(makeEmptyCouponForm())} type="button">
                  Clear
                </button>
              )}
            </div>
          </div>
          <CouponList coupons={data.coupons} onEdit={(coupon) => setCouponForm(couponToForm(coupon))} onToggle={async (coupon) => {
            await setCouponActiveAdmin({ data: { couponId: coupon.id, active: !coupon.active } });
            await refresh();
          }} onDelete={deleteCoupon} busyAction={busyAction} />
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Manual Grant</h2>
          </div>
          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end">
            <Field label="Student">
              <select className="admin-control" value={grantStudentId} onChange={(event) => setGrantStudentId(event.target.value)}>
                {data.students.map((student) => (
                  <option key={student.userId} value={student.userId}>{student.name} ({student.email})</option>
                ))}
              </select>
            </Field>
            <Field label="Product">
              <select className="admin-control" value={grantProductId} onChange={(event) => setGrantProductId(event.target.value)}>
                {data.products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <input className="admin-control" value={grantReason} onChange={(event) => setGrantReason(event.target.value)} placeholder="Offline payment confirmed" />
            </Field>
            <button className="admin-button-primary h-12" disabled={busyAction === "grant"} onClick={grantAccess} type="button">
              Grant
            </button>
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Recent Checkouts</h2>
          </div>
          <div>
            {data.checkouts.map((checkout) => (
              <div key={checkout.id} className="admin-list-row">
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-800">{checkout.productName}</h3>
                    <StatusPill label={checkout.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">Rp{checkout.total.toLocaleString("id-ID")} · {checkout.couponCode || "No coupon"}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-400">{checkout.id}</p>
                </div>
                <div className="admin-list-actions">
                  <span className="admin-meta-tag">{formatDateTime(checkout.createdAt)}</span>
                  <button className="admin-button-ghost text-primary hover:bg-primary-tint" disabled={!checkout.xenditInvoiceId || busyAction === `sync:${checkout.id}`} onClick={() => syncCheckout(checkout.id)} type="button">
                    Sync Xendit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Recent Entitlements</h2>
          </div>
          <div>
            {data.entitlements.map((entitlement) => (
              <div key={entitlement.id} className="admin-list-row">
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-800">{entitlement.productType}</h3>
                    <StatusPill label={entitlement.source} />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {entitlement.contentType ? `${entitlement.contentType}:${entitlement.contentId}` : "Global access"}
                  </p>
                  {entitlement.grantReason && <p className="mt-1 text-xs font-semibold text-stone-400">{entitlement.grantReason}</p>}
                </div>
                <div className="admin-list-actions">
                  <span className="admin-meta-tag">{formatDateTime(entitlement.startsAt)}</span>
                  <span className="admin-meta-tag">{entitlement.endsAt ? `Until ${formatDateTime(entitlement.endsAt)}` : "Lifetime"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductList({
  products,
  onEdit,
  onToggle,
}: {
  products: ProductRow[];
  onEdit: (form: ProductForm) => void;
  onToggle: (product: ProductRow) => void;
}) {
  return (
    <div>
      {products.map((product) => (
        <div key={product.id} className="admin-list-row">
          <div className="admin-list-content">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[15px] font-bold text-stone-800">{product.name}</h3>
              <StatusPill label={product.active ? "active" : "inactive"} />
              <StatusPill label={product.type} />
            </div>
            <p className="mt-1 text-sm text-stone-500">Rp{product.price.toLocaleString("id-ID")} · {product.description}</p>
          </div>
          <div className="admin-list-actions">
            <button className="admin-button-ghost text-primary hover:bg-primary-tint" onClick={() => onEdit(productToForm(product))} type="button">Edit</button>
            <button className="admin-button-ghost text-amber-600 hover:bg-amber-50" onClick={() => onToggle(product)} type="button">
              {product.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CouponList({
  coupons,
  onEdit,
  onToggle,
  onDelete,
  busyAction,
}: {
  coupons: CouponRow[];
  onEdit: (coupon: CouponRow) => void;
  onToggle: (coupon: CouponRow) => void;
  onDelete: (coupon: CouponRow) => void;
  busyAction: string;
}) {
  return (
    <div>
      {coupons.map((coupon) => (
        <div key={coupon.id} className="admin-list-row">
          <div className="admin-list-content">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[15px] font-bold text-stone-800">{coupon.code}</h3>
              <StatusPill label={coupon.active ? "active" : "inactive"} />
              <StatusPill label={coupon.productScope} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `Rp${coupon.discountValue.toLocaleString("id-ID")}`} · {formatDateTime(coupon.startsAt)} - {formatDateTime(coupon.endsAt)}
            </p>
          </div>
          <div className="admin-list-actions">
            <button className="admin-button-ghost text-primary hover:bg-primary-tint" onClick={() => onEdit(coupon)} type="button">Edit</button>
            <button className="admin-button-ghost text-amber-600 hover:bg-amber-50" onClick={() => onToggle(coupon)} type="button">
              {coupon.active ? "Disable" : "Enable"}
            </button>
            <button
              className="admin-button-ghost text-rose-600 hover:bg-rose-50"
              disabled={busyAction === `delete-coupon:${coupon.id}`}
              onClick={() => onDelete(coupon)}
              type="button"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="admin-status-pill border-stone-200 bg-stone-100 text-stone-600">
      {label.replaceAll("_", " ")}
    </span>
  );
}

function productToForm(product: ProductRow): ProductForm {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type as ProductForm["type"],
    price: String(product.price),
    active: product.active,
    durationDays: product.durationDays ? String(product.durationDays) : "30",
    contentId: product.contentId ?? "",
  };
}

function couponToForm(coupon: CouponRow): CouponForm {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType as CouponForm["discountType"],
    discountValue: String(coupon.discountValue),
    productScope: coupon.productScope as CouponForm["productScope"],
    startsAt: toDateTimeLocal(coupon.startsAt),
    endsAt: toDateTimeLocal(coupon.endsAt),
    maxTotalUses: coupon.maxTotalUses ? String(coupon.maxTotalUses) : "",
    active: coupon.active,
  };
}

function makeEmptyCouponForm(): CouponForm {
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

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

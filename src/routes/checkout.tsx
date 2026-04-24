import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { z } from "zod";
import { TopBar } from "../components/Navigation";
import { applyCoupon, mockCoupons, mockUsers, packages, useApp } from "../data";

const searchSchema = z.object({
  packageId: z.number().optional(),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout Premium — IlmoraX" },
      { name: "description", content: "Selesaikan pembelian paket Premium IlmoraX. Pilih metode pembayaran, gunakan kode promo atau referral, dan aktifkan akses premium." },
      { property: "og:title", content: "Checkout Premium — IlmoraX" },
      { property: "og:description", content: "Selesaikan pembelian paket Premium IlmoraX. Pilih metode pembayaran dan gunakan kode promo." },
    ],
  }),
  component: CheckoutComponent,
  validateSearch: searchSchema,
});

type DiscountState =
  | { type: "none" }
  | { type: "coupon"; code: string; amount: number; label: string }
  | { type: "referral"; code: string; amount: number; label: string; referrerName: string }
  | { type: "invalid"; reason: string };

type PaymentMethod = "xendit" | "midtrans" | "transfer";

const premiumAccent = "#f5b544";

const paymentMethods: Array<{
  key: PaymentMethod;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  { key: "xendit", label: "Xendit", description: "VA, e-wallet, QRIS", icon: <CardIcon /> },
  { key: "midtrans", label: "Midtrans", description: "Transfer dan kartu kredit", icon: <WalletIcon /> },
  { key: "transfer", label: "Transfer Bank", description: "BCA, Mandiri, BNI", icon: <BankIcon /> },
];

function CheckoutComponent() {
  const { packageId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const pkg = packages.find((item) => item.id === packageId) ?? packages[0];
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<DiscountState>({ type: "none" });
  const [method, setMethod] = useState<PaymentMethod>("xendit");
  const [processing, setProcessing] = useState(false);

  const subtotal = pkg.price;
  const discountAmount = discount.type === "coupon" || discount.type === "referral" ? discount.amount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCode = () => {
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setDiscount({ type: "none" });
      return;
    }

    const coupon = mockCoupons.find((item) => item.code.toUpperCase() === trimmedCode);

    if (coupon) {
      if (coupon.status !== "active") {
        setDiscount({ type: "invalid", reason: "Kupon ini sudah tidak aktif" });
        return;
      }

      const discountedTotal = applyCoupon(subtotal, coupon);
      const amount = subtotal - discountedTotal;
      const label =
        coupon.discountType === "percentage"
          ? `Diskon ${coupon.discountValue}%`
          : `Diskon Rp${coupon.discountValue.toLocaleString("id-ID")}`;

      setDiscount({ type: "coupon", code: coupon.code, amount, label });
      return;
    }

    const referrer = mockUsers.find((item) => item.referralCode.toUpperCase() === trimmedCode);

    if (!referrer) {
      setDiscount({ type: "invalid", reason: "Kode tidak ditemukan" });
      return;
    }

    if (referrer.id === user.id) {
      setDiscount({ type: "invalid", reason: "Tidak bisa pakai kode referral sendiri" });
      return;
    }

    setDiscount({
      type: "referral",
      code: trimmedCode,
      amount: Math.round(subtotal * 0.1),
      label: "Diskon referral 10%",
      referrerName: referrer.name,
    });
  };

  const clearDiscount = () => {
    setCode("");
    setDiscount({ type: "none" });
  };

  const handlePay = () => {
    setProcessing(true);

    window.setTimeout(() => {
      const now = new Date();
      const currentEnds = user.entitlementEndsAt ? new Date(user.entitlementEndsAt) : now;
      const startFrom = currentEnds > now ? currentEnds : now;
      const newEnds = new Date(startFrom.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

      setUser((previousUser) => ({ ...previousUser, entitlementEndsAt: newEnds.toISOString() }));
      navigate({ to: "/dashboard" });
    }, 1500);
  };

  return (
    <main
      className="premium-shell overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 44%, #eef8f6 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 340px at 10% -18%, #f59e0b35, transparent 62%), radial-gradient(720px 340px at 94% -12%, #14b8a61f, transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar />

        <div className="premium-lane pt-7 lg:pt-9">
          <div className="max-w-[560px]">
            <Link to="/premium" className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold text-stone-500 no-underline">
              <ArrowLeftIcon />
              Kembali
            </Link>

            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              IlmoraX Checkout
            </div>
            <h1 className="mt-2 max-w-[22ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px]">
              Selesaikan pembayaran premium
            </h1>
            <p className="m-0 mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
              Pilih metode bayar, pakai kode bila ada, lalu akses premium langsung aktif.
            </p>
          </div>
        </div>
      </div>

      <div className="premium-lane relative -mt-2 pb-20">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div>
            <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-5 shadow-sm">
              <SectionHeader title="Kode Promo" />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setDiscount({ type: "none" });
                  }}
                  placeholder="Kode kupon atau referral"
                  className="min-w-0 flex-1 rounded-[var(--radius-md)] border-2 border-stone-200 px-4 py-3 text-sm font-semibold uppercase outline-none transition-colors focus:border-primary"
                />
                <button className="btn btn-white px-4 text-sm" onClick={handleApplyCode} disabled={!code.trim()} type="button">
                  Pakai
                </button>
              </div>

              <DiscountMessage discount={discount} onClear={clearDiscount} />

              <p className="mt-3 text-[11px] font-medium leading-relaxed text-stone-400">
                Satu kode per transaksi. Coba WELCOME10, ILMORAX50, atau kode referral DEWI4F.
              </p>
            </div>

            <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-5 shadow-sm">
              <SectionHeader title="Metode Pembayaran" />
              <div className="grid gap-2">
                {paymentMethods.map((paymentMethod) => (
                  <PaymentMethodButton
                    key={paymentMethod.key}
                    paymentMethod={paymentMethod}
                    isSelected={method === paymentMethod.key}
                    onSelect={() => setMethod(paymentMethod.key)}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className="xl:sticky xl:top-24">
            <OrderSummary pkgName={pkg.name} durationDays={pkg.durationDays} subtotal={subtotal} />
            <PaymentLedger subtotal={subtotal} discount={discount} total={total} />

            <button
              className="group mt-5 flex w-full items-center justify-between gap-4 rounded-[var(--radius-lg)] border-2 border-amber-300 px-6 py-4 text-base font-extrabold tracking-wide text-stone-900 shadow-[0_14px_28px_-16px_rgba(180,83,9,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
              style={{
                background: "linear-gradient(180deg, #fcd34d 0%, #f5b544 100%)",
                borderBottomWidth: 5,
                borderBottomColor: "#b45309",
              }}
              onClick={handlePay}
              disabled={processing}
              type="button"
            >
              <span>{processing ? "Memproses" : "Bayar sekarang"}</span>
              <span className="flex items-center gap-2">
                Rp{total.toLocaleString("id-ID")}
                {!processing && <ArrowRightIcon />}
              </span>
            </button>

            <p className="mx-auto mt-3 max-w-[34ch] text-center text-[11px] font-medium leading-relaxed text-stone-400">
              Satu kali bayar, tanpa auto-renew.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function OrderSummary({
  pkgName,
  durationDays,
  subtotal,
}: {
  pkgName: string;
  durationDays: number;
  subtotal: number;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm">
      <div className="flex items-start gap-3">
        <IconTile icon={<ReceiptIcon />} accent={premiumAccent} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
            Ringkasan Pembayaran
          </div>
          <b className="mt-1 block text-xl font-bold leading-tight text-amber-50">{pkgName}</b>
          <div className="mt-2 inline-flex rounded-full border-2 border-amber-300/28 bg-amber-300/10 px-3 py-1 text-[12px] font-bold text-amber-200">
            {durationDays} hari
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-bold leading-none text-amber-50">Rp{subtotal.toLocaleString("id-ID")}</div>
          <div className="mt-1 text-[11px] font-semibold text-amber-100/55">Subtotal</div>
        </div>
      </div>
    </div>
  );
}

function DiscountMessage({ discount, onClear }: { discount: DiscountState; onClear: () => void }) {
  if (discount.type === "none") return null;

  if (discount.type === "invalid") {
    return (
      <div className="mt-3 rounded-[var(--radius-md)] border-2 border-rose-100 bg-rose-50 p-3 text-xs font-bold text-coral-dark">
        {discount.reason}
      </div>
    );
  }

  const message =
    discount.type === "coupon"
      ? `${discount.label} berhasil dipakai (${discount.code})`
      : `Diskon referral dari ${discount.referrerName}`;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border-2 border-teal-100 bg-teal-50 p-3">
      <CheckBadgeIcon />
      <div className="min-w-0 flex-1 text-xs font-bold text-primary-dark">{message}</div>
      <button className="text-xs font-bold text-stone-400 transition-colors hover:text-stone-700" onClick={onClear} type="button">
        Hapus
      </button>
    </div>
  );
}

function PaymentMethodButton({
  paymentMethod,
  isSelected,
  onSelect,
}: {
  paymentMethod: (typeof paymentMethods)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className="group flex items-center gap-3 rounded-[var(--radius-lg)] border-2 border-b-4 p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-[1px]"
      style={{
        borderColor: isSelected ? "#14b8a6" : "#f5f5f4",
        borderBottomColor: isSelected ? "#0d9488" : "#d6d3d1",
        background: isSelected ? "linear-gradient(180deg, #f0fdfa 0%, rgba(255,255,255,0.96) 76%)" : "#ffffff",
      }}
      onClick={onSelect}
      type="button"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          color: isSelected ? "#14b8a6" : "#78716c",
          background: isSelected ? "#ccfbf1" : "#f5f5f4",
          borderColor: isSelected ? "#99f6e4" : "#e7e5e4",
        }}
      >
        {paymentMethod.icon}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block text-sm font-bold text-stone-800">{paymentMethod.label}</b>
        <span className="mt-0.5 block text-[11px] font-semibold text-stone-400">{paymentMethod.description}</span>
      </div>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full border-2"
        style={{
          background: isSelected ? "#14b8a6" : "#ffffff",
          borderColor: isSelected ? "#14b8a6" : "#d6d3d1",
          color: "#ffffff",
        }}
      >
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}

function PaymentLedger({ subtotal, discount, total }: { subtotal: number; discount: DiscountState; total: number }) {
  return (
    <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-amber-100 border-b-4 border-b-amber-100 bg-[#fffaf0]/80 p-5 shadow-sm">
      <LedgerRow label="Subtotal" value={`Rp${subtotal.toLocaleString("id-ID")}`} />
      {(discount.type === "coupon" || discount.type === "referral") && (
        <LedgerRow label={discount.label} value={`-Rp${discount.amount.toLocaleString("id-ID")}`} tone="success" />
      )}
      <div className="my-3 h-px bg-amber-100" />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-bold text-stone-800">Total</span>
        <span className="text-2xl font-bold tracking-tight text-stone-900">Rp{total.toLocaleString("id-ID")}</span>
      </div>
    </div>
  );
}

function LedgerRow({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" }) {
  return (
    <div className={`mb-2 flex items-center justify-between gap-3 text-sm ${tone === "success" ? "text-success-dark" : "text-stone-600"}`}>
      <span className="font-semibold">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">{title}</span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

function IconTile({ icon, accent }: { icon: ReactNode; accent: string }) {
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}45`,
      }}
    >
      {icon}
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-teal-200 bg-white text-primary">
      <CheckIcon />
    </span>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.8-2 1.8-2-1.8-2 1.8-2-1.8L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 10h16M8 15h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12h4v4h-4a2 2 0 1 1 0-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 9h16L12 4 4 9ZM6 9v8M10 9v8M14 9v8M18 9v8M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

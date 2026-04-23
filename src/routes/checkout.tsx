import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { z } from "zod";
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
const premiumDark = "#2f281c";

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
      className="app-shell overflow-x-hidden"
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
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b-2 px-4 py-3 backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,250,240,0.92) 0%, rgba(238,248,246,0.92) 58%, rgba(255,255,255,0.88) 100%)",
            borderColor: "#d9ebe6",
          }}
        >
          <Link to="/premium" className="icon-btn" aria-label="Kembali ke premium">
            <ArrowLeftIcon />
          </Link>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Checkout
            </div>
            <b className="text-base font-bold text-stone-800">Pembayaran Premium</b>
          </div>
        </div>

        <div className="px-5 pt-7">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Ringkasan
          </div>
          <h1 className="mt-2 max-w-[22ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800">
            Selesaikan paket belajar pilihanmu
          </h1>
          <p className="m-0 mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500">
            Masukkan kode promo bila ada, pilih metode bayar, lalu aktifkan akses premium.
          </p>
        </div>
      </div>

      <div className="relative -mt-4 px-5 pb-20">
        <OrderSummary pkgName={pkg.name} description={pkg.description} durationDays={pkg.durationDays} subtotal={subtotal} />

        <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-5 shadow-sm">
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

        <PaymentLedger subtotal={subtotal} discount={discount} total={total} />

        <button
          className="btn btn-lg mt-5 w-full"
          style={{
            background: premiumDark,
            color: "#fff7ed",
            borderBottomColor: "#a16207",
          }}
          onClick={handlePay}
          disabled={processing}
          type="button"
        >
          {processing ? "Memproses pembayaran" : `Bayar Rp${total.toLocaleString("id-ID")}`}
        </button>

        <p className="mx-auto mt-3 max-w-[34ch] text-center text-[11px] font-medium leading-relaxed text-stone-400">
          Dengan melanjutkan pembayaran kamu menyetujui syarat penggunaan IlmoraX. Satu kali bayar, tanpa auto-renew.
        </p>
      </div>
    </main>
  );
}

function OrderSummary({
  pkgName,
  description,
  durationDays,
  subtotal,
}: {
  pkgName: string;
  description: string;
  durationDays: number;
  subtotal: number;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm">
      <div className="flex items-start gap-3">
        <IconTile icon={<CrownIcon />} accent={premiumAccent} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
            Paket Dipilih
          </div>
          <b className="mt-1 block text-[18px] font-bold leading-tight text-amber-50">{pkgName}</b>
          <p className="m-0 mt-1 max-w-[28ch] text-[13px] font-medium leading-relaxed text-amber-100/75">
            {description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold leading-none text-amber-50">Rp{subtotal.toLocaleString("id-ID")}</div>
          <div className="mt-1 text-[11px] font-semibold text-amber-100/55">{durationDays} hari</div>
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
      className="group flex items-center gap-3 rounded-[var(--radius-md)] border-2 border-b-4 p-3 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[1px]"
      style={{
        borderColor: isSelected ? "#14b8a655" : "#e7e5e4",
        borderBottomColor: isSelected ? "#0d9488" : "#d6d3d1",
        background: isSelected ? "#ccfbf126" : "#ffffff",
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
        className="flex h-5 w-5 items-center justify-center rounded-full border-2"
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
    <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-5 shadow-sm">
      <LedgerRow label="Subtotal" value={`Rp${subtotal.toLocaleString("id-ID")}`} />
      {(discount.type === "coupon" || discount.type === "referral") && (
        <LedgerRow label={discount.label} value={`-Rp${discount.amount.toLocaleString("id-ID")}`} tone="success" />
      )}
      <div className="my-3 h-px bg-stone-200" />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-bold text-stone-800">Total</span>
        <span className="text-2xl font-bold tracking-tight text-primary">Rp{total.toLocaleString("id-ID")}</span>
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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="m4 8 4.2 3.4L12 5l3.8 6.4L20 8l-1.8 10H5.8L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6.5 21h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

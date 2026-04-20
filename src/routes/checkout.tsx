import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { packages, mockCoupons, applyCoupon, useApp, mockUsers } from "../data";

const searchSchema = z.object({
  packageId: z.number().optional(),
});

export const Route = createFileRoute("/checkout")({
  component: CheckoutComponent,
  validateSearch: searchSchema,
});

type DiscountState =
  | { type: "none" }
  | { type: "coupon"; code: string; amount: number; label: string }
  | { type: "referral"; code: string; amount: number; label: string; referrerName: string }
  | { type: "invalid"; reason: string };

function CheckoutComponent() {
  const { packageId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const pkg = packages.find((p) => p.id === packageId) || packages[0];
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<DiscountState>({ type: "none" });
  const [method, setMethod] = useState<"xendit" | "midtrans" | "transfer">("xendit");
  const [processing, setProcessing] = useState(false);

  const subtotal = pkg.price;
  let total = subtotal;
  if (discount.type === "coupon" || discount.type === "referral") {
    total = Math.max(0, subtotal - discount.amount);
  }

  const handleApplyCode = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setDiscount({ type: "none" });
      return;
    }

    // Try as coupon first
    const coupon = mockCoupons.find((c) => c.code.toUpperCase() === trimmed);
    if (coupon) {
      if (coupon.status !== "active") {
        setDiscount({ type: "invalid", reason: "Kupon ini sudah tidak aktif" });
        return;
      }
      const discounted = applyCoupon(subtotal, coupon);
      const amount = subtotal - discounted;
      const label =
        coupon.discountType === "percentage"
          ? `Diskon ${coupon.discountValue}%`
          : `Diskon Rp${coupon.discountValue.toLocaleString("id-ID")}`;
      setDiscount({ type: "coupon", code: coupon.code, amount, label });
      return;
    }

    // Try as referral code
    const referrer = mockUsers.find((u) => u.referralCode.toUpperCase() === trimmed);
    if (referrer) {
      if (referrer.id === user.id) {
        setDiscount({ type: "invalid", reason: "Tidak bisa pakai kode referral sendiri" });
        return;
      }
      const referralDiscount = Math.round(subtotal * 0.1); // 10% global rule
      setDiscount({
        type: "referral",
        code: trimmed,
        amount: referralDiscount,
        label: "Diskon referral 10%",
        referrerName: referrer.name,
      });
      return;
    }

    setDiscount({ type: "invalid", reason: "Kode tidak ditemukan" });
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      // Mock: create entitlement = extend or set endsAt
      const now = new Date();
      const currentEnds = user.entitlementEndsAt ? new Date(user.entitlementEndsAt) : now;
      const startFrom = currentEnds > now ? currentEnds : now;
      const newEnds = new Date(startFrom.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
      setUser((prev) => ({ ...prev, entitlementEndsAt: newEnds.toISOString() }));
      navigate({ to: "/dashboard" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200 px-4 py-3.5 flex items-center gap-3">
        <Link to="/premium" className="icon-btn">←</Link>
        <b className="font-black text-base">Checkout</b>
      </div>

      <div className="max-w-[600px] mx-auto px-4 pt-6 pb-20">
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 mb-4">
          <h3 className="text-xs font-black uppercase tracking-wide text-stone-400 mb-3">Order Summary</h3>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br from-amber to-amber-dark flex items-center justify-center text-2xl text-white shrink-0 border-b-2 border-amber-900">
              ⭐
            </div>
            <div className="flex-1">
              <b className="block font-extrabold">{pkg.name}</b>
              <span className="text-xs text-stone-400 font-semibold">{pkg.description}</span>
              <div className="text-[11px] text-stone-500 font-bold mt-1">
                Durasi: {pkg.durationDays} hari
              </div>
            </div>
            <span className="font-extrabold">Rp{subtotal.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 mb-4">
          <h3 className="text-xs font-black uppercase tracking-wide text-stone-400 mb-3">Kode Promo / Referral</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setDiscount({ type: "none" }); }}
              placeholder="Kode kupon atau referral"
              className="flex-1 px-4 py-3 rounded-[var(--radius-md)] border-2 border-stone-200 focus:border-primary outline-none font-semibold text-sm uppercase"
            />
            <button
              className="btn btn-white text-sm px-4"
              onClick={handleApplyCode}
              disabled={!code.trim()}
            >
              Pakai
            </button>
          </div>

          {discount.type === "coupon" && (
            <div className="mt-3 p-3 bg-green-50 rounded-[var(--radius-md)] border border-green-200 flex items-center gap-2">
              <span>✅</span>
              <div className="flex-1 text-xs font-bold text-success-dark">
                {discount.label} berhasil dipakai ({discount.code})
              </div>
              <button
                className="text-xs text-stone-400 font-bold"
                onClick={() => { setCode(""); setDiscount({ type: "none" }); }}
              >
                ✕
              </button>
            </div>
          )}
          {discount.type === "referral" && (
            <div className="mt-3 p-3 bg-teal-50 rounded-[var(--radius-md)] border border-teal-200 flex items-center gap-2">
              <span>🎉</span>
              <div className="flex-1 text-xs font-bold text-teal-800">
                Diskon referral dari {discount.referrerName}
              </div>
              <button
                className="text-xs text-stone-400 font-bold"
                onClick={() => { setCode(""); setDiscount({ type: "none" }); }}
              >
                ✕
              </button>
            </div>
          )}
          {discount.type === "invalid" && (
            <div className="mt-3 p-3 bg-red-50 rounded-[var(--radius-md)] border border-red-200 text-xs font-bold text-coral-dark">
              ❌ {discount.reason}
            </div>
          )}

          <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
            💡 Satu kode per transaksi — kupon dan referral tidak bisa digabung. Demo: coba <b>WELCOME10</b>,
            <b> ILMORAX50</b>, atau kode referral <b>DEWI4F</b>.
          </p>
        </div>

        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 mb-4">
          <h3 className="text-xs font-black uppercase tracking-wide text-stone-400 mb-3">Metode Pembayaran</h3>
          <div className="flex flex-col gap-2">
            {[
              { k: "xendit" as const, label: "Xendit", icon: "💳", desc: "VA, e-wallet, QRIS" },
              { k: "midtrans" as const, label: "Midtrans", icon: "🏦", desc: "Transfer, kartu kredit" },
              { k: "transfer" as const, label: "Transfer Bank", icon: "🏛️", desc: "BCA, Mandiri, BNI" },
            ].map((m) => (
              <button
                key={m.k}
                className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border-2 text-left transition-all ${
                  method === m.k
                    ? "border-primary bg-teal-50 border-b-[4px] border-b-primary-dark"
                    : "border-stone-200 border-b-[3px] border-b-stone-300"
                }`}
                onClick={() => setMethod(m.k)}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <b className="block text-sm font-extrabold">{m.label}</b>
                  <span className="text-[11px] text-stone-400 font-semibold">{m.desc}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  method === m.k ? "bg-primary border-primary" : "border-stone-300"
                }`}>
                  {method === m.k && <span className="text-white text-xs font-black flex items-center justify-center h-full">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 mb-6">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-stone-500 font-semibold">Subtotal</span>
            <span className="font-bold">Rp{subtotal.toLocaleString("id-ID")}</span>
          </div>
          {(discount.type === "coupon" || discount.type === "referral") && (
            <div className="flex justify-between items-center text-sm mb-2 text-success-dark">
              <span className="font-semibold">{discount.label}</span>
              <span className="font-bold">−Rp{discount.amount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="h-px bg-stone-200 my-3" />
          <div className="flex justify-between items-baseline">
            <span className="font-black">Total</span>
            <span className="font-black text-2xl text-primary">Rp{total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg w-full"
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? "Memproses…" : `💳 Bayar Rp${total.toLocaleString("id-ID")}`}
        </button>

        <p className="text-[11px] text-stone-400 text-center mt-3 font-medium leading-relaxed">
          Dengan melanjutkan pembayaran kamu menyetujui Syarat &amp; Ketentuan IlmoraX.
          Satu kali bayar — tidak ada auto-renew.
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { packages } from "../data";

export const Route = createFileRoute("/premium")({
  component: PremiumComponent,
});

const features = [
  { name: "Semua Try-out", free: true, premium: true, label: "Akses Try-out" },
  { name: "Try-out Premium", free: false, premium: true, label: "Try-out khusus Premium" },
  { name: "Materi Dasar", free: true, premium: true, label: "Materi belajar dasar" },
  { name: "Materi Premium", free: false, premium: true, label: "Materi lengkap + PDF" },
  { name: "Pembahasan Teks", free: true, premium: true, label: "Penjelasan setiap soal" },
  { name: "Video Pembahasan", free: false, premium: true, label: "Video YouTube per soal" },
  { name: "Evaluation Dashboard", free: "basic", premium: true, label: "Evaluation Dashboard" },
  { name: "Category Breakdown", free: false, premium: true, label: "Analisis per kategori" },
  { name: "Leaderboard", free: true, premium: true, label: "Peringkat mingguan" },
  { name: "Badge System", free: true, premium: true, label: "26 Lencana" },
];

function PremiumComponent() {
  const [selectedPkg, setSelectedPkg] = useState(packages.find((p) => p.active)?.id ?? 1);
  const selected = packages.find((p) => p.id === selectedPkg);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200 px-4 py-3.5 flex items-center gap-3">
        <Link to="/dashboard" className="icon-btn">←</Link>
        <b className="font-black text-base">IlmoraX Premium</b>
      </div>

      <div className="max-w-[720px] mx-auto px-4 pt-6 pb-20">
        <div className="bg-gradient-to-br from-amber to-amber-dark rounded-[var(--radius-xl)] p-6 text-white text-center mb-6 relative overflow-hidden border-b-[5px] border-amber-900">
          <div className="absolute -right-4 -top-4 text-[120px] opacity-10 rotate-[15deg]">⭐</div>
          <div className="text-5xl mb-2">🚀</div>
          <h1 className="text-2xl font-black mb-2">Upgrade ke Premium</h1>
          <p className="text-sm font-semibold opacity-95">
            Unlock 500+ soal premium, video pembahasan, dan Evaluation Dashboard lengkap
          </p>
        </div>

        <h2 className="text-lg font-black mb-3">💎 Pilih Paket</h2>
        <div className="flex flex-col gap-3 mb-6">
          {packages.filter((p) => p.active).map((pkg) => {
            const isSelected = selectedPkg === pkg.id;
            const isPopular = pkg.id === 2;
            const monthly = Math.round(pkg.price / (pkg.durationDays / 30));
            const saving = packages[0].price - monthly;

            return (
              <button
                key={pkg.id}
                className={`text-left bg-white rounded-[var(--radius-lg)] p-5 border-3 transition-all ${
                  isSelected
                    ? "border-primary bg-teal-50 border-b-[5px] border-b-primary-dark"
                    : "border-stone-200 border-b-[4px] border-b-stone-300"
                }`}
                onClick={() => setSelectedPkg(pkg.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <b className="font-black text-base">{pkg.name}</b>
                      {isPopular && (
                        <span className="bg-amber text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Populer
                        </span>
                      )}
                    </div>
                    <p className="m-0 text-xs text-stone-500 font-semibold">{pkg.description}</p>
                    {pkg.id !== 1 && (
                      <p className="m-0 text-[11px] text-primary font-bold mt-1">
                        ≈ Rp{monthly.toLocaleString("id-ID")}/bulan · hemat Rp{saving.toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-lg text-stone-800">Rp{pkg.price.toLocaleString("id-ID")}</div>
                    <div className="text-[11px] text-stone-400 font-bold">{pkg.durationDays} hari</div>
                  </div>
                </div>
                <div className={`mt-3 w-5 h-5 rounded-full border-2 ml-auto ${
                  isSelected ? "bg-primary border-primary" : "border-stone-300"
                }`}>
                  {isSelected && <span className="text-white text-xs font-black flex items-center justify-center h-full">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <h2 className="text-lg font-black mb-3">✨ Bandingkan Fitur</h2>
        <div className="bg-white rounded-[var(--radius-lg)] shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 overflow-hidden mb-6">
          <div className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 py-3 bg-stone-50 border-b border-stone-200">
            <span className="text-xs font-black uppercase tracking-wide text-stone-400">Fitur</span>
            <span className="text-center text-xs font-black uppercase tracking-wide text-stone-400">Gratis</span>
            <span className="text-center text-xs font-black uppercase tracking-wide text-primary">Premium</span>
          </div>
          {features.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 py-3 items-center border-b border-stone-100 last:border-b-0">
              <span className="text-sm font-semibold">{f.label}</span>
              <span className="text-center text-lg">
                {f.free === true ? "✓" : f.free === false ? <span className="text-stone-300">—</span> : <span className="text-xs text-stone-400 font-bold">basic</span>}
              </span>
              <span className="text-center text-lg text-primary font-black">
                {f.premium === true ? "✓" : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-teal-50 rounded-[var(--radius-lg)] p-4 mb-6 border-2 border-teal-200">
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div className="text-xs text-teal-800 font-semibold leading-relaxed">
              <b>Sekali bayar, tidak auto-renew.</b> Setelah durasi paket selesai, otomatis kembali ke akses gratis.
              Perpanjangan akan menambah ke tanggal akhir yang ada (extend, bukan replace).
            </div>
          </div>
        </div>

        <Link
          to="/checkout"
          search={{ packageId: selectedPkg }}
          className="btn btn-primary btn-lg w-full"
        >
          Lanjut ke Pembayaran · Rp{selected?.price.toLocaleString("id-ID")}
        </Link>
      </div>
    </div>
  );
}

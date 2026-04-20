import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  feature: z.string().optional(),
});

export const Route = createFileRoute("/coming-soon")({
  component: ComingSoonComponent,
  validateSearch: searchSchema,
});

const features: Record<string, { name: string; icon: string; desc: string }> = {
  drilling: {
    name: "Drilling / Games",
    icon: "🎮",
    desc: "Latihan interaktif gaya game — soal cepat, combo streak, dan leaderboard mini. Cocok buat pemanasan sebelum tryout.",
  },
  store: {
    name: "Store",
    icon: "🛒",
    desc: "Belanja power-up, tema custom, dan item spesial. Gunakan XP atau gemstone yang kamu kumpulkan.",
  },
  affiliate: {
    name: "Affiliate Program",
    icon: "🤝",
    desc: "Undang teman pakai kode referralmu dan dapatkan bonus saat mereka upgrade ke Premium.",
  },
  materi: {
    name: "Materi",
    icon: "📚",
    desc: "Perpustakaan materi lengkap — farmakologi, farmasi klinik, dan kardiovaskular. Segera hadir di fase berikutnya.",
  },
};

function ComingSoonComponent() {
  const { feature } = Route.useSearch();
  const f = (feature && features[feature]) || {
    name: "Fitur Baru",
    icon: "✨",
    desc: "Fitur ini sedang dalam pengembangan. Stay tuned!",
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="text-[120px] mb-4" style={{ animation: "bounce 1.2s infinite alternate" }}>
          {f.icon}
        </div>
        <div className="inline-block bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-4 border-2 border-amber-200">
          Segera Hadir
        </div>
        <h1 className="text-3xl font-black mb-3">{f.name}</h1>
        <p className="text-stone-500 font-semibold leading-relaxed mb-8">{f.desc}</p>

        <div className="flex flex-col gap-3">
          <Link to="/dashboard" className="btn btn-primary">
            🏠 Kembali ke Dashboard
          </Link>
          <Link to="/tryout" className="btn btn-white">
            Mulai Tryout dulu
          </Link>
        </div>

        <p className="text-xs text-stone-400 mt-8 font-medium">
          Kami akan kabari lewat dashboard begitu fitur siap 🚀
        </p>
      </div>
    </div>
  );
}

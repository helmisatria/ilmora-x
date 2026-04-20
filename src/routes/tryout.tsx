import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { useApp, tryouts, getCategoryName } from "../data";

export const Route = createFileRoute("/tryout")({
  component: TryoutComponent,
});

function TryoutComponent() {
  const location = useLocation();
  const { isPremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");

  if (location.pathname !== "/tryout") {
    return <Outlet />;
  }

  const filtered = tryouts.filter((t) => {
    if (filter === "all") return true;
    if (filter === "free") return !t.isPremium;
    return t.isPremium;
  });

  return (
    <>
      <div className="app-shell">
        <TopBar />
        <div className="px-4 pt-5 pb-2">
          <h2 className="text-2xl font-bold m-0 tracking-tight">Try-out UKAI</h2>
          <p className="m-0 mt-1.5 text-stone-400 font-medium text-sm">Pilih modul, kumpulkan XP!</p>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          {(["all", "free", "premium"] as const).map((f) => (
            <button
              key={f}
              className={`px-4 py-2 rounded-full text-sm font-extrabold transition-all duration-150 border-2 ${
                filter === f
                  ? "bg-primary text-white border-primary-dark"
                  : "bg-white text-stone-400 border-stone-200"
              }`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Semua" : f === "free" ? "Gratis" : "Premium ⭐"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 pb-24">
          {filtered.map((t) => {
            const locked = t.isPremium && !isPremium;
            return (
              <Link
                key={t.id}
                to={locked ? "/premium" : "/tryout/$id"}
                params={locked ? undefined : { id: String(t.id) }}
                className={`bg-white rounded-[var(--radius-lg)] p-6 flex flex-col items-center gap-3 cursor-pointer relative shadow-md border-2 border-stone-100 transition-all duration-150 hover:-translate-y-1 hover:shadow-lg ${
                  locked ? "opacity-60" : ""
                }`}
                style={{ borderBottom: "4px solid var(--color-stone-200)" }}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    setShowPremium(true);
                  }
                }}
              >
                {t.isPremium && (
                  <div className="absolute -top-2 -right-2 bg-amber text-white text-[10px] font-black px-2.5 py-1.5 rounded-full shadow-md border-2 border-white">
                    ⭐ Premium
                  </div>
                )}
                <div
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-[32px] text-white shadow-md"
                  style={{ background: t.color, borderBottom: "4px solid rgba(0,0,0,0.2)" }}
                >
                  {locked ? "🔒" : t.icon}
                </div>
                <div className="text-center font-extrabold text-sm leading-tight text-stone-800">{t.title}</div>
                <div className="text-xs text-stone-400 font-bold">
                  {t.questionCount} soal • {t.duration} min
                </div>
                <div className="text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ background: `${t.color}15`, color: t.color }}>
                  {getCategoryName(t.categoryId)}
                </div>
              </Link>
            );
          })}
        </div>
        <BottomNav active="tryout" />
      </div>
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => {
          setShowPremium(false);
        }}
      />
    </>
  );
}

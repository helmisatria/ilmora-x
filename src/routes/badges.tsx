import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { useApp, badges } from "../data";

export const Route = createFileRoute("/badges")({
  component: BadgesComponent,
});

const categories = [
  { key: "General", label: "General", icon: "🎯" },
  { key: "Level", label: "Level", icon: "📈" },
  { key: "Streak", label: "Streak", icon: "🔥" },
  { key: "Prestige", label: "Prestige", icon: "⭐" },
] as const;

function BadgesComponent() {
  const { badgeProgress } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>("General");

  const filteredBadges = badges.filter((b) => b.category === activeCategory);
  const progressMap = new Map(badgeProgress.map((bp) => [bp.badgeId, bp]));

  return (
    <div className="app-shell">
      <TopBar />
      <div className="px-4 pt-5 pb-2">
        <h2 className="text-2xl font-black m-0">Lencana</h2>
        <p className="m-0 mt-1 text-stone-400 font-semibold text-sm">Kumpulkan semua pencapaian!</p>
      </div>

      <div className="flex gap-2 px-3 py-3 bg-white sticky top-[52px] z-5 border-b-2 border-stone-200">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`flex-1 px-3 py-3 rounded-[var(--radius-md)] font-black text-sm cursor-pointer transition-all duration-150 border-2 border-b-4 ${
              activeCategory === cat.key
                ? "bg-primary text-white border-primary-dark"
                : "bg-white text-stone-400 border-stone-200 border-b-stone-300"
            }`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 px-4 py-4 pb-24">
        {filteredBadges.map((badge) => {
          const prog = progressMap.get(badge.id);
          const unlocked = prog?.unlocked ?? false;
          const progress = prog?.progress ?? 0;
          const total = prog?.total ?? 1;
          const pct = total > 0 ? progress / total : 0;
          const circumference = 2 * Math.PI * 40;
          const offset = circumference - circumference * pct;

          return (
            <div key={badge.id} className={`flex flex-col items-center text-center gap-2 transition-transform hover:scale-105 ${!unlocked ? "opacity-60" : ""}`}>
              <div className="relative w-[88px] h-[88px]">
                <svg viewBox="0 0 92 92" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="46" cy="46" r="40" fill="none" stroke="#e7e5e4" strokeWidth="6" />
                  <circle
                    cx="46" cy="46" r="40" fill="none"
                    stroke={unlocked ? "#f59e0b" : "#d6d3d1"}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className={`absolute left-3 top-3 w-16 h-16 rounded-full flex items-center justify-center text-[32px] border-2 border-stone-200 border-b-4 ${
                  unlocked ? "bg-amber-50" : "bg-stone-100 grayscale opacity-60"
                }`}>
                  {badge.icon}
                </div>
              </div>
              <b className="text-[13px] font-extrabold leading-tight">{badge.name}</b>
              <span className="text-xs text-stone-400 font-extrabold">
                {unlocked ? "✅ Unlocked" : `${progress}/${total}`}
              </span>
            </div>
          );
        })}
      </div>

      <BottomNav active="badge" />
    </div>
  );
}
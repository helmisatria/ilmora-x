import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { useApp, tryouts, getLevelForXp, getNextLevel, getXpProgress } from "../data";

export const Route = createFileRoute("/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { user, isPremium, togglePremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const navigate = useNavigate();
  const levelInfo = getLevelForXp(user.xp);
  const nextLevel = getNextLevel(user.xp);
  const xpProgress = getXpProgress(user.xp);
  const pctCorrect = user.totalQuestions > 0 ? Math.round((user.totalCorrect / user.totalQuestions) * 100) : 0;

  return (
    <>
      <div className="app-shell">
        <TopBar />
        <div className="px-4 pt-4">
          <div className="bg-primary rounded-[var(--radius-xl)] p-6 text-white mb-5 relative overflow-hidden border-b-[5px] border-primary-darker">
            <div className="absolute -right-2.5 -top-2.5 text-[100px] opacity-10 rotate-[15deg]">🧪</div>
            <h2 className="m-0 mb-1 text-2xl font-black">Halo, {user.name}! 👋</h2>
            <p className="m-0 mb-4 opacity-90 font-medium">Lanjutkan perjalanan apotekermu</p>
            <div className="bg-white/20 rounded-[var(--radius-lg)] p-3.5 flex justify-between items-center backdrop-blur-sm">
              <div>
                <div className="text-xs opacity-85 font-semibold">Streak</div>
                <div className="font-black text-xl">🔥 {user.streak} hari</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-85 font-semibold">Level {levelInfo.level}</div>
                <div className="font-black text-xl">{levelInfo.title}</div>
              </div>
            </div>
            {nextLevel && (
              <div className="mt-3">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{user.xp.toLocaleString()} XP</span>
                  <span>{nextLevel.xp.toLocaleString()} XP</span>
                </div>
                <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-5">
            <button
              className="btn btn-primary flex-1 text-sm"
              onClick={() => navigate({ to: "/tryout" })}
            >
              📚 Mulai Tryout
            </button>
            {!isPremium && (
              <button
                className="btn btn-secondary flex-1 text-sm"
                onClick={() => setShowPremium(true)}
              >
                ⭐ Premium
              </button>
            )}
          </div>

          <div className="flex gap-3 mb-5">
            <div className="flex-1 bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
              <div className="text-2xl mb-1">📝</div>
              <b className="text-lg font-black">{user.totalQuestions}</b>
              <div className="text-xs text-stone-400 font-bold">Soal dikerjakan</div>
            </div>
            <div className="flex-1 bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
              <div className="text-2xl mb-1">🎯</div>
              <b className="text-lg font-black">{pctCorrect}%</b>
              <div className="text-xs text-stone-400 font-bold">Akurasi</div>
            </div>
            <div className="flex-1 bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
              <div className="text-2xl mb-1">📊</div>
              <b className="text-lg font-black">{user.totalTryouts}</b>
              <div className="text-xs text-stone-400 font-bold">Try-out</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="m-0 text-xl font-black">📚 Try-out Tersedia</h3>
            <Link to="/tryout" className="btn btn-sm bg-transparent border-none text-primary p-2">
              Lihat semua ›
            </Link>
          </div>

          <div className="grid gap-3.5">
            {tryouts.slice(0, 4).map((t) => (
              <Link
                key={t.id}
                to="/tryout/$id"
                params={{ id: String(t.id) }}
                className="card"
              >
                <div
                  className="w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center text-[28px] shrink-0 bg-stone-100 border-2 border-stone-200 border-b-4 border-b-stone-300"
                  style={t.isPremium && !isPremium ? {} : { background: `${t.color}20`, color: t.color }}
                >
                  {t.isPremium && !isPremium ? "🔒" : t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <b className="text-base font-extrabold">{t.title}</b>
                    <span
                      className="text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                      style={{
                        background: t.isPremium && !isPremium ? "var(--color-amber-light)" : `${t.color}15`,
                        color: t.isPremium && !isPremium ? "var(--color-amber-dark)" : t.color,
                      }}
                    >
                      {t.isPremium && !isPremium ? "Premium" : t.duration + " menit"}
                    </span>
                  </div>
                  <div className="text-sm text-stone-400 font-medium">{t.questionCount} soal</div>
                </div>
                <span className="text-stone-300 text-2xl font-light">›</span>
              </Link>
            ))}
          </div>

          <div className="mt-6 mb-4">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-amber-200 border-b-4 border-b-amber-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📊</span>
                <div>
                  <b className="text-base font-extrabold text-amber-900">Evaluation Dashboard</b>
                  <p className="text-sm text-amber-700 font-medium m-0">Lihat analisis performa lengkapmu</p>
                </div>
              </div>
              {!isPremium && (
                <p className="text-xs text-amber-600 font-bold">🔒 Upgrade ke Premium untuk akses penuh</p>
              )}
              <Link
                to="/evaluation"
                className="btn btn-secondary btn-sm w-full mt-3"
              >
                {isPremium ? "Buka Evaluation" : "Lihat Preview"}
              </Link>
            </div>
          </div>

          <div className="mt-4 mb-4">
            <Link
              to="/poll/join"
              className="block bg-gradient-to-r from-teal-50 to-teal-100 rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-teal-200 border-b-4 border-b-teal-400"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div className="flex-1">
                  <b className="block font-extrabold text-teal-900">Gabung Live Poll</b>
                  <span className="text-xs text-teal-700 font-medium">Pembimbingmu kasih kode 6 digit</span>
                </div>
                <span className="text-teal-900 text-xl">›</span>
              </div>
            </Link>
          </div>

          <div className="mt-4 mb-4">
            <h3 className="text-xl font-black mb-3">🚀 Segera Hadir</h3>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/coming-soon" search={{ feature: "drilling" }} className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
                <div className="text-3xl mb-2">🎮</div>
                <b className="text-sm font-extrabold">Drilling</b>
                <div className="text-xs text-stone-400 font-medium">Latihan</div>
              </Link>
              <Link to="/coming-soon" search={{ feature: "store" }} className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
                <div className="text-3xl mb-2">🛒</div>
                <b className="text-sm font-extrabold">Store</b>
                <div className="text-xs text-stone-400 font-medium">Power-up</div>
              </Link>
              <Link to="/coming-soon" search={{ feature: "affiliate" }} className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
                <div className="text-3xl mb-2">🤝</div>
                <b className="text-sm font-extrabold">Affiliate</b>
                <div className="text-xs text-stone-400 font-medium">Referral</div>
              </Link>
            </div>
          </div>

          <div className="mt-4 mb-20">
            <div className="text-center text-xs text-stone-400 font-medium">
              <button onClick={togglePremium} className="text-stone-300 hover:text-stone-500 transition-colors">
                {isPremium ? "🔓 Premium mode ON" : "🔒 Premium mode OFF"}
              </button>
            </div>
          </div>
        </div>
        <BottomNav active="learn" />
      </div>
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => {
          setShowPremium(false);
          navigate({ to: "/premium" });
        }}
      />
    </>
  );
}
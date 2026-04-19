import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { useApp } from "../data";
import { useState } from "react";

export const Route = createFileRoute("/evaluation")({
  component: EvaluationComponent,
});

function EvaluationComponent() {
  const { isPremium, togglePremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);

  const categoryBreakdown = [
    { name: "Klinis", subcategories: [
      { name: "Kardiovaskular - Hipertensi", total: 40, correct: 30 },
      { name: "Kardiovaskular - Gagal Jantung", total: 25, correct: 18 },
      { name: "Respiratori - Asma", total: 20, correct: 14 },
    ]},
    { name: "Farmakologi", subcategories: [
      { name: "Antibiotik", total: 30, correct: 21 },
      { name: "NSAID", total: 15, correct: 10 },
    ]},
    { name: "Farmasi Klinik", subcategories: [
      { name: "Perhitungan Dosis", total: 20, correct: 12 },
      { name: "Interaksi Obat", total: 15, correct: 11 },
    ]},
  ];

  const totalQuestions = categoryBreakdown.reduce((sum, cat) => sum + cat.subcategories.reduce((s, sub) => s + sub.total, 0), 0);
  const totalCorrect = categoryBreakdown.reduce((sum, cat) => sum + cat.subcategories.reduce((s, sub) => s + sub.correct, 0), 0);
  const totalWrong = totalQuestions - totalCorrect;
  const pctCorrect = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const pctWrong = totalQuestions > 0 ? Math.round((totalWrong / totalQuestions) * 100) : 0;

  return (
    <div className="app-shell">
      <TopBar />
      <div className="px-4 pt-5 pb-24">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-black m-0">Evaluation</h2>
          <button
            onClick={togglePremium}
            className="text-xs text-stone-300 hover:text-stone-500 transition-colors bg-transparent border-none cursor-pointer"
          >
            {isPremium ? "🔓 Premium ON" : "🔒 Free mode"}
          </button>
        </div>
        <p className="m-0 text-stone-400 font-semibold text-sm">Analisis performa belajarmu</p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">📝</div>
            <b className="text-xl font-black">{totalQuestions}</b>
            <div className="text-xs text-stone-400 font-bold">Soal Dikerjakan</div>
          </div>
          <div className="bg-green-50 rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-green-200 border-b-4 border-b-green-400 text-center">
            <div className="text-2xl mb-1">✅</div>
            <b className="text-xl font-black text-success">{totalCorrect}</b>
            <div className="text-xs text-stone-400 font-bold">Jawaban Benar</div>
          </div>
          <div className="bg-red-50 rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-red-200 border-b-4 border-b-red-400 text-center">
            <div className="text-2xl mb-1">❌</div>
            <b className="text-xl font-black text-coral">{totalWrong}</b>
            <div className="text-xs text-stone-400 font-bold">Jawaban Salah</div>
          </div>
          <div className="bg-teal-50 rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-teal-200 border-b-4 border-b-primary-dark text-center">
            <div className="text-2xl mb-1">🎯</div>
            <b className="text-xl font-black text-primary">{pctCorrect}%</b>
            <div className="text-xs text-stone-400 font-bold">Persentase Benar</div>
          </div>
        </div>

        <h3 className="text-lg font-black mt-8 mb-4">Breakdown per Kategori</h3>

        {categoryBreakdown.map((cat) => {
          const catTotal = cat.subcategories.reduce((s, sub) => s + sub.total, 0);
          const catCorrect = cat.subcategories.reduce((s, sub) => s + sub.correct, 0);
          const catPct = catTotal > 0 ? Math.round((catCorrect / catTotal) * 100) : 0;

          return (
            <div key={cat.name} className="bg-white rounded-[var(--radius-lg)] shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 mb-4 overflow-hidden">
              <div className="p-4 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <b className="font-extrabold">{cat.name}</b>
                  <span className="font-bold text-primary">{catPct}%</span>
                </div>
                <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${catPct}%` }} />
                </div>
                <div className="text-xs text-stone-400 font-medium mt-1">{catCorrect}/{catTotal} soal benar</div>
              </div>

              <div className={`relative ${!isPremium ? "select-none" : ""}`}>
                <div className="border-t border-stone-100 px-4 py-3 space-y-3">
                  {cat.subcategories.map((sub) => {
                    const subPct = sub.total > 0 ? Math.round((sub.correct / sub.total) * 100) : 0;
                    return (
                      <div key={sub.name} className={`${!isPremium ? "blur-[3px] opacity-70" : ""}`}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="font-semibold text-stone-600">{sub.name}</span>
                          <span className="font-bold text-primary">{subPct}%</span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${subPct}%` }} />
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">{sub.correct}/{sub.total}</div>
                      </div>
                    );
                  })}
                </div>

                {!isPremium && (
                  <div className="absolute inset-0 flex items-center justify-center bg-amber-50/80 rounded-b-[var(--radius-lg)]">
                    <button
                      onClick={() => setShowPremium(true)}
                      className="btn btn-secondary btn-sm"
                    >
                      ⭐ Unlock Breakdown
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <h3 className="text-lg font-black mt-8 mb-4">Riwayat Attempt</h3>

        {!isPremium ? (
          <div className="bg-amber-50 rounded-[var(--radius-lg)] p-6 shadow-md border-2 border-amber-200 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-bold text-amber-800 m-0 mb-4">Riwayat attempt lengkap tersedia untuk Premium</p>
            <button className="btn btn-secondary" onClick={() => setShowPremium(true)}>
              ⭐ Upgrade ke Premium
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { title: "UKAI Tryout 1", score: 80, date: "15 Apr 2026", xp: 130, attempt: 1 },
              { title: "Farmakologi Dasar", score: 50, date: "16 Apr 2026", xp: 70, attempt: 1 },
              { title: "Kardiovaskular", score: 75, date: "13 Apr 2026", xp: 150, attempt: 1 },
            ].map((a, i) => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0 ${a.score >= 70 ? "bg-success" : "bg-coral"}`}>
                  {a.score}%
                </div>
                <div className="flex-1 min-w-0">
                  <b className="font-extrabold block truncate">{a.title}</b>
                  <div className="flex gap-3 text-xs text-stone-400 font-medium mt-0.5">
                    <span>Attempt #{a.attempt}</span>
                    <span>{a.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber">+{a.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="learn" />
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => setShowPremium(false)}
      />
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { useApp, getLevelForXp, getXpProgress } from "../data";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progres Belajar — IlmoraX" },
      { name: "description", content: "Pantau perkembangan belajarmu: level, XP, akurasi, dan performa per kategori. Lihat riwayat try-out dan analisis kemajuan belajar farmasi." },
      { property: "og:title", content: "Progres Belajar — IlmoraX" },
      { property: "og:description", content: "Pantau perkembangan belajarmu: level, XP, akurasi, dan performa per kategori." },
    ],
  }),
  component: ProgressComponent,
});

function ProgressComponent() {
  const { user } = useApp();
  const levelInfo = getLevelForXp(user.xp);
  const nextLevel = (() => { const l = getLevelForXp(user.xp); const allLevels = [...Array(50)].map((_, i) => ({ level: i + 1 })); const idx = allLevels.findIndex(x => x.level === l.level); return idx < allLevels.length - 1 ? allLevels[idx + 1] : null; })();
  const xpProgress = getXpProgress(user.xp);
  const pctCorrect = user.totalQuestions > 0 ? Math.round((user.totalCorrect / user.totalQuestions) * 100) : 0;

  const categoryBreakdown = [
    { name: "Klinis", total: 85, correct: 68, color: "#205072" },
    { name: "Farmakologi", total: 95, correct: 72, color: "#58cc02" },
    { name: "Farmasi Klinik", total: 65, correct: 49, color: "#0ea5e9" },
  ];

  return (
    <div className="app-shell">
      <TopBar />
      <div className="px-4 pt-5 pb-24">
        <h2 className="text-2xl font-black m-0 mb-1">Progres Belajar</h2>
        <p className="m-0 text-stone-400 font-semibold text-sm">Lihat perkembanganmu</p>

        <div className="mt-6 bg-primary rounded-[var(--radius-xl)] p-5 text-white border-b-[5px] border-primary-darker">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl">🏆</div>
            <div>
              <div className="font-black text-xl">Level {levelInfo.level}</div>
              <div className="font-semibold text-sm opacity-90">{levelInfo.title}</div>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="flex justify-between text-xs font-bold mt-1.5 opacity-80">
            <span>{user.xp.toLocaleString()} XP</span>
            <span>{nextLevel ? `${(allLevels.find(x => x.level === levelInfo.level + 1) as any)?.xp?.toLocaleString() ?? "?"} XP` : "MAX"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">📝</div>
            <b className="text-xl font-black">{user.totalQuestions}</b>
            <div className="text-xs text-stone-400 font-bold">Soal</div>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">✅</div>
            <b className="text-xl font-black">{user.totalCorrect}</b>
            <div className="text-xs text-stone-400 font-bold">Benar</div>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <b className="text-xl font-black">{pctCorrect}%</b>
            <div className="text-xs text-stone-400 font-bold">Akurasi</div>
          </div>
        </div>

        <h3 className="text-lg font-black mt-8 mb-4">Performa per Kategori</h3>
        <div className="space-y-4">
          {categoryBreakdown.map((cat) => {
            const pct = cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
            return (
              <div key={cat.name} className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
                <div className="flex justify-between items-center mb-2">
                  <b className="font-extrabold">{cat.name}</b>
                  <span className="text-sm font-bold" style={{ color: cat.color }}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cat.color }} />
                </div>
                <div className="text-xs text-stone-400 font-medium mt-1.5">{cat.correct}/{cat.total} soal benar</div>
              </div>
            );
          })}
        </div>

        <h3 className="text-lg font-black mt-8 mb-4">Riwayat Try-out</h3>
        <div className="space-y-3">
          {[
            { title: "UKAI Tryout 1", score: 80, date: "15 Apr 2026", xp: 130 },
            { title: "Farmakologi Dasar", score: 50, date: "16 Apr 2026", xp: 70 },
          ].map((attempt, i) => (
            <div key={i} className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0 ${attempt.score >= 70 ? "bg-success border-b-3 border-b-success-dark" : "bg-coral border-b-3 border-b-coral-dark"}`}>
                {attempt.score}%
              </div>
              <div className="flex-1 min-w-0">
                <b className="font-extrabold block truncate">{attempt.title}</b>
                <span className="text-xs text-stone-400 font-medium">{attempt.date}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber">+{attempt.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="learn" />
    </div>
  );
}

const allLevels = [
  { level: 1, xp: 0, title: "Pharmacy Newbie I" },
  { level: 2, xp: 50, title: "Pharmacy Newbie II" },
  { level: 3, xp: 100, title: "Pharmacy Novice I" },
  { level: 4, xp: 200, title: "Pharmacy Novice II" },
  { level: 5, xp: 350, title: "Pharmacy Learner I" },
  { level: 6, xp: 550, title: "Pharmacy Learner II" },
  { level: 7, xp: 800, title: "Pharmacy Student I" },
  { level: 8, xp: 1100, title: "Pharmacy Student II" },
  { level: 9, xp: 1450, title: "Pharmacy Apprentice I" },
  { level: 10, xp: 1850, title: "Pharmacy Apprentice II" },
  { level: 11, xp: 2300, title: "Pharmacy Practitioner I" },
  { level: 12, xp: 2850, title: "Pharmacy Practitioner II" },
];
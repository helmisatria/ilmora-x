import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp, tryouts, questionBank, type WrongAnswer } from "../data";
import { runConfetti } from "../utils/confetti";
import { PremiumDialog } from "../components/PremiumDialog";

export const Route = createFileRoute("/results/$attemptId")({
  head: ({ params }) => ({
    meta: [
      { title: "Hasil Tryout — IlmoraX" },
      { name: "description", content: "Lihat hasil tryout: skor, XP yang didapat, dan pembahasan soal. Review jawaban benar dan salah untuk evaluasi belajar." },
      { property: "og:title", content: "Hasil Tryout — IlmoraX" },
      { property: "og:description", content: "Lihat hasil tryout: skor, XP yang didapat, dan pembahasan soal." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ResultsComponent,
});

function ResultsComponent() {
  const { attemptId } = Route.useParams();
  const { user, isPremium, attempts } = useApp();
  const attempt = attempts.find((a) => a.id === parseInt(attemptId, 10)) || attempts[0];

  const tryout = tryouts.find((t) => t.id === attempt.tryoutId);
  const questions = questionBank[attempt.tryoutId] || [];

  const score = attempt.score;
  const correct = attempt.correct;
  const total = attempt.total;
  const xpEarn = attempt.xpEarned;
  const isFirstAttempt = attempt.attemptNumber === 1;
  const duration = attempt.completedAt
    ? Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)
    : 0;

  const dash = 339;
  const off = dash - (dash * score) / 100;
  const passed = score >= 70;

  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const wrongs: WrongAnswer[] = questions
    .filter((q) => {
      const ans = attempt.answers.find((a) => a.questionId === q.id);
      return !ans || !ans.correct;
    })
    .map((q) => {
      const ans = attempt.answers.find((a) => a.questionId === q.id);
      return {
        id: q.id,
        subject: getCategoryLabel(q.categoryId),
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        explanationPreview: q.explanation.slice(0, 120) + "...",
        videoUrl: q.videoUrl,
        isPremium: q.isPremium,
        user: ans !== undefined ? q.options[ans.selected] : "Tidak dijawab",
      };
    });
  const premiumCount = wrongs.filter((w) => w.isPremium && !isPremium).length;

  useEffect(() => {
    const duration = 900;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * score));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (passed) {
      const timer = setTimeout(runConfetti, 100);
      return () => clearTimeout(timer);
    }
  }, [score, passed]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden">
      <canvas id="confetti" className="absolute inset-0 pointer-events-none" />
      <div className="relative z-[1] max-w-[720px] mx-auto px-6 py-10 text-center">
        {premiumCount > 0 && (
          <div className="bg-amber-50 rounded-[var(--radius-lg)] px-5 py-4 mb-6 flex items-center gap-3 shadow-md border-2 border-amber-300 border-b-4 border-b-amber-500">
            <span className="text-3xl">🔒</span>
            <div className="flex-1 text-left">
              <p className="m-0 font-extrabold text-sm text-amber-800">{premiumCount} pembahasan terkunci</p>
              <span className="text-[13px] text-stone-500">Upgrade untuk akses lengkap</span>
            </div>
            <button
              className="bg-amber-700 text-white border-none px-3.5 py-2.5 rounded-[var(--radius-md)] font-extrabold text-[13px] cursor-pointer whitespace-nowrap border-b-3"
              onClick={() => setShowPremiumDialog(true)}
            >
              Unlock
            </button>
          </div>
        )}

        <div className="text-[72px] animate-bounce">{passed ? "🎉" : "💪"}</div>
        <h1 className="text-3xl font-black my-4">
          {passed ? "Kerja bagus!" : "Semangat, coba lagi!"}
        </h1>
        {tryout && <p className="text-stone-500 font-semibold mb-4 -mt-2">{tryout.title} · Attempt #{attempt.attemptNumber}</p>}

        <div className="relative w-[180px] h-[180px] mx-auto mb-5">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r="54" stroke="#e7e5e4" strokeWidth="12" fill="none" />
            <circle
              cx="60" cy="60" r="54"
              stroke="#14b8a6" strokeWidth="12" fill="none"
              strokeDasharray={dash} strokeDashoffset={off}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 900ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="text-[52px] font-black text-primary leading-none">{displayScore}%</b>
            <span className="text-[13px] font-extrabold text-stone-400 tracking-wide uppercase mt-1">AKURASI</span>
          </div>
        </div>

        <div className="text-4xl font-black text-amber mb-2" style={{ animation: "popIn 0.6s cubic-bezier(0.2, 1.6, 0.4, 1)" }}>
          +{xpEarn} XP
        </div>
        {!isFirstAttempt && (
          <p className="text-xs text-stone-400 font-medium mb-4">
            Attempt ke-{attempt.attemptNumber} — XP dikurangi 75% (retake)
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 mb-7">
          <div className="bg-white rounded-[var(--radius-lg)] py-5 px-3 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
            <span className="text-[28px] block">🎯</span>
            <b className="text-[22px] font-black block my-2">{correct}/{total}</b>
            <span className="text-xs text-stone-400 font-bold">Benar</span>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] py-5 px-3 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
            <span className="text-[28px] block">⚡</span>
            <b className="text-[22px] font-black block my-2">{duration}min</b>
            <span className="text-xs text-stone-400 font-bold">Durasi</span>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] py-5 px-3 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
            <span className="text-[28px] block">🔥</span>
            <b className="text-[22px] font-black block my-2">{user.streak}</b>
            <span className="text-xs text-stone-400 font-bold">Streak</span>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <Link
            to="/tryout/$id"
            params={{ id: String(attempt.tryoutId) }}
            className="btn btn-white flex-1"
          >
            🔄 Coba Lagi
          </Link>
          <Link
            to="/results/$attemptId/review"
            params={{ attemptId: String(attempt.id) }}
            className="btn btn-primary flex-[2]"
          >
            📖 Review Pembahasan
          </Link>
        </div>
        <Link to="/dashboard" className="btn btn-secondary w-full">
          🏠 Kembali ke Dashboard
        </Link>

        {wrongs.length > 0 && (
          <div className="mt-8 text-left">
            <div className="flex justify-between items-center mb-5 px-1">
              <h3 className="m-0 text-lg font-black">📚 Soal Salah ({wrongs.length})</h3>
              {premiumCount > 0 && (
                <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full border-2 border-amber-300">
                  🔒 {premiumCount} Premium
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {wrongs.slice(0, 3).map((w) => (
                <div key={w.id} className="bg-white rounded-[var(--radius-lg)] shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 p-4">
                  <span className="text-[11px] font-black uppercase tracking-wide text-primary bg-teal-50 px-2.5 py-1 rounded-full inline-block mb-2">
                    {w.subject}
                  </span>
                  <p className="m-0 text-sm font-bold leading-relaxed">{w.question}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <span className="text-coral-dark font-bold bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">❌ {w.user}</span>
                    <span className="text-success-dark font-bold bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">✓ {w.options[w.correct]}</span>
                  </div>
                </div>
              ))}
              {wrongs.length > 3 && (
                <Link
                  to="/results/$attemptId/review"
                  params={{ attemptId: String(attempt.id) }}
                  className="text-center text-primary font-extrabold text-sm py-3"
                >
                  Lihat semua {wrongs.length} pembahasan →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <PremiumDialog
        isOpen={showPremiumDialog}
        onClose={() => setShowPremiumDialog(false)}
        onUpgrade={() => setShowPremiumDialog(false)}
      />
    </div>
  );
}

function getCategoryLabel(catId: string): string {
  const labels: Record<string, string> = {
    klinis: "KLINIS",
    farmakologi: "FARMAKOLOGI",
    "farmasi-klinik": "FARMASI KLINIK",
  };
  return labels[catId] || catId.toUpperCase();
}

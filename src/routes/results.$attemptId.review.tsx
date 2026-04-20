import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, questionBank, tryouts, mockMateri } from "../data";
import { PremiumDialog } from "../components/PremiumDialog";

export const Route = createFileRoute("/results/$attemptId/review")({
  head: ({ params }) => ({
    meta: [
      { title: "Pembahasan Tryout — IlmoraX" },
      { name: "description", content: "Review dan pelajari pembahasan lengkap soal tryout. Lihat jawaban benar, penjelasan detail, dan video pembelajaran untuk setiap soal." },
      { property: "og:title", content: "Pembahasan Tryout — IlmoraX" },
      { property: "og:description", content: "Review dan pelajari pembahasan lengkap soal tryout dengan penjelasan detail dan video." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ReviewComponent,
});

function ReviewComponent() {
  const { attemptId } = Route.useParams();
  const { attempts, isPremium } = useApp();
  const attempt = attempts.find((a) => a.id === parseInt(attemptId, 10)) || attempts[0];
  const tryout = tryouts.find((t) => t.id === attempt.tryoutId);
  const questions = questionBank[attempt.tryoutId] || [];

  const [filter, setFilter] = useState<"all" | "wrong" | "correct" | "unanswered">("all");
  const [showPremium, setShowPremium] = useState(false);

  const filteredQuestions = questions.filter((q) => {
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    if (filter === "wrong") return ans && !ans.correct;
    if (filter === "correct") return ans && ans.correct;
    if (filter === "unanswered") return !ans;
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200 px-4 py-3.5 flex items-center gap-3">
        <Link
          to="/results/$attemptId"
          params={{ attemptId }}
          className="icon-btn"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <b className="block font-black text-base truncate">Pembahasan</b>
          <span className="text-xs text-stone-400 font-medium">{tryout?.title} · Attempt #{attempt.attemptNumber}</span>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-4 py-5">
        <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 mb-4 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-black text-success">{attempt.correct}</div>
            <div className="text-[11px] text-stone-400 font-bold uppercase">Benar</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-coral">{attempt.total - attempt.correct}</div>
            <div className="text-[11px] text-stone-400 font-bold uppercase">Salah</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-primary">{attempt.score}%</div>
            <div className="text-[11px] text-stone-400 font-bold uppercase">Skor</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {([
            { k: "all", label: `Semua (${questions.length})` },
            { k: "wrong", label: `Salah (${attempt.total - attempt.correct})` },
            { k: "correct", label: `Benar (${attempt.correct})` },
            { k: "unanswered", label: "Kosong" },
          ] as const).map((f) => (
            <button
              key={f.k}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap border-2 transition-all ${
                filter === f.k
                  ? "bg-primary text-white border-primary-dark"
                  : "bg-white text-stone-500 border-stone-200"
              }`}
              onClick={() => setFilter(f.k)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {filteredQuestions.map((q, idx) => {
            const ans = attempt.answers.find((a) => a.questionId === q.id);
            const userSel = ans?.selected;
            const isCorrect = ans?.correct ?? false;
            const premiumLocked = q.isPremium && !isPremium;
            const relatedMateri = mockMateri.find((m) => m.subCategoryId === q.subCategoryId);

            return (
              <div
                key={q.id}
                className={`bg-white rounded-[var(--radius-lg)] shadow-md border-2 overflow-hidden ${
                  isCorrect ? "border-green-200" : ans ? "border-red-200" : "border-stone-200"
                }`}
                style={{ borderBottom: "4px solid var(--color-stone-200)" }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs ${
                        isCorrect ? "bg-success" : ans ? "bg-coral" : "bg-stone-400"
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wide text-primary bg-teal-50 px-2.5 py-1 rounded-full">
                        {getCategoryLabel(q.categoryId)}
                      </span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      isCorrect ? "bg-green-100 text-success-dark" : ans ? "bg-red-100 text-coral-dark" : "bg-stone-100 text-stone-500"
                    }`}>
                      {isCorrect ? "✓ Benar" : ans ? "✗ Salah" : "Kosong"}
                    </span>
                  </div>

                  <p className="m-0 mb-4 text-[15px] font-bold leading-relaxed">{q.question}</p>

                  <div className="flex flex-col gap-2 mb-4">
                    {q.options.map((opt, i) => {
                      const isUser = userSel === i;
                      const isRight = q.correct === i;
                      let cls = "bg-stone-50 border-stone-200 text-stone-600";
                      if (isRight) cls = "bg-green-50 border-green-300 text-success-dark";
                      else if (isUser && !isRight) cls = "bg-red-50 border-red-300 text-coral-dark";
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-md)] border-2 font-semibold text-sm ${cls}`}
                        >
                          <span className="w-7 h-7 rounded-[8px] flex items-center justify-center font-black text-xs bg-white border border-stone-200 shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isRight && <span className="font-black">✓</span>}
                          {isUser && !isRight && <span className="font-black">✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <h4 className="text-sm font-black m-0 mb-2 flex items-center gap-2">📝 Pembahasan</h4>
                    {premiumLocked ? (
                      <div className="relative p-4 bg-amber-50 rounded-[var(--radius-md)] border-2 border-amber-300">
                        <p className="m-0 text-sm leading-relaxed blur-[4px] opacity-70 select-none">{q.explanation}</p>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            className="bg-amber-700 text-white font-extrabold text-sm px-4 py-2.5 rounded-[var(--radius-md)] border-b-3 border-amber-900"
                            onClick={() => setShowPremium(true)}
                          >
                            🔒 Unlock Pembahasan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="m-0 text-sm leading-relaxed text-stone-700 p-4 bg-stone-50 rounded-[var(--radius-md)] border-l-4 border-primary">
                        {q.explanation}
                      </p>
                    )}
                  </div>

                  {q.videoUrl && !premiumLocked && isPremium && (
                    <div className="mt-4">
                      <h4 className="text-sm font-black m-0 mb-2 flex items-center gap-2">🎥 Video Pembelajaran</h4>
                      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-[var(--radius-md)] bg-black">
                        <iframe
                          src={q.videoUrl}
                          title={`Pembahasan soal ${idx + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  {q.videoUrl && !isPremium && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-[var(--radius-md)] border border-amber-300 text-xs font-bold text-amber-800 flex items-center gap-2">
                      🎥 Video pembahasan tersedia untuk Premium
                    </div>
                  )}

                  {!isCorrect && relatedMateri && isPremium && (
                    <Link
                      to="/coming-soon"
                      search={{ feature: "materi" }}
                      className="mt-3 flex items-center gap-3 p-3 bg-teal-50 rounded-[var(--radius-md)] border-2 border-teal-200 font-extrabold text-sm text-teal-800"
                    >
                      <span className="text-xl">📖</span>
                      <div className="flex-1">
                        <div>Baca Materi: {relatedMateri.title}</div>
                        <div className="text-xs font-medium text-teal-600">Pelajari topik ini lebih dalam</div>
                      </div>
                      <span>›</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 mb-20 flex gap-3">
          <Link
            to="/results/$attemptId"
            params={{ attemptId }}
            className="btn btn-white flex-1"
          >
            ← Kembali
          </Link>
          <Link to="/dashboard" className="btn btn-primary flex-1">
            Dashboard
          </Link>
        </div>
      </div>

      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => setShowPremium(false)}
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useApp, questionBank, tryouts, mockMateri } from "../data";
import { PremiumDialog } from "../components/PremiumDialog";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FREE_WRONG_PREVIEW = 3;

const searchSchema = z.object({
  q: z.number().optional(),
  filter: z.enum(["all", "wrong", "correct", "unanswered"]).optional(),
});

type ReviewFilter = "all" | "wrong" | "correct" | "unanswered";

export const Route = createFileRoute("/results/$attemptId/review")({
  head: ({ params }) => ({
    meta: [
      { title: "Pembahasan Tryout — IlmoraX" },
      { name: "description", content: "Review dan pelajari pembahasan lengkap soal tryout. Lihat jawaban benar, penjelasan detail, dan video pembelajaran." },
      { property: "og:title", content: "Pembahasan Tryout — IlmoraX" },
      { property: "og:description", content: "Review dan pelajari pembahasan lengkap soal tryout." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ReviewComponent,
  validateSearch: searchSchema,
});

function ReviewComponent() {
  const { attemptId } = Route.useParams();
  const search = Route.useSearch();
  const { attempts, isPremium } = useApp();
  const attempt = attempts.find((a) => a.id === parseInt(attemptId, 10)) || attempts[0];
  const tryout = tryouts.find((t) => t.id === attempt.tryoutId);
  const questions = questionBank[attempt.tryoutId] || [];

  const [filter, setFilter] = useState<ReviewFilter>(search.filter ?? "all");
  const [showPremium, setShowPremium] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  const lockedIds = useMemo(() => {
    if (isPremium) return new Set<number>();
    const locked = new Set<number>();
    let wrongIdx = 0;
    for (const q of questions) {
      const ans = attempt.answers.find((a) => a.questionId === q.id);
      const isWrongOrEmpty = !ans || !ans.correct;
      if (isWrongOrEmpty) {
        if (wrongIdx >= FREE_WRONG_PREVIEW) locked.add(q.id);
        wrongIdx++;
      }
    }
    return locked;
  }, [questions, attempt.answers, isPremium]);

  const filteredQuestions = questions.filter((q) => {
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    if (filter === "wrong") return ans && !ans.correct;
    if (filter === "correct") return ans && ans.correct;
    if (filter === "unanswered") return !ans;
    return true;
  });

  useEffect(() => {
    if (!search.q) return;
    const id = search.q;
    const timer = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-question-id="${id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-teal-300", "ring-offset-2");
      window.setTimeout(() => {
        el.classList.remove("ring-4", "ring-teal-300", "ring-offset-2");
      }, 1600);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search.q, filter]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

      const cards = questionsRef.current?.querySelectorAll(".question-card");
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: questionsRef.current,
              start: "top 85%",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, [filter]);

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-[#fafafa] font-['Cabinet_Grotesk',system-ui,sans-serif]">
      {/* Sticky Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-stone-200/80"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/results/$attemptId"
            params={{ attemptId }}
            className="w-10 h-10 rounded-xl bg-stone-100 border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeftIcon />
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-stone-900 truncate">Pembahasan Lengkap</h1>
            <p className="text-sm text-stone-500">{tryout?.title} · Attempt #{attempt.attemptNumber}</p>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-black text-teal-600">{attempt.correct}</div>
              <div className="text-xs font-medium text-stone-400 uppercase">Benar</div>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <div className="text-lg font-black text-red-500">{attempt.total - attempt.correct}</div>
              <div className="text-xs font-medium text-stone-400 uppercase">Salah</div>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <div className="text-lg font-black text-stone-800">{attempt.score}%</div>
              <div className="text-xs font-medium text-stone-400 uppercase">Skor</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { k: "all", label: `Semua (${questions.length})` },
              { k: "wrong", label: `Salah (${attempt.total - attempt.correct})` },
              { k: "correct", label: `Benar (${attempt.correct})` },
              { k: "unanswered", label: "Kosong" },
            ] as const).map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 transition-all ${
                  filter === f.k
                    ? "bg-teal-600 text-white border-teal-700"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Questions List */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div ref={questionsRef} className="flex flex-col gap-4">
            {filteredQuestions.map((q, idx) => {
              const ans = attempt.answers.find((a) => a.questionId === q.id);
              const userSel = ans?.selected;
              const isCorrect = ans?.correct ?? false;
              const premiumLocked = lockedIds.has(q.id);
              const relatedMateri = mockMateri.find((m) => m.subCategoryId === q.subCategoryId);

              return (
                <div
                  key={q.id}
                  data-question-id={q.id}
                  className="question-card group relative overflow-hidden rounded-[24px] border-2 bg-white transition-all duration-500 hover:shadow-xl"
                  style={{
                    borderColor: isCorrect ? "#86efac" : ans ? "#fca5a5" : "#e5e7eb",
                    borderBottomColor: isCorrect ? "#22c55e" : ans ? "#ef4444" : "#d1d5db",
                  }}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isCorrect
                              ? "bg-green-100 border-2 border-green-200 text-green-700"
                              : ans
                              ? "bg-red-100 border-2 border-red-200 text-red-700"
                              : "bg-stone-100 border-2 border-stone-200 text-stone-500"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2"
                          style={{
                            color: "#0d9488",
                            borderColor: "#99f6e455",
                            background: "#f0fdfa",
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          {getCategoryLabel(q.categoryId)}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          isCorrect
                            ? "bg-green-100 text-green-700"
                            : ans
                            ? "bg-red-100 text-red-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {isCorrect ? "Benar" : ans ? "Salah" : "Kosong"}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-lg font-semibold text-stone-800 leading-relaxed mb-5 max-w-4xl">
                      {q.question}
                    </p>

                    {/* Options */}
                    <div className="grid gap-2 mb-6">
                      {q.options.map((opt, i) => {
                        const isUser = userSel === i;
                        const isRight = q.correct === i;
                        const hideRight = premiumLocked && isRight && !isCorrect;
                        let cls = "bg-stone-50 border-stone-200 text-stone-600";
                        let icon = null;

                        if (isRight && !hideRight) {
                          cls = "bg-green-50 border-green-300 text-green-700";
                          icon = <CheckIcon className="w-4 h-4 text-green-600" />;
                        } else if (isUser && !isRight) {
                          cls = "bg-red-50 border-red-300 text-red-700";
                          icon = <XIcon className="w-4 h-4 text-red-500" />;
                        } else if (hideRight) {
                          cls = "bg-amber-50 border-amber-200 text-amber-700";
                          icon = <LockIcon className="w-4 h-4 text-amber-600" />;
                        }

                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm ${cls}`}
                          >
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-white border border-stone-200 shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className={`flex-1 ${hideRight ? "select-none blur-sm" : ""}`}>{opt}</span>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="rounded-[20px] border-2 overflow-hidden" style={{ borderColor: premiumLocked ? "#fcd34d" : "#14b8a630" }}>
                      <div className="px-4 py-3 border-b-2 flex items-center gap-2" style={{ borderColor: premiumLocked ? "#fcd34d" : "#14b8a630", background: premiumLocked ? "#fffbeb" : "#f0fdfa" }}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${premiumLocked ? "bg-amber-100 text-amber-600" : "bg-teal-100 text-teal-600"}`}>
                          {premiumLocked ? <LockIcon /> : <FileTextIcon />}
                        </div>
                        <span className="font-bold text-sm" style={{ color: premiumLocked ? "#92400e" : "#0f766e" }}>
                          {premiumLocked ? "Pembahasan Terkunci" : "Pembahasan"}
                        </span>
                      </div>

                      <div className="p-4">
                        {premiumLocked ? (
                          <div className="relative">
                            <p className="m-0 text-sm leading-relaxed text-stone-400 blur-sm select-none">
                              {q.explanation}
                            </p>
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                              <button
                                onClick={() => setShowPremium(true)}
                                className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm border-b-4 border-amber-800 hover:bg-amber-700 transition-all active:translate-y-[2px] active:border-b-0 shadow-lg"
                              >
                                <LockIcon className="w-4 h-4 inline mr-2" />
                                Unlock Pembahasan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="m-0 text-sm leading-relaxed text-stone-700">{q.explanation}</p>
                        )}
                      </div>
                    </div>

                    {/* Video */}
                    {q.videoUrl && !premiumLocked && isPremium && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 border-2 border-rose-200 flex items-center justify-center text-rose-600">
                            <PlayIcon />
                          </div>
                          <span className="font-bold text-sm text-stone-700">Video Pembelajaran</span>
                        </div>
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-[16px] bg-stone-900 border-2 border-stone-200">
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
                      <div className="mt-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                          <PlayIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-amber-900">Video Pembelajaran</div>
                          <div className="text-xs font-medium text-amber-700">Tersedia untuk member Premium</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPremium(true)}
                          className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 text-white font-bold text-xs border-b-4 border-amber-800 hover:bg-amber-700 transition-all active:translate-y-[2px] active:border-b-0"
                        >
                          Unlock
                        </button>
                      </div>
                    )}

                    {/* Related Materi */}
                    {!isCorrect && relatedMateri && isPremium && (
                      <Link
                        to="/coming-soon"
                        search={{ feature: "materi" }}
                        className="mt-4 flex items-center gap-4 p-4 rounded-xl bg-teal-50 border-2 border-teal-200 hover:bg-teal-100 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-teal-100 border-2 border-teal-200 flex items-center justify-center text-teal-600">
                          <BookIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-teal-900 truncate">{relatedMateri.title}</div>
                          <div className="text-xs font-medium text-teal-600">Pelajari topik ini lebih dalam</div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex gap-4">
            <Link
              to="/results/$attemptId"
              params={{ attemptId }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-stone-100 text-stone-700 font-bold border-b-4 border-stone-300 hover:bg-stone-200 transition-all active:translate-y-[2px] active:border-b-0"
            >
              <ArrowLeftIcon />
              Kembali
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-teal-600 text-white font-bold border-b-4 border-teal-800 hover:bg-teal-700 transition-all active:translate-y-[2px] active:border-b-0 shadow-lg shadow-teal-600/20"
            >
              <HomeIcon />
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => setShowPremium(false)}
      />
    </main>
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

// Icons
function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4V8z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

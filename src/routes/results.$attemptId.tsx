import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getLevelForXp, useApp } from "../data";
import { runConfetti } from "../utils/confetti";
import { PremiumDialog } from "../components/PremiumDialog";
import { BottomNav, TopBar } from "../components/Navigation";
import { getAttemptResult, listProgressSummary } from "../lib/student-functions";

const FREE_WRONG_PREVIEW = 3;

type WrongAnswerView = {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  explanationPreview?: string;
  videoUrl?: string;
  accessLevel: "free" | "premium";
  user: string;
};

export const Route = createFileRoute("/results/$attemptId")({
  loader: async ({ params }) => {
    const [result, summary] = await Promise.all([
      getAttemptResult({ data: { attemptId: params.attemptId } }),
      listProgressSummary(),
    ]);

    return { result, summary };
  },
  head: () => ({
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
  const { result, summary } = Route.useLoaderData() as {
    result: Awaited<ReturnType<typeof getAttemptResult>>;
    summary: Awaited<ReturnType<typeof listProgressSummary>>;
  };
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPremiumMembership } = useApp();
  const isChildRoute = location.pathname !== `/results/${attemptId}`;

  const { attempt, tryout, questions } = result;
  const hasFullTryoutAccess = tryout.accessLevel !== "free";

  const score = attempt.score;
  const total = attempt.totalQuestions;
  const xpEarn = attempt.xpEarned;
  const levelInfo = getLevelForXp(summary.xp);
  const isFirstAttempt = attempt.attemptNumber === 1;
  const duration = attempt.submittedAt
    ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)
    : 0;

  const dash = 339;
  const off = dash - (dash * score) / 100;
  const passed = score >= 70;
  const accent = passed ? "#205072" : "#f59e0b";
  const accentDark = passed ? "#153d5c" : "#b45309";

  const correct = questions.filter((question) => question.isCorrect === true).length;
  const wrongCount = questions.filter((question) => question.selectedIndex !== null && question.isCorrect === false).length;
  const answered = correct + wrongCount;
  const unansweredCount = Math.max(total - answered, 0);
  const grade = getGradeLabel(score);

  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const wrongs: WrongAnswerView[] = questions
    .filter((question) => question.selectedIndex !== null && question.isCorrect === false)
    .map((q) => {
      return {
        id: q.snapshotId,
        subject: q.categoryName.toUpperCase(),
        question: q.questionText,
        options: q.options,
        correct: q.correctIndex,
        explanation: q.explanation,
        explanationPreview: q.explanation.slice(0, 120) + "...",
        videoUrl: q.videoUrl ?? undefined,
        accessLevel: q.accessLevel,
        user: q.selectedIndex !== null ? q.options[q.selectedIndex] : "Tidak dijawab",
      };
    });
  const hasFullReviewAccess = hasPremiumMembership || hasFullTryoutAccess;
  const lockedCount = hasFullReviewAccess ? 0 : Math.max(0, wrongs.length - FREE_WRONG_PREVIEW);

  const openPremiumAccess = () => {
    if (tryout?.accessLevel === "platinum") {
      setShowPremiumDialog(true);
      return;
    }

    navigate({ to: "/premium" });
  };

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
      const timer = setTimeout(runConfetti, 120);
      return () => clearTimeout(timer);
    }
  }, [score, passed]);

  const pageBg = passed
    ? "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)"
    : "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 42%, #eef8f6 100%)";

  const headerBg = passed
    ? "radial-gradient(900px 340px at 10% -18%, rgba(32,80,114,0.22), transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)"
    : "radial-gradient(900px 340px at 10% -18%, #f59e0b33, transparent 62%), radial-gradient(760px 340px at 94% -14%, rgba(32,80,114,0.09), transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)";

  if (isChildRoute) {
    return <Outlet />;
  }

  return (
    <>
      <div className="app-shell page-enter relative" style={{ background: pageBg }}>
        <canvas id="confetti" className="pointer-events-none fixed inset-0 z-[5]" />

        <div className="relative overflow-hidden pb-8" style={{ background: headerBg }}>
          <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
          <div className="page-lane pt-7 lg:pt-10">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Hasil Tryout
            </div>
            <h1 className="mt-2 max-w-[20ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
              {passed ? "Kerja bagus, pertahankan!" : "Semangat, coba lagi!"}
            </h1>
            <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
              {tryout?.title} · Attempt #{attempt.attemptNumber}
              {duration > 0 ? ` · ${duration} menit` : ""}
            </p>
          </div>
        </div>

        <div className="page-lane relative -mt-4 pb-28">
          {lockedCount > 0 && (
            <PremiumUnlockBanner count={lockedCount} onOpen={openPremiumAccess} />
          )}

          <div
            className="relative overflow-hidden rounded-[var(--radius-xl)] border-2 border-b-4 p-5 shadow-sm sm:p-6"
            style={{
              borderColor: `${accent}33`,
              borderBottomColor: `${accent}55`,
              background: `linear-gradient(180deg, ${accent}10 0%, rgba(255,255,255,0.97) 58%)`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background: `radial-gradient(520px 200px at 110% -10%, ${accent}22, transparent 70%), radial-gradient(360px 200px at -10% 120%, ${accent}18, transparent 68%)`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: "radial-gradient(rgba(15,23,42,0.9) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />

            <div className="relative grid grid-flow-dense gap-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-8">
              <div className="relative mx-auto h-[172px] w-[172px] shrink-0 sm:mx-0">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <defs>
                    <linearGradient id={`ring-${passed ? "ok" : "no"}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={accent} />
                      <stop offset="100%" stopColor={accentDark} />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="54" stroke="#ece9e4" strokeWidth="11" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={`url(#ring-${passed ? "ok" : "no"})`}
                    strokeWidth="11"
                    fill="none"
                    strokeDasharray={dash}
                    strokeDashoffset={off}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 900ms ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[46px] font-bold leading-none tracking-tight" style={{ color: accentDark }}>
                    {displayScore}
                    <span className="text-[20px] font-semibold text-stone-400">%</span>
                  </b>
                  <span className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Akurasi
                  </span>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: accentDark, borderColor: `${accent}33`, background: `${accent}14` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                    {passed ? "Lulus Standar" : "Belum Lulus"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-stone-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    Grade {grade}
                  </span>
                </div>

                <div className="flex items-end gap-5">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      XP diperoleh
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[36px] font-bold leading-none tracking-tight text-stone-800 sm:text-[40px]">
                        +{xpEarn}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">XP</span>
                    </div>
                  </div>
                  <div className="hidden h-9 w-px bg-stone-200/80 sm:block" />
                  <div className="hidden min-w-0 sm:block">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      Level
                    </div>
                    <div className="mt-1 text-[18px] font-bold leading-none tracking-tight text-stone-800">
                      Lv.{levelInfo.level}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] font-medium text-stone-500">
                  <BreakdownDot color="#205072" label="Benar" value={correct} />
                  <BreakdownDot color="#ef4444" label="Salah" value={wrongCount} />
                  <BreakdownDot color="#a8a29e" label="Kosong" value={unansweredCount} />
                </div>

                {!isFirstAttempt && (
                  <p className="m-0 max-w-[36ch] text-[12px] font-medium text-stone-400">
                    Retake #{attempt.attemptNumber} · XP dikurangi 75%.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-flow-dense grid-cols-3 gap-3">
            <StatCard icon={<TargetIcon />} label="Benar" value={`${correct}/${total}`} accent="#205072" />
            <StatCard icon={<ClockIcon />} label="Durasi" value={duration > 0 ? `${duration} min` : "-"} accent="#0ea5e9" />
            <StatCard icon={<FlameIcon />} label="Streak" value={`${summary.streak} hari`} accent="#f59e0b" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to="/tryout/$id"
              params={{ id: attempt.tryoutId }}
              className="btn btn-white"
            >
              <RefreshIcon />
              Coba Lagi
            </Link>
            <Link
              to="/results/$attemptId/review"
              params={{ attemptId: String(attempt.id) }}
              className="btn btn-primary"
            >
              <BookIcon />
              Review Pembahasan
            </Link>
          </div>

          <Link
            to="/dashboard"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-3 text-[13px] font-semibold text-stone-500 no-underline transition-colors duration-150 hover:text-stone-800"
          >
            <HomeIcon />
            Kembali ke Dashboard
          </Link>

          {wrongs.length > 0 && (
            <div className="mt-10">
              <SectionHeader
                title={`Soal Salah · ${wrongs.length}`}
                action="Lihat semua"
                attemptId={attempt.id}
                filter="wrong"
              />
              <div className="grid gap-3">
                {wrongs.map((w, i) => (
                  <WrongCard
                    key={w.id}
                    wrong={w}
                    locked={!hasFullReviewAccess && i >= FREE_WRONG_PREVIEW}
                    attemptId={attempt.id}
                  />
                ))}
              </div>
              {correct > 0 && (
                <Link
                  to="/results/$attemptId/review"
                  params={{ attemptId: String(attempt.id) }}
                  search={{ filter: "correct" as const }}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-stone-500 no-underline hover:text-stone-800"
                >
                  <CheckIcon />
                  Lihat soal benar ({correct})
                </Link>
              )}
            </div>
          )}
        </div>

        <BottomNav active="tryout" />
      </div>

      <PremiumDialog
        isOpen={showPremiumDialog}
        onClose={() => setShowPremiumDialog(false)}
        onUpgrade={() => setShowPremiumDialog(false)}
        hasPremiumMembership={hasPremiumMembership}
        tryout={null}
      />
    </>
  );
}

function PremiumUnlockBanner({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-[var(--radius-xl)] border-2 border-b-4 border-amber-300 border-b-amber-600 bg-[#2f281c] p-4 text-amber-50 shadow-sm sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(320px 180px at 90% 0%, rgba(245,158,11,0.28), transparent 70%), radial-gradient(260px 180px at 0% 100%, rgba(20,184,166,0.18), transparent 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2 border-amber-300/45 bg-amber-400/15 text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <LockIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
            Premium
          </div>
          <b className="mt-0.5 block text-[15px] font-bold leading-tight text-amber-50">
            {count} pembahasan terkunci
          </b>
          <p className="m-0 mt-1 max-w-[30ch] text-[12.5px] font-medium leading-relaxed text-amber-100/75">
            Buka penjelasan, video, dan materi terkait.
          </p>
        </div>
        <button
          type="button"
          className="btn shrink-0 btn-sm"
          style={{
            background: "#f5b544",
            color: "#2f281c",
            borderBottomColor: "#b45309",
          }}
          onClick={onOpen}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border-2 border-b-4 p-3.5 shadow-sm"
      style={{
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.94) 72%)`,
        borderColor: `${accent}22`,
        borderBottomColor: `${accent}38`,
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl border-2"
        style={{ color: accent, background: `${accent}18`, borderColor: `${accent}22` }}
      >
        {icon}
      </div>
      <div className="mt-3 text-[18px] font-bold leading-none tracking-tight text-stone-800">
        {value}
      </div>
      <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  attemptId,
  filter,
}: {
  title: string;
  action?: string;
  attemptId: string;
  filter?: "all" | "wrong" | "correct" | "unanswered";
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </span>
      <div className="h-px flex-1 bg-stone-200" />
      {action && (
        <Link
          to="/results/$attemptId/review"
          params={{ attemptId: String(attemptId) }}
          search={filter ? { filter } : {}}
          className="text-[12px] font-bold text-primary no-underline"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function WrongCard({
  wrong,
  locked,
  attemptId,
}: {
  wrong: WrongAnswerView;
  locked: boolean;
  attemptId: string;
}) {
  return (
    <Link
      to="/results/$attemptId/review"
      params={{ attemptId: String(attemptId) }}
      search={{ q: wrong.id, filter: "wrong" as const }}
      className="group relative block rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-4 pr-10 no-underline shadow-sm transition-all duration-150 hover:-translate-y-[2px] hover:border-stone-200 hover:shadow-md"
    >
      <span
        className="inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "#153d5c", borderColor: "rgba(32,80,114,0.20)", background: "rgba(32,80,114,0.06)" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {wrong.subject}
      </span>
      <p className="m-0 mt-2 max-w-[52ch] text-[14px] font-semibold leading-relaxed text-stone-800">
        {wrong.question}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-medium">
        <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
          <XIcon />
          <span className="max-w-[26ch] truncate">{wrong.user}</span>
        </span>
        {locked ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
              <path d="M7 11V8a5 5 0 0 1 10 0v3M6.8 11h10.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-5.4c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Jawaban terkunci
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-green-200 bg-green-50 px-2.5 py-1 text-green-700">
            <CheckIcon />
            <span className="max-w-[26ch] truncate">{wrong.options[wrong.correct]}</span>
          </span>
        )}
      </div>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 transition-colors group-hover:text-stone-500">
        <ChevronRightIcon />
      </span>
    </Link>
  );
}

function getGradeLabel(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "A-";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function BreakdownDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span>
        <span className="font-bold text-stone-800">{value}</span> {label}
      </span>
    </span>
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

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 22c4.1 0 7-2.8 7-6.8 0-3.5-2-5.8-4.4-7.7-.7 2-1.8 3.1-3.3 3.8.3-2.9-1.1-5.2-3.7-7.3C7.4 7.4 5 10.2 5 15.2 5 19.2 7.9 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 4.8A2.8 2.8 0 0 1 7.8 2H19v17H7.8A2.8 2.8 0 0 0 5 21.8v-17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18.2A2.8 2.8 0 0 1 7.8 15H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3M6.8 11h10.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-5.4c0-1 .8-1.8 1.8-1.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { useApp } from "../data";
import { restoreReturnScroll, saveReturnScroll } from "../lib/return-scroll";
import { listProgressSummary } from "../lib/student-functions";

type ProgressSummary = Awaited<ReturnType<typeof listProgressSummary>>;
type EvaluationCategory = ProgressSummary["categories"][number];
type EvaluationAttempt = ProgressSummary["attempts"][number];

export const Route = createFileRoute("/evaluation")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Evaluation Dashboard — IlmoraX" },
      { name: "description", content: "Analisis performa belajar lengkap. Lihat akurasi, breakdown kategori, pola salah, dan rekomendasi prioritas latihan. Fitur Premium." },
      { property: "og:title", content: "Evaluation Dashboard — IlmoraX" },
      { property: "og:description", content: "Analisis performa belajar lengkap. Lihat akurasi, breakdown kategori, dan rekomendasi latihan." },
    ],
  }),
  component: EvaluationComponent,
});

function EvaluationComponent() {
  const { summary } = Route.useLoaderData() as { summary: ProgressSummary };
  const { hasPremiumMembership } = useApp();
  const totalQuestions = summary.totalQuestions;
  const totalCorrect = summary.totalCorrect;
  const totalWrong = totalQuestions - totalCorrect;
  const pctCorrect = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const recommendation = getRecommendation(summary);

  useEffect(() => {
    restoreReturnScroll("evaluation");
  }, []);

  return (
    <main
      className="app-shell overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 340px at 8% -18%, rgba(32,80,114,0.22), transparent 62%), radial-gradient(720px 340px at 94% -12%, #f59e0b20, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
        <div className="page-lane pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Evaluation Dashboard
              </div>
              <h1 className="mt-2 max-w-[22ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800">
                Baca pola performa belajarmu
              </h1>
              <p className="m-0 mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500">
                Lihat akurasi, kategori kuat, dan area yang perlu jadi prioritas latihan berikutnya.
              </p>
            </div>
            <span className="rounded-full border-2 border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
              {hasPremiumMembership ? "Premium ON" : "Free"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 grid-flow-dense">
            <SummaryCard label="Soal Dikerjakan" value={String(totalQuestions)} accent="#205072" icon={<DocumentIcon />} />
            <SummaryCard label="Jawaban Benar" value={String(totalCorrect)} accent="#22c55e" icon={<CheckCircleIcon />} />
            <SummaryCard label="Jawaban Salah" value={String(totalWrong)} accent="#fb7185" icon={<XCircleIcon />} />
            <SummaryCard label="Akurasi" value={`${pctCorrect}%`} accent="#f59e0b" icon={<TargetIcon />} />
          </div>
        </div>
      </div>

      <div className="page-lane relative -mt-4 pb-28">
        <InsightPanel
          pctCorrect={pctCorrect}
          recommendation={recommendation}
          isPremium={hasPremiumMembership}
        />

        <div className="mt-6">
          <SectionHeader title="Breakdown Kategori" />
          <div className="grid gap-4">
            {summary.categories.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                isPremium={hasPremiumMembership}
              />
            ))}

            {summary.categories.length === 0 && (
              <EmptyPanel message="Belum ada data kategori. Selesaikan Try-out pertama untuk membuka analisis." />
            )}
          </div>
        </div>

        <div className="mt-6">
          <SectionHeader title="Riwayat Try-out" />
          {!hasPremiumMembership ? (
            <LockedAttempts />
          ) : (
            <div className="grid gap-3">
              {summary.attempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
              {summary.attempts.length === 0 && (
                <EmptyPanel message="Belum ada Attempt tersubmit." />
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="learn" />
    </main>
  );
}

function InsightPanel({
  pctCorrect,
  recommendation,
  isPremium,
}: {
  pctCorrect: number;
  recommendation: string;
  isPremium: boolean;
}) {
  return (
    <div
      className="rounded-[var(--radius-xl)] border-2 border-b-4 p-5 shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(235,250,247,0.98) 0%, rgba(255,252,245,0.98) 100%)",
        borderColor: "#cfe7df",
        borderBottomColor: "#a9d1c6",
      }}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={<SparkIcon />} accent="#205072" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            Rekomendasi
          </div>
          <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-stone-800">
            Rekomendasi belajar
          </h2>
          <p className="m-0 mt-2 max-w-[31ch] text-[13.5px] font-medium leading-relaxed text-stone-500">
            Akurasi keseluruhanmu {pctCorrect}%. {recommendation}
          </p>
        </div>
      </div>

      {!isPremium && (
        <Link to="/premium" className="btn mt-4 w-full" style={{ background: "#2f281c", color: "#fff7ed", borderBottomColor: "#a16207" }}>
          Buka Analisis Premium
        </Link>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  isPremium,
}: {
  category: EvaluationCategory;
  isPremium: boolean;
}) {
  const categoryTotal = category.total;
  const categoryCorrect = category.correct;
  const categoryPct = categoryTotal > 0 ? Math.round((categoryCorrect / categoryTotal) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <b className="text-base font-bold text-stone-800">{category.name}</b>
            <div className="mt-1 text-xs font-semibold text-stone-500">
              {categoryCorrect}/{categoryTotal} soal benar
            </div>
          </div>
          <ScorePill value={categoryPct} />
        </div>
      </div>

      <div className={`relative ${!isPremium ? "select-none" : ""}`}>
        <div className="divide-y divide-stone-100 border-t border-stone-100">
          {category.subCategories.map((subcategory) => (
            <SubcategoryRow
              key={subcategory.name}
              subcategory={subcategory}
              isBlurred={!isPremium}
            />
          ))}
        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center rounded-b-[var(--radius-lg)] bg-amber-50/86 px-5 backdrop-blur-[1px]">
            <Link to="/premium" className="btn btn-sm" style={{ background: "#2f281c", color: "#fff7ed", borderBottomColor: "#a16207" }}>
              Unlock Breakdown
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SubcategoryRow({
  subcategory,
  isBlurred,
}: {
  subcategory: { name: string; total: number; correct: number };
  isBlurred: boolean;
}) {
  const pct = subcategory.total > 0 ? Math.round((subcategory.correct / subcategory.total) * 100) : 0;

  return (
    <div className={isBlurred ? "blur-[3px] opacity-70" : ""}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-stone-700">{subcategory.name}</div>
          <div className="mt-0.5 text-xs font-semibold text-stone-400">
            {subcategory.correct}/{subcategory.total} soal benar
          </div>
        </div>
        <ScorePill value={pct} compact />
      </div>
    </div>
  );
}

function LockedAttempts() {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-center text-amber-50 shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border-2 border-amber-300/45 bg-amber-400/15 text-amber-200">
        <TimelineIcon />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-amber-50">Riwayat lengkap untuk Premium</h2>
      <p className="mx-auto mt-2 max-w-[30ch] text-sm font-medium leading-relaxed text-amber-100/72">
        Buka tren try-out, XP, dan kualitas skor dari waktu ke waktu.
      </p>
      <Link to="/premium" className="btn mt-4 w-full" style={{ background: "#f5b544", color: "#2f281c", borderBottomColor: "#b45309" }}>
        Upgrade ke Premium
      </Link>
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: EvaluationAttempt }) {
  const accent = attempt.score >= 70 ? "#22c55e" : "#fb7185";

  return (
    <Link
      to="/results/$attemptId/review"
      params={{ attemptId: attempt.id }}
      search={{ returnTo: "evaluation" }}
      onClick={() => saveReturnScroll("evaluation")}
      className="group flex items-center gap-4 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-4 text-stone-800 no-underline shadow-sm transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
        style={{
          color: accent,
          background: `${accent}12`,
          borderColor: `${accent}35`,
        }}
      >
        {attempt.score}%
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-bold text-stone-800">{attempt.tryoutTitle}</b>
        <div className="mt-0.5 flex gap-3 text-xs font-medium text-stone-400">
          <span>Try-out ke-{attempt.attemptNumber}</span>
          {attempt.submittedAt && <span>{formatDate(attempt.submittedAt)}</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-bold text-amber">+{attempt.xpEarned} XP</div>
        <div className="mt-0.5 text-[11px] font-bold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Review
        </div>
      </div>
    </Link>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-5 text-center shadow-sm">
      <p className="m-0 text-sm font-semibold leading-relaxed text-stone-400">{message}</p>
    </div>
  );
}

function getRecommendation(summary: ProgressSummary) {
  if (summary.totalQuestions === 0) {
    return "Mulai dari Try-out gratis untuk membangun baseline performa.";
  }

  const weakestSubCategory = summary.categories
    .flatMap((category) => category.subCategories.map((subCategory) => ({
      ...subCategory,
      categoryName: category.name,
      accuracy: subCategory.total > 0 ? subCategory.correct / subCategory.total : 1,
    })))
    .filter((subCategory) => subCategory.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  if (weakestSubCategory) {
    return `Prioritaskan ${weakestSubCategory.name} di ${weakestSubCategory.categoryName}.`;
  }

  return "Lanjutkan retake untuk memperjelas area prioritas.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border-2 border-b-4 p-4 shadow-sm"
      style={{
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.92) 72%)`,
        borderColor: `${accent}22`,
        borderBottomColor: `${accent}36`,
      }}
    >
      <SmallIconTile icon={icon} accent={accent} />
      <div className="mt-3 text-[22px] font-bold leading-none tracking-tight text-stone-800">{value}</div>
      <div className="mt-1 text-[10.5px] font-semibold leading-tight text-stone-400">{label}</div>
    </div>
  );
}

function ScorePill({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <span className={`shrink-0 rounded-full border-2 border-brand-sky bg-primary-tint font-bold text-primary-dark ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}>
      {value}%
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">{title}</span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

function IconTile({ icon, accent }: { icon: React.ReactNode; accent: string }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}33`,
      }}
    >
      {icon}
    </div>
  );
}

function SmallIconTile({ icon, accent }: { icon: React.ReactNode; accent: string }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-xl border-2"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}30`,
      }}
    >
      {icon}
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M12 3 14.2 8.8 20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M6 5v14M18 5v14M6 8h7a3 3 0 0 1 0 6H6M18 16h-7a3 3 0 0 1 0-6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

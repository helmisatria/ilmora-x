import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, TopBar } from "../../components/Navigation";
import { restoreReturnScroll, saveReturnScroll } from "../../lib/return-scroll";
import { getDashboardPalette } from "../dashboard/dashboard-view-model";
import type { listProgressSummary } from "../student/student-progress-functions";
import {
  getAccuracyPct,
  getAccuracyTone,
  getFocusTopics,
  getScoreTrend,
  sortCategoriesByWeakness,
  STRONG_ACCURACY,
  type AccuracyTone,
} from "./evaluation-insights";

type ProgressSummary = Awaited<ReturnType<typeof listProgressSummary>>;
type EvaluationCategory = ProgressSummary["categories"][number];
type EvaluationAttempt = ProgressSummary["attempts"][number];

const VISIBLE_ATTEMPTS = 5;

const toneStyles: Record<AccuracyTone, { color: string; label: string }> = {
  strong: { color: "#16a34a", label: "Kuat" },
  medium: { color: "#d97706", label: "Cukup" },
  weak: { color: "#e11d48", label: "Perlu fokus" },
};

export function EvaluationPage({ summary }: { summary: ProgressSummary }) {
  const palette = getDashboardPalette();
  const isPremium = summary.hasPremiumEvaluation;
  const hasData = summary.totalQuestions > 0;

  useEffect(() => {
    restoreReturnScroll("evaluation");
  }, []);

  return (
    <main className="app-shell overflow-x-hidden" style={{ background: palette.page }}>
      <div className="relative overflow-hidden pb-8" style={{ background: palette.header }}>
        <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
        <div className="page-lane pt-5 sm:pt-7 lg:pt-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Evaluasi</div>
              <h1 className="mt-1 max-w-[18ch] text-[24px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
                Performa belajarmu
              </h1>
              <p className="m-0 mt-1.5 max-w-[44ch] text-[13px] font-medium leading-snug text-stone-500 sm:mt-3 sm:text-[15px] sm:leading-relaxed">
                Lihat seberapa akurat jawabanmu dan topik mana yang perlu dilatih berikutnya.
              </p>
            </div>
            <MembershipBadge isPremium={isPremium} />
          </div>

          {hasData && <AccuracyPanel summary={summary} isPremium={isPremium} />}
        </div>
      </div>

      <div className="page-lane relative -mt-4 pb-28">
        {hasData ? <EvaluationContent summary={summary} isPremium={isPremium} /> : <EmptyEvaluation isPremium={isPremium} />}
      </div>

      <BottomNav active="learn" />
    </main>
  );
}

function EvaluationContent({ summary, isPremium }: { summary: ProgressSummary; isPremium: boolean }) {
  const categories = sortCategoriesByWeakness([...summary.categories]);
  const focusTopics = isPremium ? getFocusTopics(summary.categories) : [];
  const trend = getScoreTrend(summary.attempts);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
      <div className="grid gap-6">
        {isPremium && trend.scores.length >= 2 && (
          <section>
            <SectionHeader title="Tren skor" />
            <TrendCard scores={trend.scores} delta={trend.delta} />
          </section>
        )}

        <section>
          <SectionHeader title="Per kategori" hint="Terlemah di atas" />
          <div className="grid gap-3">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} isPremium={isPremium} defaultOpen={index === 0} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6">
        {isPremium ? (
          <section>
            <SectionHeader title="Topik yang perlu diperkuat" />
            <FocusTopics topics={focusTopics} />
          </section>
        ) : (
          <PremiumUpsell />
        )}

        <section>
          <SectionHeader title="Langkah berikutnya" />
          <NextSteps summary={summary} focusTopic={isPremium ? focusTopics[0]?.name ?? null : categories[0]?.name ?? null} />
        </section>

        {isPremium && (
          <section>
            <SectionHeader title="Riwayat try-out" />
            <AttemptHistory attempts={summary.attempts} />
          </section>
        )}
      </div>
    </div>
  );
}

function MembershipBadge({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
        <CrownIcon className="h-3.5 w-3.5" />
        Premium
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full border-2 border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
      Free
    </span>
  );
}

function AccuracyPanel({ summary, isPremium }: { summary: ProgressSummary; isPremium: boolean }) {
  const totalWrong = summary.totalQuestions - summary.totalCorrect;
  const accuracy = getAccuracyPct({ correct: summary.totalCorrect, total: summary.totalQuestions });
  const tone = getAccuracyTone(accuracy);
  const { delta } = getScoreTrend(summary.attempts);

  return (
    <div
      className="mt-5 rounded-[var(--radius-xl)] border-2 border-b-4 p-4 shadow-sm sm:p-5"
      style={{
        background: "linear-gradient(135deg, rgba(235,250,247,0.98) 0%, rgba(255,252,245,0.98) 100%)",
        borderColor: "#cfe7df",
        borderBottomColor: "#a9d1c6",
      }}
    >
      <div className="flex items-center gap-4">
        <AccuracyRing pct={accuracy} tone={tone} />
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Akurasi keseluruhan</div>
          <div className="mt-1 text-lg font-bold leading-tight tracking-tight text-stone-800">{getAccuracyHeadline(tone)}</div>
          <p className="m-0 mt-1 text-[12.5px] font-medium leading-snug text-stone-500">
            {summary.totalCorrect} benar dan {totalWrong} salah dari {summary.totalQuestions} soal.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatCard icon={<ChartIcon />} label="Try-out" value={String(summary.totalAttempts)} accent="#205072" />
        <StatCard icon={<CheckIcon />} label="Soal benar" value={String(summary.totalCorrect)} accent="#16a34a" />
        <TrendStat isPremium={isPremium} delta={delta} />
      </div>
    </div>
  );
}

function getAccuracyHeadline(tone: AccuracyTone) {
  if (tone === "strong") return "Sudah kuat, pertahankan";
  if (tone === "medium") return "Cukup baik, terus naikkan";
  return "Masih perlu banyak latihan";
}

function AccuracyRing({ pct, tone }: { pct: number; tone: AccuracyTone }) {
  const color = toneStyles[tone].color;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative h-[92px] w-[92px] shrink-0" role="img" aria-label={`Akurasi ${pct} persen`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#ffffff" strokeWidth="10" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={`${color}26`} strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[22px] font-bold tracking-tight text-stone-800">
        {pct}%
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
      className="rounded-[var(--radius-lg)] border-2 border-b-4 p-3 shadow-sm"
      style={{
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.92) 72%)`,
        borderColor: `${accent}22`,
        borderBottomColor: `${accent}36`,
      }}
    >
      <IconTile icon={icon} accent={accent} />
      <div className="mt-2.5 text-lg font-bold leading-none tracking-tight text-stone-800">{value}</div>
      <div className="mt-1 text-[10.5px] font-semibold leading-tight text-stone-400">{label}</div>
    </div>
  );
}

function TrendStat({ isPremium, delta }: { isPremium: boolean; delta: number | null }) {
  if (!isPremium) {
    return <StatCard icon={<LockIcon />} label="Tren skor" value="Premium" accent="#f59e0b" />;
  }

  if (delta === null) {
    return <StatCard icon={<TrendIcon />} label="Tren skor" value="-" accent="#0ea5e9" />;
  }

  const accent = delta >= 0 ? "#16a34a" : "#e11d48";
  const sign = delta > 0 ? "+" : "";

  return <StatCard icon={<TrendIcon />} label="Skor vs sebelumnya" value={`${sign}${delta}`} accent={accent} />;
}

function TrendCard({ scores, delta }: { scores: number[]; delta: number | null }) {
  const latest = scores[scores.length - 1] ?? 0;

  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12.5px] font-bold text-stone-800">{scores.length} try-out terakhir</div>
          <div className="mt-0.5 text-xs font-medium text-stone-400">{describeTrend(delta)}</div>
        </div>
        <ScorePill value={latest} />
      </div>

      <div className="mt-4 flex h-24 items-end gap-1.5 sm:gap-2" role="img" aria-label={`Skor try-out terakhir: ${scores.join(", ")} persen`}>
        {scores.map((score, index) => {
          const color = toneStyles[getAccuracyTone(score)].color;

          return (
            <div key={index} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-bold text-stone-500">{score}</span>
              <div
                className="w-full rounded-t-md"
                style={{ height: `${Math.max(score, 4)}%`, background: color, opacity: index === scores.length - 1 ? 1 : 0.55 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function describeTrend(delta: number | null) {
  if (delta === null || delta === 0) return "Skor terakhir sama dengan sebelumnya";
  if (delta > 0) return `Naik ${delta} poin dari try-out sebelumnya`;

  return `Turun ${Math.abs(delta)} poin dari try-out sebelumnya`;
}

function CategoryCard({
  category,
  isPremium,
  defaultOpen,
}: {
  category: EvaluationCategory;
  isPremium: boolean;
  defaultOpen: boolean;
}) {
  const pct = getAccuracyPct(category);
  const hasDetails = isPremium && category.subCategories.length > 0;

  return (
    <details
      className="group overflow-hidden rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white shadow-sm"
      open={hasDetails && defaultOpen}
    >
      <summary
        className={`list-none p-4 [&::-webkit-details-marker]:hidden ${hasDetails ? "cursor-pointer" : "pointer-events-none"}`}
        tabIndex={hasDetails ? 0 : -1}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: category.color }} aria-hidden="true" />
            <div className="min-w-0">
              <b className="block break-words text-[15px] font-bold leading-tight text-stone-800">{category.name}</b>
              <div className="mt-1 text-xs font-medium text-stone-400">
                {category.correct}/{category.total} soal benar
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ScorePill value={pct} />
            {hasDetails && (
              <ChevronIcon className="h-5 w-5 text-stone-300 transition-transform duration-200 group-open:rotate-90" />
            )}
          </div>
        </div>
        <ProgressBar pct={pct} className="mt-3" />
        {hasDetails && (
          <div className="mt-2 text-[11px] font-semibold text-primary">
            <span className="group-open:hidden">Lihat {category.subCategories.length} subkategori</span>
            <span className="hidden group-open:inline">Sembunyikan</span>
          </div>
        )}
      </summary>

      {hasDetails && (
        <div className="grid gap-2.5 border-t border-stone-100 bg-stone-50/70 p-3">
          {sortCategoriesByWeakness([...category.subCategories]).map((subCategory) => (
            <SubcategoryBlock key={subCategory.id} subCategory={subCategory} />
          ))}
        </div>
      )}
    </details>
  );
}

function SubcategoryBlock({ subCategory }: { subCategory: EvaluationCategory["subCategories"][number] }) {
  const pct = getAccuracyPct(subCategory);
  const topics = sortCategoriesByWeakness([...subCategory.topics]);
  // A lone topic named like its Sub-category adds nothing, so only show the Sub-category row.
  const showTopics = topics.length > 1 || (topics.length === 1 && topics[0]?.name !== subCategory.name);

  return (
    <div className="rounded-[var(--radius-md)] border border-stone-100 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-sm font-bold leading-tight text-stone-700">{subCategory.name}</div>
          <div className="mt-0.5 text-xs font-medium text-stone-400">
            {subCategory.correct}/{subCategory.total} soal benar
          </div>
        </div>
        <ScorePill value={pct} compact />
      </div>

      {showTopics && (
        <ul className="m-0 mt-3 grid list-none gap-2.5 border-t border-stone-100 p-0 pt-3">
          {topics.map((topic) => {
            const topicPct = getAccuracyPct(topic);

            return (
              <li key={topic.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-words text-xs font-semibold text-stone-600">{topic.name}</span>
                  <span className="shrink-0 text-[11px] font-bold" style={{ color: toneStyles[getAccuracyTone(topicPct)].color }}>
                    {topic.correct}/{topic.total} ({topicPct}%)
                  </span>
                </div>
                <ProgressBar pct={topicPct} className="mt-1.5" thin />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FocusTopics({ topics }: { topics: ReturnType<typeof getFocusTopics> }) {
  if (topics.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border-2 border-success/25 border-b-4 border-b-success/40 bg-success/5 p-4 shadow-sm">
        <IconTile icon={<CheckIcon />} accent="#16a34a" />
        <p className="m-0 text-sm font-semibold leading-relaxed text-stone-600">
          Semua topik sudah di atas {STRONG_ACCURACY}%. Pertahankan dengan try-out baru.
        </p>
      </div>
    );
  }

  return (
    <ol className="m-0 grid list-none gap-3 p-0">
      {topics.map((topic, index) => (
        <li
          key={topic.id}
          className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold"
              style={{ color: topic.color, background: `${topic.color}18`, borderColor: `${topic.color}33` }}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block break-words text-[15px] font-bold leading-tight text-stone-800">{topic.name}</b>
              <div className="mt-1 break-words text-xs font-medium text-stone-400">
                {topic.subCategoryName} / {topic.categoryName}
              </div>
            </div>
            <ScorePill value={topic.pct} compact />
          </div>
          <ProgressBar pct={topic.pct} className="mt-3" thin />
          <div className="mt-1.5 text-[11px] font-semibold text-stone-400">
            {topic.correct} benar dari {topic.total} soal
          </div>
        </li>
      ))}
    </ol>
  );
}

function NextSteps({ summary, focusTopic }: { summary: ProgressSummary; focusTopic: string | null }) {
  const latestAttempt = summary.attempts[0];
  const latestWrong = latestAttempt ? latestAttempt.totalQuestions - latestAttempt.correctCount : 0;

  return (
    <div className="grid gap-3">
      <Link to="/tryout" className="card shadow-sm no-underline">
        <IconTile icon={<BookIcon />} accent="#205072" size="lg" />
        <div className="min-w-0 flex-1">
          <b className="block text-[15px] font-bold leading-tight text-stone-800">
            {focusTopic ? `Latih ${focusTopic}` : "Kerjakan try-out baru"}
          </b>
          <div className="mt-1 text-xs font-medium leading-snug text-stone-400">
            {focusTopic ? "Pilih try-out yang memuat materi ini lalu cek lagi akurasinya." : "Jaga ritme dan bandingkan skormu."}
          </div>
        </div>
        <ChevronIcon className="h-5 w-5 shrink-0 text-stone-300" />
      </Link>

      {latestAttempt && latestWrong > 0 && (
        <Link
          to="/results/$attemptId/review"
          params={{ attemptId: latestAttempt.id }}
          search={{ returnTo: "evaluation" }}
          onClick={() => saveReturnScroll("evaluation")}
          className="card shadow-sm no-underline"
        >
          <IconTile icon={<ReviewIcon />} accent="#f59e0b" size="lg" />
          <div className="min-w-0 flex-1">
            <b className="block text-[15px] font-bold leading-tight text-stone-800">Review {latestWrong} soal salah</b>
            <div className="mt-1 truncate text-xs font-medium text-stone-400">{latestAttempt.tryoutTitle}</div>
          </div>
          <ChevronIcon className="h-5 w-5 shrink-0 text-stone-300" />
        </Link>
      )}
    </div>
  );
}

function AttemptHistory({ attempts }: { attempts: EvaluationAttempt[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleAttempts = showAll ? attempts : attempts.slice(0, VISIBLE_ATTEMPTS);
  const hiddenCount = attempts.length - visibleAttempts.length;

  return (
    <div className="grid gap-3">
      {visibleAttempts.map((attempt) => (
        <AttemptRow key={attempt.id} attempt={attempt} />
      ))}
      {hiddenCount > 0 && (
        <button type="button" className="btn btn-white btn-sm w-full" onClick={() => setShowAll(true)}>
          Tampilkan {hiddenCount} lainnya
        </button>
      )}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: EvaluationAttempt }) {
  const accent = toneStyles[getAccuracyTone(attempt.score)].color;

  return (
    <Link
      to="/results/$attemptId/review"
      params={{ attemptId: attempt.id }}
      search={{ returnTo: "evaluation" }}
      onClick={() => saveReturnScroll("evaluation")}
      className="flex items-center gap-3.5 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-3.5 text-stone-800 no-underline shadow-sm transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
        style={{ color: accent, background: `${accent}12`, borderColor: `${accent}35` }}
      >
        {attempt.score}%
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-bold text-stone-800">{attempt.tryoutTitle}</b>
        <div className="mt-0.5 text-xs font-medium text-stone-400">
          Try-out ke-{attempt.attemptNumber}
          {attempt.submittedAt ? ` · ${formatDate(attempt.submittedAt)}` : ""}
        </div>
        <div className="mt-0.5 text-xs font-semibold text-stone-500">
          {attempt.correctCount}/{attempt.totalQuestions} benar
          <span className="font-bold text-amber"> · +{attempt.xpEarned} XP</span>
        </div>
      </div>
      <ChevronIcon className="h-5 w-5 shrink-0 text-stone-300" />
    </Link>
  );
}

function PremiumUpsell() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-xl)] border-2 border-b-4 border-amber-300 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(320px 180px at 90% 0%, rgba(245,158,11,0.28), transparent 70%), radial-gradient(260px 180px at 0% 100%, rgba(20,184,166,0.18), transparent 72%)",
        }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2 border-amber-300/45 bg-amber-400/15 text-amber-200">
            <CrownIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">Premium</div>
            <h2 className="mt-1 text-[18px] font-bold leading-tight text-amber-50">Temukan topik yang bikin nilaimu turun</h2>
          </div>
        </div>

        <ul className="m-0 mt-4 grid list-none gap-2 p-0 text-sm font-medium text-amber-100/85">
          {[
            "Skor per subkategori dan topik",
            "Daftar topik terlemah untuk dilatih",
            "Tren skor dan riwayat semua try-out",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-amber-300" />
              {item}
            </li>
          ))}
        </ul>

        <Link
          to="/premium"
          className="btn mt-5 w-full"
          style={{ background: "#f5b544", color: "#2f281c", borderBottomColor: "#b45309" }}
        >
          Unlock Breakdown Lengkap
        </Link>
      </div>
    </section>
  );
}

function EmptyEvaluation({ isPremium }: { isPremium: boolean }) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border-2 border-primary-soft bg-primary-tint text-primary">
        <ChartIcon className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-stone-800">Belum ada data evaluasi</h2>
      <p className="mx-auto mt-2 max-w-[34ch] text-sm font-medium leading-relaxed text-stone-500">
        Selesaikan try-out pertamamu. Setelah itu kamu bisa melihat akurasi dan topik yang perlu dilatih.
      </p>
      <Link to="/tryout" className="btn btn-primary mt-5 w-full sm:w-auto">
        <BookIcon />
        Mulai Try-out
      </Link>

      <ul className="m-0 mt-6 grid list-none gap-2.5 p-0 text-left sm:grid-cols-3">
        {[
          { title: "Akurasi", text: "Persentase jawaban benar per kategori.", accent: "#205072" },
          { title: "Topik lemah", text: "Topik yang perlu kamu latih dulu.", accent: "#f59e0b", premium: true },
          { title: "Tren skor", text: "Naik atau turun dari try-out ke try-out.", accent: "#0ea5e9", premium: true },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-[var(--radius-md)] border-2 bg-stone-50/70 p-3.5"
            style={{ borderColor: `${item.accent}22` }}
          >
            <div className="flex items-center gap-2 text-[13px] font-bold text-stone-700">
              <span className="h-2 w-2 rounded-full" style={{ background: item.accent }} aria-hidden="true" />
              {item.title}
              {item.premium && !isPremium && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
                  Premium
                </span>
              )}
            </div>
            <div className="mt-1 text-xs font-medium leading-snug text-stone-400">{item.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressBar({ pct, className = "", thin = false }: { pct: number; className?: string; thin?: boolean }) {
  const color = toneStyles[getAccuracyTone(pct)].color;

  return (
    <div className={`overflow-hidden rounded-full bg-stone-100 ${thin ? "h-1.5" : "h-2.5"} ${className}`} aria-hidden="true">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ScorePill({ value, compact = false }: { value: number; compact?: boolean }) {
  const color = toneStyles[getAccuracyTone(value)].color;

  return (
    <span
      className={`shrink-0 rounded-full border-2 font-bold ${compact ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
      style={{ color, background: `${color}12`, borderColor: `${color}40` }}
    >
      {value}%
    </span>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="m-0 text-[13px] font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
      <div className="h-px flex-1 bg-stone-200" />
      {hint && <span className="text-[11px] font-semibold text-stone-400">{hint}</span>}
    </div>
  );
}

function IconTile({ icon, accent, size = "sm" }: { icon: React.ReactNode; accent: string; size?: "sm" | "lg" }) {
  const boxSize = size === "lg" ? "h-14 w-14 rounded-[var(--radius-md)]" : "h-9 w-9 rounded-xl";

  return (
    <div
      className={`${boxSize} flex shrink-0 items-center justify-center border-2`}
      style={{ color: accent, background: `${accent}18`, borderColor: `${accent}30` }}
    >
      {icon}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type IconProps = { className?: string };

function ChartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m4 16 5-5 4 4 7-8M15 7h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6.8 11h10.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-5.4c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H19v17H7.8A2.8 2.8 0 0 0 5 21.8v-17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18.2A2.8 2.8 0 0 1 7.8 15H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ReviewIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { useApp } from "../data";

export const Route = createFileRoute("/evaluation")({
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

const categoryBreakdown = [
  {
    name: "Klinis",
    subcategories: [
      { name: "Kardiovaskular - Hipertensi", total: 40, correct: 30 },
      { name: "Kardiovaskular - Gagal Jantung", total: 25, correct: 18 },
      { name: "Respiratori - Asma", total: 20, correct: 14 },
    ],
  },
  {
    name: "Farmakologi",
    subcategories: [
      { name: "Antibiotik", total: 30, correct: 21 },
      { name: "NSAID", total: 15, correct: 10 },
    ],
  },
  {
    name: "Farmasi Klinik",
    subcategories: [
      { name: "Perhitungan Dosis", total: 20, correct: 12 },
      { name: "Interaksi Obat", total: 15, correct: 11 },
    ],
  },
];

const attempts = [
  { title: "UKAI Tryout 1", score: 80, date: "15 Apr 2026", xp: 130, attempt: 1 },
  { title: "Farmakologi Dasar", score: 50, date: "16 Apr 2026", xp: 70, attempt: 1 },
  { title: "Kardiovaskular", score: 75, date: "13 Apr 2026", xp: 150, attempt: 1 },
];

function EvaluationComponent() {
  const { isPremium, togglePremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const totalQuestions = categoryBreakdown.reduce(
    (sum, category) => sum + category.subcategories.reduce((subSum, subcategory) => subSum + subcategory.total, 0),
    0,
  );
  const totalCorrect = categoryBreakdown.reduce(
    (sum, category) => sum + category.subcategories.reduce((subSum, subcategory) => subSum + subcategory.correct, 0),
    0,
  );
  const totalWrong = totalQuestions - totalCorrect;
  const pctCorrect = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

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
            "radial-gradient(900px 340px at 8% -18%, #14b8a638, transparent 62%), radial-gradient(720px 340px at 94% -12%, #f59e0b20, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar />
        <div className="px-5 pt-7">
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
            <button
              className="rounded-full border-2 border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 transition-all duration-150 hover:border-primary hover:text-primary active:translate-y-[1px]"
              onClick={togglePremium}
              type="button"
            >
              {isPremium ? "Premium ON" : "Free"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 grid-flow-dense">
            <SummaryCard label="Soal Dikerjakan" value={String(totalQuestions)} accent="#14b8a6" icon={<DocumentIcon />} />
            <SummaryCard label="Jawaban Benar" value={String(totalCorrect)} accent="#22c55e" icon={<CheckCircleIcon />} />
            <SummaryCard label="Jawaban Salah" value={String(totalWrong)} accent="#fb7185" icon={<XCircleIcon />} />
            <SummaryCard label="Akurasi" value={`${pctCorrect}%`} accent="#f59e0b" icon={<TargetIcon />} />
          </div>
        </div>
      </div>

      <div className="relative -mt-4 px-5 pb-28">
        <InsightPanel pctCorrect={pctCorrect} isPremium={isPremium} onOpenPremium={() => setShowPremium(true)} />

        <div className="mt-6">
          <SectionHeader title="Breakdown Kategori" />
          <div className="grid gap-4">
            {categoryBreakdown.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                isPremium={isPremium}
                onOpenPremium={() => setShowPremium(true)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <SectionHeader title="Riwayat Attempt" />
          {!isPremium ? (
            <LockedAttempts onOpenPremium={() => setShowPremium(true)} />
          ) : (
            <div className="grid gap-3">
              {attempts.map((attempt) => (
                <AttemptRow key={`${attempt.title}-${attempt.date}`} attempt={attempt} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="learn" />
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => setShowPremium(false)}
      />
    </main>
  );
}

function InsightPanel({
  pctCorrect,
  isPremium,
  onOpenPremium,
}: {
  pctCorrect: number;
  isPremium: boolean;
  onOpenPremium: () => void;
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
        <IconTile icon={<SparkIcon />} accent="#14b8a6" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            Rekomendasi
          </div>
          <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-stone-800">
            Fokus ke Farmasi Klinik
          </h2>
          <p className="m-0 mt-2 max-w-[31ch] text-[13.5px] font-medium leading-relaxed text-stone-500">
            Akurasi keseluruhanmu {pctCorrect}%. Prioritaskan dosis dan interaksi obat untuk menaikkan baseline.
          </p>
        </div>
      </div>

      {!isPremium && (
        <button className="btn mt-4 w-full" onClick={onOpenPremium} type="button" style={{ background: "#2f281c", color: "#fff7ed", borderBottomColor: "#a16207" }}>
          Buka Analisis Premium
        </button>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  isPremium,
  onOpenPremium,
}: {
  category: (typeof categoryBreakdown)[number];
  isPremium: boolean;
  onOpenPremium: () => void;
}) {
  const categoryTotal = category.subcategories.reduce((sum, subcategory) => sum + subcategory.total, 0);
  const categoryCorrect = category.subcategories.reduce((sum, subcategory) => sum + subcategory.correct, 0);
  const categoryPct = categoryTotal > 0 ? Math.round((categoryCorrect / categoryTotal) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white shadow-sm">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <b className="text-base font-bold text-stone-800">{category.name}</b>
            <div className="mt-1 text-xs font-semibold text-stone-400">
              {categoryCorrect}/{categoryTotal} soal benar
            </div>
          </div>
          <span className="rounded-full border-2 border-teal-200 bg-teal-50 px-2.5 py-1 text-[12px] font-bold text-primary-dark">
            {categoryPct}%
          </span>
        </div>
        <ProgressBar value={categoryPct} />
      </div>

      <div className={`relative ${!isPremium ? "select-none" : ""}`}>
        <div className="space-y-3 border-t border-stone-100 px-5 py-4">
          {category.subcategories.map((subcategory) => (
            <SubcategoryRow
              key={subcategory.name}
              subcategory={subcategory}
              isBlurred={!isPremium}
            />
          ))}
        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center rounded-b-[var(--radius-lg)] bg-amber-50/86 px-5 backdrop-blur-[1px]">
            <button className="btn btn-sm" onClick={onOpenPremium} type="button" style={{ background: "#2f281c", color: "#fff7ed", borderBottomColor: "#a16207" }}>
              Unlock Breakdown
            </button>
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
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-semibold text-stone-600">{subcategory.name}</span>
        <span className="shrink-0 font-bold text-primary">{pct}%</span>
      </div>
      <ProgressBar value={pct} size="sm" />
      <div className="mt-1 text-xs font-medium text-stone-400">{subcategory.correct}/{subcategory.total}</div>
    </div>
  );
}

function LockedAttempts({ onOpenPremium }: { onOpenPremium: () => void }) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-center text-amber-50 shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border-2 border-amber-300/45 bg-amber-400/15 text-amber-200">
        <TimelineIcon />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-amber-50">Riwayat lengkap untuk Premium</h2>
      <p className="mx-auto mt-2 max-w-[30ch] text-sm font-medium leading-relaxed text-amber-100/72">
        Buka tren attempt, XP, dan kualitas skor dari waktu ke waktu.
      </p>
      <button className="btn mt-4 w-full" onClick={onOpenPremium} type="button" style={{ background: "#f5b544", color: "#2f281c", borderBottomColor: "#b45309" }}>
        Upgrade ke Premium
      </button>
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: (typeof attempts)[number] }) {
  const accent = attempt.score >= 70 ? "#22c55e" : "#fb7185";

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-4 shadow-sm">
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
        <b className="block truncate text-[15px] font-bold text-stone-800">{attempt.title}</b>
        <div className="mt-0.5 flex gap-3 text-xs font-medium text-stone-400">
          <span>Attempt #{attempt.attempt}</span>
          <span>{attempt.date}</span>
        </div>
      </div>
      <div className="shrink-0 text-right text-sm font-bold text-amber">+{attempt.xp} XP</div>
    </div>
  );
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

function ProgressBar({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  return (
    <div className={`${size === "md" ? "mt-3" : ""} rounded-full border-2 border-teal-100 bg-teal-50/80 p-1 shadow-[inset_0_1px_2px_rgba(15,118,110,0.12)]`}>
      <div className={`${size === "md" ? "h-3" : "h-2"} overflow-hidden rounded-full bg-white/90`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            minWidth: value > 0 ? "20px" : "0",
            background: "linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)",
          }}
        />
      </div>
    </div>
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

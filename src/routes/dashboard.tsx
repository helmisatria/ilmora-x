import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { getLevelForXp, getNextLevel, getXpProgress, tryouts, useApp, type Tryout } from "../data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Beranda — IlmoraX" },
      { name: "description", content: "Dashboard belajar IlmoraX. Lanjutkan latihan UKAI, pantau streak dan level, serta akses try-out dan fitur premium." },
      { property: "og:title", content: "Beranda — IlmoraX" },
      { property: "og:description", content: "Dashboard belajar IlmoraX. Lanjutkan latihan UKAI, pantau streak dan level." },
    ],
  }),
  component: DashboardComponent,
});

const dashboardPalettes = [
  {
    id: "mist",
    name: "Mist",
    page:
      "linear-gradient(180deg, #f4f8f7 0%, #f8faf8 38%, #f5f2ec 100%)",
    header:
      "radial-gradient(900px 340px at 10% -18%, #14b8a626, transparent 62%), radial-gradient(720px 340px at 94% -12%, #d6c6a81f, transparent 68%), linear-gradient(180deg, #f4f8f7 0%, #fafaf9 100%)",
    swatches: ["#f4f8f7", "#d6c6a8", "#14b8a6"],
  },
  {
    id: "paper",
    name: "Paper",
    page:
      "linear-gradient(180deg, #f8f5ef 0%, #fbfaf7 45%, #f1f7f5 100%)",
    header:
      "radial-gradient(900px 340px at 10% -18%, #14b8a620, transparent 62%), radial-gradient(720px 340px at 94% -12%, #c59f5d24, transparent 68%), linear-gradient(180deg, #f8f5ef 0%, #fbfaf7 100%)",
    swatches: ["#f8f5ef", "#c59f5d", "#14b8a6"],
  },
  {
    id: "clinic",
    name: "Clinic",
    page:
      "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)",
    header:
      "radial-gradient(900px 340px at 8% -18%, #14b8a638, transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)",
    swatches: ["#eef8f6", "#0ea5e9", "#14b8a6"],
  },
  {
    id: "stone",
    name: "Stone",
    page:
      "linear-gradient(180deg, #f2f0eb 0%, #fafaf9 42%, #eef6f3 100%)",
    header:
      "radial-gradient(900px 340px at 10% -18%, #78716c20, transparent 62%), radial-gradient(720px 340px at 94% -12%, #14b8a620, transparent 68%), linear-gradient(180deg, #f2f0eb 0%, #fafaf9 100%)",
    swatches: ["#f2f0eb", "#78716c", "#14b8a6"],
  },
] as const;

type DashboardPalette = (typeof dashboardPalettes)[number];
const dashboardPaletteStorageKey = "ilmorax-dashboard-palette";
const defaultDashboardPaletteId = "clinic";

function DashboardComponent() {
  const { user, isPremium, togglePremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const [paletteId, setPaletteId] = useState<DashboardPalette["id"]>(defaultDashboardPaletteId);
  const [showToneLab, setShowToneLab] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPaletteId(getStoredDashboardPalette());
  }, []);

  const updatePalette = (nextPaletteId: DashboardPalette["id"]) => {
    setPaletteId(nextPaletteId);

    if (typeof window === "undefined") return;

    window.localStorage.setItem(dashboardPaletteStorageKey, nextPaletteId);
  };

  const palette = dashboardPalettes.find((item) => item.id === paletteId) ?? dashboardPalettes[0];
  const levelInfo = getLevelForXp(user.xp);
  const nextLevel = getNextLevel(user.xp);
  const xpProgress = getXpProgress(user.xp);
  const accuracy = user.totalQuestions > 0 ? Math.round((user.totalCorrect / user.totalQuestions) * 100) : 0;

  return (
    <>
      <div style={{ background: palette.page }}>
        <div
          className="app-shell page-enter"
          style={{
            background: "transparent",
          }}
        >
        <div
          className="relative overflow-hidden pb-8"
          style={{
            background: palette.header,
          }}
        >
          <TopBar />

          <div className="page-lane pt-5 sm:pt-7 lg:pt-10">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Beranda
            </div>
            <h1 className="mt-1 max-w-[18ch] text-[20px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
              Halo, {user.name}
            </h1>
            <p className="m-0 mt-1.5 max-w-[54ch] text-[12.5px] font-medium leading-snug text-stone-500 sm:mt-3 sm:text-[15px] sm:leading-relaxed">
              Lanjutkan latihan UKAI dari progres terakhir.
              <span className="hidden sm:inline"> Pantau ritme belajarmu hari ini.</span>
            </p>

            <ProgressPanel
              streak={user.streak}
              level={levelInfo.level}
              levelTitle={levelInfo.title}
              xp={user.xp}
              nextXp={nextLevel?.xp}
              xpProgress={xpProgress}
            />
          </div>
        </div>

        <div className="page-lane relative -mt-4 pb-28">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              className={`btn btn-primary px-4 py-3 text-[14px] whitespace-nowrap sm:px-6 sm:py-3.5 sm:text-[15px] ${isPremium ? "col-span-2" : "col-span-1 md:col-span-2"}`}
              onClick={() => navigate({ to: "/tryout" })}
              type="button"
            >
              <BookIcon />
              Mulai Tryout
            </button>

            {!isPremium && (
              <button
                className="btn col-span-1 px-4 py-3 text-[14px] whitespace-nowrap sm:px-6 sm:py-3.5 sm:text-[15px] md:col-span-2"
                style={{
                  background: "#2f281c",
                  color: "#fff7ed",
                  borderBottomColor: "#a16207",
                }}
                onClick={() => setShowPremium(true)}
                type="button"
              >
                <CrownIcon />
                Premium
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatCard icon={<DocumentIcon />} label="Soal dikerjakan" value={String(user.totalQuestions)} accent="#14b8a6" />
            <StatCard icon={<TargetIcon />} label="Akurasi" value={`${accuracy}%`} accent="#f59e0b" />
            <StatCard icon={<ChartIcon />} label="Try-out" value={String(user.totalTryouts)} accent="#0ea5e9" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] lg:items-start">
            <div>
              <SectionHeader title="Try-out Tersedia" action="Lihat semua" to="/tryout" />
              <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-1">
                {tryouts.slice(0, 4).map((tryout) => (
                  <TryoutRow key={tryout.id} tryout={tryout} isLocked={tryout.isPremium && !isPremium} />
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {isPremium ? (
                <FeatureCallout
                  title="Evaluation Dashboard"
                  description="Lihat analisis performa lengkapmu"
                  to="/evaluation"
                  cta="Buka Evaluation"
                  accent="#f59e0b"
                  icon={<ChartIcon />}
                />
              ) : (
                <PremiumFeatureCallout onOpenPremium={() => setShowPremium(true)} />
              )}

              <FeatureCallout
                title="Gabung Live Poll"
                description="Masukkan kode 6 digit dari pembimbingmu"
                to="/poll/join"
                cta="Masuk Poll"
                accent="#14b8a6"
                icon={<SignalIcon />}
              />
            </div>
          </div>

          <div className="mt-6">
            <SectionHeader title="Segera Hadir" />
            <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
              <ComingSoonCard feature="drilling" title="Drilling" description="Latihan" icon={<GameIcon />} accent="#14b8a6" />
              <ComingSoonCard feature="store" title="Store" description="Power-up" icon={<StoreIcon />} accent="#f59e0b" />
              <ComingSoonCard feature="affiliate" title="Affiliate" description="Referral" icon={<HandshakeIcon />} accent="#0ea5e9" />
            </div>
          </div>

          <div className="mt-6">
            <DashboardToneDevtool
              palettes={dashboardPalettes}
              selectedId={paletteId}
              onSelect={updatePalette}
              isVisible={showToneLab}
              onToggleVisibility={() => setShowToneLab((isVisible) => !isVisible)}
            />
          </div>

          <div className="mt-4 mb-20 text-center">
            <button
              onClick={togglePremium}
              className="text-xs text-stone-300 hover:text-stone-500 transition-colors font-medium"
              type="button"
            >
              Premium mode {isPremium ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <BottomNav active="learn" />
      </div>
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

function getStoredDashboardPalette(): DashboardPalette["id"] {
  if (typeof window === "undefined") return defaultDashboardPaletteId;

  const storedPaletteId = window.localStorage.getItem(dashboardPaletteStorageKey);
  const storedPalette = dashboardPalettes.find((palette) => palette.id === storedPaletteId);

  if (!storedPalette) return defaultDashboardPaletteId;

  return storedPalette.id;
}

function DashboardToneDevtool({
  palettes,
  selectedId,
  onSelect,
  isVisible,
  onToggleVisibility,
}: {
  palettes: readonly DashboardPalette[];
  selectedId: DashboardPalette["id"];
  onSelect: (id: DashboardPalette["id"]) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}) {
  const selected = palettes.find((palette) => palette.id === selectedId) ?? palettes[0];

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white/82 p-3 shadow-sm backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            Tone Lab
          </div>
          <div className="text-[12px] font-semibold text-stone-600">
            Background options
          </div>
        </div>
        <button
          className="rounded-full border-2 border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-600 transition-all duration-150 hover:border-primary hover:text-primary active:translate-y-[1px]"
          onClick={onToggleVisibility}
          type="button"
        >
          {isVisible ? "Hide" : selected.name}
        </button>
      </div>
      {isVisible && (
        <div className="grid grid-cols-2 gap-2">
          {palettes.map((palette) => {
            const isSelected = selectedId === palette.id;

            return (
              <button
                key={palette.id}
                className={`flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border-2 px-2 py-1.5 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-primary bg-teal-50 text-stone-900"
                    : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
                }`}
                onClick={() => onSelect(palette.id)}
                type="button"
              >
                <span className="text-[11px] font-bold">{palette.name}</span>
                <span className="flex -space-x-1">
                  {palette.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      className="h-3.5 w-3.5 rounded-full border border-white"
                      style={{ background: swatch }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressPanel({
  streak,
  level,
  levelTitle,
  xp,
  nextXp,
  xpProgress,
}: {
  streak: number;
  level: number;
  levelTitle: string;
  xp: number;
  nextXp?: number;
  xpProgress: number;
}) {
  const remainingXp = nextXp ? Math.max(nextXp - xp, 0) : 0;

  return (
    <div
      className="mt-5 rounded-[var(--radius-xl)] p-4 sm:p-5 shadow-sm border-2 border-b-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(235,250,247,0.98) 0%, rgba(255,252,245,0.98) 100%)",
        borderColor: "#cfe7df",
        borderBottomColor: "#a9d1c6",
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <ProgressMetric label="Streak" value={`${streak} hari`} icon={<FlameIcon />} accent="#f59e0b" />
        <ProgressMetric label={`Level ${level}`} value={levelTitle} icon={<ShieldIcon />} accent="#14b8a6" />
      </div>

      {nextXp && (
        <div className="mt-3 rounded-[var(--radius-lg)] border-2 border-teal-100 bg-white/76 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:mt-4 sm:p-3.5">
          <div className="flex items-center justify-between gap-3 sm:items-start">
            <div className="min-w-0">
              <div className="hidden text-[10px] font-semibold uppercase tracking-wide text-stone-400 sm:block">
                Level Progress
              </div>
              <div className="text-[12px] font-bold text-stone-800 sm:mt-1 sm:text-[13px]">
                <span className="sm:hidden">{xp.toLocaleString()} / {nextXp.toLocaleString()} XP</span>
                <span className="hidden sm:inline">{remainingXp.toLocaleString()} XP lagi</span>
              </div>
            </div>
            <div className="shrink-0 rounded-full border-2 border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-primary-dark sm:px-2.5 sm:py-1 sm:text-[12px]">
              {xpProgress}%
            </div>
          </div>

          <div className="mt-2 rounded-full border-2 border-teal-100 bg-teal-50/80 p-0.5 shadow-[inset_0_1px_2px_rgba(15,118,110,0.12)] sm:mt-3 sm:p-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-white/90 sm:h-4">
              <div
                className="relative h-full rounded-full transition-all duration-500"
                style={{
                  width: `${xpProgress}%`,
                  minWidth: xpProgress > 0 ? "20px" : "0",
                  background:
                    "linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)",
                }}
              >
                <div className="absolute inset-x-1 top-1 hidden h-0.75 rounded-full bg-white/30 sm:block" />
              </div>
            </div>
          </div>

          <div className="mt-2 hidden justify-between text-[11px] font-semibold text-stone-500 sm:flex">
            <span>{xp.toLocaleString()} XP</span>
            <span>{nextXp.toLocaleString()} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-white/72 p-2.5 border-2 border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-3.5">
      <div className="flex items-center gap-2">
        <IconTile icon={icon} accent={accent} size="sm" />
        <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</div>
      </div>
      <div className="mt-1.5 text-[13px] font-bold text-stone-800 leading-snug break-words sm:text-[14px]">
        {value}
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
      className="rounded-[var(--radius-lg)] p-3.5 shadow-sm border-2 border-b-4"
      style={{
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.92) 72%)`,
        borderColor: `${accent}22`,
        borderBottomColor: `${accent}36`,
      }}
    >
      <IconTile icon={icon} accent={accent} size="sm" />
      <div className="mt-3 text-lg font-bold text-stone-800 leading-none tracking-tight">{value}</div>
      <div className="mt-1 text-[10.5px] leading-tight text-stone-400 font-semibold">{label}</div>
    </div>
  );
}

function SectionHeader({ title, action, to }: { title: string; action?: string; to?: "/tryout" }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </span>
      <div className="flex-1 h-px bg-stone-200" />
      {action && to && (
        <Link to={to} className="text-[12px] font-bold text-primary no-underline">
          {action}
        </Link>
      )}
    </div>
  );
}

function TryoutRow({ tryout, isLocked }: { tryout: Tryout; isLocked: boolean }) {
  const accent = isLocked ? "var(--color-amber)" : tryout.color;
  const color = isLocked ? "#f59e0b" : tryout.color;

  return (
    <Link
      to={isLocked ? "/premium" : "/tryout/$id"}
      params={isLocked ? undefined : { id: String(tryout.id) }}
      className="card shadow-sm no-underline min-w-0"
    >
      <IconTile
        icon={isLocked ? <LockIcon /> : <TryoutIcon tryoutId={tryout.id} />}
        accent={color}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <b className="text-base font-bold text-stone-800 leading-tight truncate">{tryout.title}</b>
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border-2 shrink-0"
            style={{
              color: accent,
              background: `${color}10`,
              borderColor: `${color}33`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            {isLocked ? "Premium" : `${tryout.duration} menit`}
          </span>
        </div>
        <div className="text-sm text-stone-400 font-medium">{tryout.questionCount} soal</div>
      </div>
      <ArrowRightIcon />
    </Link>
  );
}

function PremiumFeatureCallout({ onOpenPremium }: { onOpenPremium: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] p-5 shadow-sm border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] text-amber-50">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(320px 180px at 90% 0%, rgba(245,158,11,0.28), transparent 70%), radial-gradient(260px 180px at 0% 100%, rgba(20,184,166,0.18), transparent 72%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "14px 14px" }} />

      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border-2 border-amber-300/45 bg-amber-400/15 text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <CrownIcon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
              Premium
            </div>
            <b className="block mt-1 text-[18px] font-bold leading-tight text-amber-50">
              Evaluation Dashboard
            </b>
            <p className="text-sm text-amber-100/78 font-medium m-0 mt-2 leading-relaxed max-w-[27ch]">
              Analisis akurasi, pola salah, dan rekomendasi latihan dibuka khusus untuk member.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <PremiumMiniStat label="Akurasi" value="Detail" />
          <PremiumMiniStat label="Review" value="Prioritas" />
          <PremiumMiniStat label="Latihan" value="Target" />
        </div>

        <button
          className="btn w-full mt-4"
          style={{
            background: "#f5b544",
            color: "#2f281c",
            borderBottomColor: "#b45309",
          }}
          onClick={onOpenPremium}
          type="button"
        >
          <CrownIcon />
          Buka Premium
        </button>
      </div>
    </div>
  );
}

function PremiumMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border-2 border-amber-200/16 bg-white/8 px-2 py-2.5 text-center">
      <div className="text-[12px] font-bold leading-none text-amber-50">{value}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-amber-100/55">
        {label}
      </div>
    </div>
  );
}

function FeatureCallout({
  title,
  description,
  locked = false,
  to,
  cta,
  accent,
  icon,
}: {
  title: string;
  description: string;
  locked?: boolean;
  to: "/evaluation" | "/poll/join";
  cta: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border-2 border-b-4"
      style={{
        borderColor: `${accent}33`,
        borderBottomColor: `${accent}55`,
      }}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={icon} accent={accent} size="lg" />
        <div className="flex-1 min-w-0">
          <b className="block text-base font-bold text-stone-800 leading-tight">{title}</b>
          <p className="text-sm text-stone-500 font-medium m-0 mt-1 leading-relaxed max-w-[26ch]">
            {description}
          </p>
        </div>
      </div>

      {locked && (
        <p className="mt-3 text-xs text-amber-700 font-bold">
          Upgrade ke Premium untuk akses penuh
        </p>
      )}

      <Link to={to} className="btn btn-secondary btn-sm w-full mt-4">
        {cta}
      </Link>
    </div>
  );
}

function ComingSoonCard({
  feature,
  title,
  description,
  icon,
  accent,
}: {
  feature: "drilling" | "store" | "affiliate";
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      to="/coming-soon"
      search={{ feature }}
      className="bg-white rounded-[var(--radius-lg)] p-3.5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 text-center no-underline transition-all duration-150 hover:-translate-y-[3px] hover:shadow-md active:translate-y-[1px] active:border-b-2"
    >
      <div className="flex justify-center">
        <IconTile icon={icon} accent={accent} size="sm" />
      </div>
      <b className="block mt-3 text-sm font-bold text-stone-800 leading-tight">{title}</b>
      <div className="mt-1 text-xs text-stone-400 font-medium">{description}</div>
    </Link>
  );
}

function IconTile({
  icon,
  accent,
  size,
}: {
  icon: React.ReactNode;
  accent: string;
  size: "sm" | "lg";
}) {
  const boxSize = size === "lg" ? "w-14 h-14 rounded-[var(--radius-md)]" : "w-9 h-9 rounded-xl";
  const iconSize = size === "lg" ? "text-[28px]" : "text-lg";

  return (
    <div
      className={`${boxSize} ${iconSize} flex items-center justify-center shrink-0 border-2`}
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}22`,
      }}
    >
      {icon}
    </div>
  );
}

function TryoutIcon({ tryoutId }: { tryoutId: number }) {
  if (tryoutId === 2) return <CapsuleIcon />;
  if (tryoutId === 3) return <HeartPulseIcon />;
  if (tryoutId === 4) return <MicrobeIcon />;
  if (tryoutId === 5) return <HospitalIcon />;
  if (tryoutId === 6) return <CalculatorIcon />;
  return <FlaskIcon />;
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H19v17H7.8A2.8 2.8 0 0 0 5 21.8v-17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18.2A2.8 2.8 0 0 1 7.8 15H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M6 15a8 8 0 0 1 12 0M9 18a4 4 0 0 1 6 0M12 21h.1M3 12a12 12 0 0 1 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M12 22c4.1 0 7-2.8 7-6.8 0-3.5-2-5.8-4.4-7.7-.7 2-1.8 3.1-3.3 3.8.3-2.9-1.1-5.2-3.7-7.3C7.4 7.4 5 10.2 5 15.2 5 19.2 7.9 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.2c0 4.4-2.8 8.3-7 9.8-4.2-1.5-7-5.4-7-9.8V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M7 9h10a5 5 0 0 1 4.8 6.4l-.3 1.1a2.4 2.4 0 0 1-4 1l-1.8-1.8H8.3l-1.8 1.8a2.4 2.4 0 0 1-4-1l-.3-1.1A5 5 0 0 1 7 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 12v3M6.5 13.5h3M16.5 13h.1M18.5 15h.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M4 10h16l-1.2-5.2A1 1 0 0 0 17.9 4H6.1a1 1 0 0 0-1 .8L4 10ZM5 10v10h14V10M9 20v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="m8.5 12.5 2.2-2.2a2 2 0 0 1 2.8 0l.5.5 1.7-1.7a2 2 0 0 1 2.8 0L21 11.6M3 11.4l2.5-2.3a2 2 0 0 1 2.8 0l6.1 6.1a2.1 2.1 0 0 1-3 3L8.5 15.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m6 18 2-2M4 15l2-2M17 14l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-300 shrink-0" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6.8 11h10.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-5.4c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M9 3h6M10 3v5.8l-4.7 7.9A2.8 2.8 0 0 0 7.7 21h8.6a2.8 2.8 0 0 0 2.4-4.3L14 8.8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 15h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CapsuleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M10.5 20.2a5 5 0 0 1-7.1-7.1l6.2-6.2a5 5 0 0 1 7.1 7.1l-6.2 6.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.7l-1-1.1a5.2 5.2 0 0 0-7.4 7.4l8.4 8.2 8.4-8.2a5.2 5.2 0 0 0 0-7.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13h3l1.5-3 3 6 1.5-3h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicrobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10h.1M14 13h.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M5 21V5.8C5 4.8 5.8 4 6.8 4h10.4c1 0 1.8.8 1.8 1.8V21M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v6M9 11h6M8 21v-4h8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 7h8M8.5 12h.1M12 12h.1M15.5 12h.1M8.5 16h.1M12 16h.1M15.5 16h.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

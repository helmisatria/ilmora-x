import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useApp, questionBank, tryouts, getCategoryName, type Attempt, type Tryout } from "../data";

export const Route = createFileRoute("/tryout/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Try-out UKAI — IlmoraX" },
      { name: "description", content: "Kerjakan try-out UKAI dengan timer dan sistem penilaian real-time. Latihan simulasi UKAI dengan soal pilihan ganda dan pembahasan lengkap." },
      { property: "og:title", content: "Try-out UKAI — IlmoraX" },
      { property: "og:description", content: "Kerjakan try-out UKAI dengan timer dan sistem penilaian real-time." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: TryoutTakeComponent,
});

type Phase = "preparation" | "countdown" | "active";

function TryoutTakeComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, attempts, addAttempt } = useApp();
  const testId = parseInt(id, 10);
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("preparation");
  const [confirmStart, setConfirmStart] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | "GO">(3);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);

  const tryout = tryouts.find((t) => t.id === testId) || tryouts[0];
  const questions = questionBank[testId] || questionBank[1];
  const total = questions.length;
  const pct = Math.round(((qIndex + 1) / total) * 100);

  const [timeLeft, setTimeLeft] = useState(tryout.duration * 60);
  const [showReport, setShowReport] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [lastSaved, setLastSaved] = useState<string>("");

  useEffect(() => {
    setIsReady(true);
    setAnswers(new Array(questions.length).fill(undefined));
  }, [testId]);

  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "active") return;
    if (timeLeft > 0 && timeLeft % 30 === 0 && timeLeft !== tryout.duration * 60) {
      const now = new Date();
      setLastSaved(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    setCountdownValue(3);
    const steps: Array<number | "GO"> = [2, 1, "GO"];
    let i = 0;
    const tick = setInterval(() => {
      if (i < steps.length) {
        setCountdownValue(steps[i]);
        i++;
      } else {
        clearInterval(tick);
        setPhase("active");
      }
    }, 900);
    return () => clearInterval(tick);
  }, [phase]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden bg-stone-50">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(520px 360px at 50% 30%, rgba(20,184,166,0.18), transparent 70%), radial-gradient(720px 420px at 80% 10%, rgba(14,165,233,0.14), transparent 70%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative flex flex-col items-center text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
            Memuat
          </div>
          <div className="mt-5 relative h-20 w-20 rounded-full border-2 border-teal-100 bg-white shadow-sm">
            <div
              className="absolute inset-2 rounded-full animate-spin"
              style={{
                background: "conic-gradient(from 0deg, #14b8a6, #0ea5e9, #14b8a6)",
                filter: "blur(10px)",
                opacity: 0.45,
              }}
            />
            <div className="absolute inset-4 rounded-full bg-white border-2 border-stone-100" />
          </div>
          <p className="mt-5 text-[13.5px] font-medium text-stone-500">
            Menyiapkan modul tryout
          </p>
        </div>
      </div>
    );
  }

  if (phase === "preparation") {
    return (
      <PreparationScreen
        tryout={tryout}
        totalQuestions={total}
        onBack={() => navigate({ to: "/tryout" })}
        onStart={() => setConfirmStart(true)}
        confirmOpen={confirmStart}
        onConfirmCancel={() => setConfirmStart(false)}
        onConfirmStart={() => {
          setConfirmStart(false);
          setPhase("countdown");
        }}
      />
    );
  }

  if (phase === "countdown") {
    return <CountdownOverlay value={countdownValue} />;
  }

  const q = questions[qIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isTimeLow = timeLeft < 300;

  const handleSelect = (i: number) => {
    setSelected(i);
    const newAnswers = [...answers];
    newAnswers[qIndex] = i;
    setAnswers(newAnswers);
  };

  const handleFlag = () => {
    setFlagged((prev) =>
      prev.includes(qIndex) ? prev.filter((f) => f !== qIndex) : [...prev, qIndex]
    );
  };

  const handleNav = (i: number) => {
    setQIndex(i);
    setSelected(answers[i] ?? null);
  };

  const handleSubmit = () => {
    let correct = 0;
    const attemptAnswers: Attempt["answers"] = [];
    questions.forEach((question, i) => {
      const sel = answers[i];
      const ok = sel === question.correct;
      if (ok) correct++;
      if (sel !== undefined) {
        attemptAnswers.push({ questionId: question.id, selected: sel, correct: ok });
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    const xpEarn = 50 + correct * 20;
    const newId = Math.max(0, ...attempts.map((a) => a.id)) + 1;
    const now = new Date();
    const attemptNumber = attempts.filter((a) => a.tryoutId === testId && a.userId === user.id).length + 1;
    const attempt: Attempt = {
      id: newId,
      userId: user.id,
      tryoutId: testId,
      attemptNumber,
      status: "submitted",
      startedAt: new Date(now.getTime() - (tryout.duration * 60 - timeLeft) * 1000).toISOString(),
      deadlineAt: new Date(now.getTime() + timeLeft * 1000).toISOString(),
      score,
      correct,
      total: questions.length,
      xpEarned: attemptNumber === 1 ? xpEarn : Math.round(xpEarn * 0.25),
      completedAt: now.toISOString(),
      answers: attemptAnswers,
      markedQuestionIds: flagged.map((fi) => questions[fi].id),
    };
    addAttempt(attempt);
    navigate({ to: "/results/$attemptId", params: { attemptId: String(newId) } });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl flex items-center gap-3 px-4 py-3.5 border-b-2 border-stone-200">
        <Link to="/tryout" className="icon-btn" aria-label="Tutup tryout">
          <CloseIcon />
        </Link>
        <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-2">
          <div className="px-3.5 py-2 rounded-full font-extrabold text-[12px] bg-white shadow-sm border-2 border-stone-200">
            {qIndex + 1}/{total}
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-extrabold text-[12px] shadow-sm border-2 ${
            isTimeLow ? "bg-red-50 border-red-300 text-red-600" : "bg-teal-50 border-teal-200 text-teal-700"
          }`}>
            <ClockIcon />
            {timeDisplay}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-[640px] mx-auto w-full pb-24">
        <div className="bg-white rounded-[var(--radius-xl)] p-6 mb-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-primary text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full tracking-wide uppercase">
              {getCategoryLabel(q.categoryId)}
            </span>
            <div className="flex gap-2">
              <button
                className={`w-11 h-11 rounded-[var(--radius-md)] border-2 cursor-pointer flex items-center justify-center transition-all duration-150 ${
                  flagged.includes(qIndex) ? "bg-coral text-white border-coral-dark" : "bg-white text-stone-500 border-stone-200"
                }`}
                onClick={handleFlag}
                title="Ragu-ragu"
                type="button"
              >
                <FlagIcon />
              </button>
              <button
                className="w-11 h-11 rounded-[var(--radius-md)] border-2 border-stone-200 bg-white text-stone-500 cursor-pointer flex items-center justify-center transition-all hover:bg-stone-50 hover:border-stone-300"
                onClick={() => setShowReport(true)}
                title="Laporkan soal"
                type="button"
              >
                <AlertIcon />
              </button>
            </div>
          </div>
          <h2 className="text-xl font-bold leading-relaxed m-0 max-w-[30ch]">{q.question}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-4.5 bg-white border-3 border-stone-200 rounded-[var(--radius-lg)] font-semibold text-base cursor-pointer transition-all duration-100 ${
                  isSelected ? "border-primary bg-teal-50" : ""
                }`}
                style={{ borderBottom: isSelected ? "5px solid var(--color-primary-dark)" : "5px solid var(--color-stone-300)" }}
                onClick={() => handleSelect(i)}
              >
                <span className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-bold shrink-0 transition-all duration-150 ${
                  isSelected ? "bg-primary border-b-3 text-white" : "bg-stone-200 border-b-3 text-stone-500"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {lastSaved && (
          <div className="text-center text-xs text-stone-400 mt-4 font-medium">
            Tersimpan pukul {lastSaved}
          </div>
        )}

        <div className="mt-6 bg-white rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="font-semibold text-xs text-stone-400 mb-3 uppercase tracking-wide">Navigasi Soal</div>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, i) => {
              let cls = "bg-stone-100 border-stone-200 text-stone-500";
              if (i === qIndex) cls = "bg-primary border-primary-dark text-white border-b-primary-dark";
              else if (answers[i] !== undefined) cls = "bg-success border-success-dark text-white border-b-success-dark";
              const isFlagged = flagged.includes(i);
              return (
                <button
                  key={i}
                  className={`aspect-square border-2 rounded-[10px] font-extrabold text-[13px] cursor-pointer transition-all duration-150 relative ${cls}`}
                  onClick={() => handleNav(i)}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-coral rounded-full border-2 border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/98 backdrop-blur-xl px-4 py-4 border-t-2 border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-5">
        <button
          className="btn btn-primary w-full max-w-[640px] mx-auto"
          onClick={qIndex === total - 1 ? () => setShowSubmitConfirm(true) : () => {
            if (qIndex < total - 1) {
              setQIndex(qIndex + 1);
              setSelected(answers[qIndex + 1] ?? null);
            }
          }}
        >
          {qIndex === total - 1 ? "SELESAI" : "SELANJUTNYA"}
        </button>
      </div>

      {showSubmitConfirm && (
        <div className="dialog-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) setShowSubmitConfirm(false) }}>
          <div className="dialog-box text-left">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 bg-teal-50 text-primary border-2 border-teal-100 flex items-center justify-center">
              <SendIcon />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center tracking-tight">Yakin submit?</h3>
            <p className="text-sm text-stone-500 mb-4 text-center leading-relaxed font-medium max-w-[28ch] mx-auto">
              {answers.filter((a) => a !== undefined).length}/{total} soal dijawab.
              {answers.some((a) => a === undefined) && " Soal kosong dianggap salah."}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <MiniStat label="Dijawab" value={`${answers.filter((a) => a !== undefined).length}`} />
              <MiniStat label="Kosong" value={`${answers.filter((a) => a === undefined).length}`} />
              <MiniStat label="Ragu" value={`${flagged.length}`} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-white flex-1" onClick={() => setShowSubmitConfirm(false)}>Lanjut kerjain</button>
              <button className="btn btn-primary flex-1" onClick={handleSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="dialog-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}>
          <div className="dialog-box text-left">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 bg-rose-50 text-coral border-2 border-rose-100 flex items-center justify-center">
              <AlertIcon />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center tracking-tight">Laporkan Soal</h3>
            <p className="text-sm text-stone-500 mb-4 text-center leading-relaxed font-medium max-w-[28ch] mx-auto">
              Pilih alasan yang paling dekat supaya tim bisa meninjau soal ini.
            </p>
            <div className="space-y-3">
              {["Answer key salah", "Pembahasan keliru", "Soal tidak jelas", "Typo", "Lainnya"].map((reason) => (
                <button
                  key={reason}
                  className="w-full text-left px-4 py-3 rounded-[var(--radius-md)] border-2 border-stone-200 font-semibold text-sm hover:border-primary hover:bg-teal-50 transition-all"
                  onClick={() => {
                    setShowReport(false);
                    alert("Laporan kami terima. Terima kasih!");
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button className="btn btn-white w-full mt-4" onClick={() => setShowReport(false)}>Batal</button>
          </div>
        </div>
      )}
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

interface PreparationScreenProps {
  tryout: Tryout;
  totalQuestions: number;
  onBack: () => void;
  onStart: () => void;
  confirmOpen: boolean;
  onConfirmCancel: () => void;
  onConfirmStart: () => void;
}

function PreparationScreen({
  tryout,
  totalQuestions,
  onBack,
  onStart,
  confirmOpen,
  onConfirmCancel,
  onConfirmStart,
}: PreparationScreenProps) {
  const avgSecondsPerQuestion = Math.round((tryout.duration * 60) / totalQuestions);
  const xpReward = 50 + totalQuestions * 20;
  const categoryName = getCategoryName(tryout.categoryId);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] antialiased">
      <div
        className="relative overflow-hidden pb-10"
        style={{
          background:
            `radial-gradient(1200px 400px at 20% -10%, ${tryout.color}22, transparent 60%), radial-gradient(900px 500px at 90% -20%, ${tryout.color}18, transparent 70%), var(--color-bg)`,
        }}
      >
        <div className="sticky top-0 z-10 bg-white/75 backdrop-blur-xl flex items-center gap-3 px-4 py-3.5 border-b-2 border-stone-200">
          <button onClick={onBack} className="icon-btn" aria-label="Kembali">
            ←
          </button>
          <div className="flex-1 text-center">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-stone-400">
              Persiapan Tryout
            </div>
          </div>
          <div className="w-11" />
        </div>

        <div className="max-w-[480px] mx-auto px-5 pt-8">
          <div className="flex flex-col items-center text-center">
            <div
              className="w-20 h-20 rounded-[22px] flex items-center justify-center text-white shadow-lg"
              style={{
                background: tryout.color,
                borderBottom: "5px solid rgba(0,0,0,0.18)",
              }}
            >
              <TryoutModuleIcon tryoutId={tryout.id} />
            </div>
            <span
              className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2"
              style={{
                color: tryout.color,
                borderColor: `${tryout.color}33`,
                background: `${tryout.color}10`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tryout.color }} />
              {categoryName}
            </span>
            <h1 className="mt-4 text-[28px] leading-tight font-bold text-stone-800 max-w-[22ch]">
              {tryout.title}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-stone-500 max-w-[34ch] font-medium">
              {tryout.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-5 -mt-4 pb-36 relative">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<DocumentIcon />} label="Jumlah Soal" value={`${totalQuestions}`} unit="soal" accent="#14b8a6" />
          <StatCard icon={<ClockIcon />} label="Durasi" value={`${tryout.duration}`} unit="menit" accent="#0ea5e9" />
          <StatCard
            icon={<BoltIcon />}
            label="XP Reward"
            value={`+${xpReward}`}
            unit="poin"
            accent="#f59e0b"
          />
          <StatCard
            icon={<TargetIcon />}
            label="Per Soal"
            value={`~${avgSecondsPerQuestion}`}
            unit="detik"
            accent="#a855f7"
          />
        </div>

        <div className="mt-5 bg-white rounded-[var(--radius-xl)] p-5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
              Sebelum Mulai
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>
          <ul className="flex flex-col gap-3">
            <RuleItem icon={<SignalIcon />}>
              Pastikan koneksi internet stabil. Jawaban tersimpan otomatis tiap 30 detik.
            </RuleItem>
            <RuleItem icon={<FocusIcon />}>
              Cari tempat tenang. Timer berjalan dan tidak dapat dijeda setelah mulai.
            </RuleItem>
            <RuleItem icon={<FlagIcon />}>
              Tandai soal ragu-ragu supaya mudah dikunjungi ulang sebelum submit.
            </RuleItem>
            <RuleItem icon={<CheckIcon />}>
              Pastikan semua soal terjawab. Soal kosong dihitung salah saat submit.
            </RuleItem>
          </ul>
        </div>

        {tryout.isPremium && (
          <div
            className="mt-4 rounded-[var(--radius-lg)] p-4 text-[13px] font-medium flex items-start gap-3 border-2"
            style={{
              background: "#fffbeb",
              borderColor: "#fde68a",
              color: "#92400e",
            }}
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700">
              <CrownIcon />
            </span>
            <div>
              <div className="font-semibold mb-0.5">Modul Premium</div>
              Modul ini eksklusif untuk member premium. Nikmati soal-soal pilihan dan pembahasan lengkap.
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t-2 border-stone-200 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div className="max-w-[480px] mx-auto px-5 py-4 flex gap-3">
          <button className="btn btn-white px-5" onClick={onBack}>
            Batal
          </button>
          <button className="btn btn-primary flex-1" onClick={onStart}>
            Mulai Tryout
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div
          className="dialog-backdrop show"
          onClick={(e) => {
            if (e.target === e.currentTarget) onConfirmCancel();
          }}
        >
          <div className="dialog-box text-left">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-[26px]"
              style={{
                background: `${tryout.color}1A`,
                color: tryout.color,
              }}
            >
              <TryoutModuleIcon tryoutId={tryout.id} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center tracking-tight">
              Siap memulai?
            </h3>
            <p className="text-sm text-stone-500 mb-4 text-center leading-relaxed font-medium">
              Timer akan berjalan selama {tryout.duration} menit dan tidak dapat dijeda.
              Pastikan kamu sudah siap.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <MiniStat label="Soal" value={`${totalQuestions}`} />
              <MiniStat label="Menit" value={`${tryout.duration}`} />
              <MiniStat label="XP" value={`+${xpReward}`} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-white flex-1" onClick={onConfirmCancel}>
                Nanti dulu
              </button>
              <button className="btn btn-primary flex-1" onClick={onConfirmStart}>
                Ya, mulai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-[var(--radius-lg)] p-4 border-2 border-stone-100 border-b-4 border-b-stone-200 shadow-sm">
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="text-[24px] font-bold text-stone-800 tracking-tight leading-none">
          {value}
        </div>
        <div className="text-[12px] font-semibold text-stone-400">{unit}</div>
      </div>
    </div>
  );
}

function RuleItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="text-[13.5px] leading-relaxed text-stone-600 font-medium pt-1">
        {children}
      </div>
    </li>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 rounded-[var(--radius-md)] py-2.5 border-2 border-stone-100">
      <div className="text-[18px] font-bold text-stone-800 leading-none tracking-tight">
        {value}
      </div>
      <div className="text-[10px] font-semibold text-stone-400 mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function TryoutModuleIcon({ tryoutId }: { tryoutId: number }) {
  if (tryoutId === 2) return <CapsuleIcon />;
  if (tryoutId === 3) return <HeartPulseIcon />;
  if (tryoutId === 4) return <MicrobeIcon />;
  if (tryoutId === 5) return <HospitalIcon />;
  if (tryoutId === 6) return <CalculatorIcon />;
  return <FlaskIcon />;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 21V4.8M6 5h10.5l-1.4 4L17 13H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 9v4M12 17h.1M10.4 4.6 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.6 4.6a1.8 1.8 0 0 0-3.2 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m4 12 16-8-4 16-3.5-6.5L4 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m12.5 13.5 3.5-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h4M8 12h8M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 18.5a11.5 11.5 0 0 1 16 0M7.5 15a6.5 6.5 0 0 1 9 0M11.9 19h.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m4 8 4 4 4-7 4 7 4-4-1.5 10h-13L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6.5 21h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M9 3h6M10 3v5.8l-4.7 7.9A2.8 2.8 0 0 0 7.7 21h8.6a2.8 2.8 0 0 0 2.4-4.3L14 8.8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 15h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CapsuleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M10.5 20.2a5 5 0 0 1-7.1-7.1l6.2-6.2a5 5 0 0 1 7.1 7.1l-6.2 6.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.7l-1-1.1a5.2 5.2 0 0 0-7.4 7.4l8.4 8.2 8.4-8.2a5.2 5.2 0 0 0 0-7.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13h3l1.5-3 3 6 1.5-3h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicrobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10h.1M14 13h.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M5 21V5.8C5 4.8 5.8 4 6.8 4h10.4c1 0 1.8.8 1.8 1.8V21M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v6M9 11h6M8 21v-4h8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 7h8M8.5 12h.1M12 12h.1M15.5 12h.1M8.5 16h.1M12 16h.1M15.5 16h.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CountdownOverlay({ value }: { value: number | "GO" }) {
  const isGo = value === "GO";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-stone-900">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(600px 600px at 50% 50%, rgba(20,184,166,0.35), transparent 70%), radial-gradient(800px 500px at 80% 20%, rgba(14,165,233,0.25), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />

      <div className="relative flex flex-col items-center">
        <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-teal-200/80 mb-6">
          Bersiap
        </div>
        <div
          key={String(value)}
          className="countdown-pulse flex items-center justify-center"
        >
          {isGo ? (
            <div className="text-[84px] font-bold text-white tracking-tight drop-shadow-[0_8px_32px_rgba(20,184,166,0.55)]">
              GO!
            </div>
          ) : (
            <div className="relative w-[180px] h-[180px] rounded-full border-2 border-white/15 flex items-center justify-center">
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(20,184,166,0.9), rgba(14,165,233,0.6), rgba(20,184,166,0.9))",
                  filter: "blur(12px)",
                  opacity: 0.55,
                }}
              />
              <div className="relative w-[140px] h-[140px] rounded-full bg-stone-900 border-2 border-white/10 flex items-center justify-center">
                <div className="text-[88px] font-bold text-white leading-none tracking-tight">
                  {value}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-10 text-[13px] font-medium text-stone-300/80">
          Timer akan dimulai otomatis
        </div>
      </div>

      <style>{`
        .countdown-pulse {
          animation: countdownPop 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes countdownPop {
          0% { opacity: 0; transform: scale(0.6); filter: blur(8px); }
          40% { opacity: 1; transform: scale(1.08); filter: blur(0); }
          70% { transform: scale(1); }
          100% { opacity: 0.92; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useProductAnalytics } from "../lib/product-analytics-client";
import { productAnalyticsEvents } from "../lib/product-analytics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { isPaidTryout } from "../lib/domain/premium-access";
import { getSafeErrorMessage } from "../lib/user-errors";
import {
  getTryoutPreparation,
  reportAttemptQuestion,
  saveAttempt,
  startOrResumeAttempt,
  submitAttempt,
} from "../lib/student-functions";

type TryoutPreparation = Awaited<ReturnType<typeof getTryoutPreparation>>;
type TakeAttempt = Awaited<ReturnType<typeof startOrResumeAttempt>>;
type TakeQuestion = TakeAttempt["questions"][number];
type AttemptProgressPayload = ReturnType<typeof makeAttemptProgressPayload>;
type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error";

export const Route = createFileRoute("/tryout/$id")({
  loader: async ({ params }) => {
    const tryout = await getTryoutPreparation({ data: { tryoutId: params.id } });

    return { tryout };
  },
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
  const { tryout } = Route.useLoaderData() as { tryout: TryoutPreparation };
  const navigate = useNavigate();
  const posthog = useProductAnalytics();
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("preparation");
  const [confirmStart, setConfirmStart] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | "GO">(3);
  const [attemptData, setAttemptData] = useState<TakeAttempt | null>(null);
  const [questions, setQuestions] = useState<TakeQuestion[]>([]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);

  const total = phase === "preparation" ? tryout.questionCount : questions.length;
  const pct = Math.round(((qIndex + 1) / total) * 100);

  const [timeLeft, setTimeLeft] = useState(tryout.durationMinutes * 60);
  const [showReport, setShowReport] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [lastSaved, setLastSaved] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [startError, setStartError] = useState<string>("");
  const [submitting, setSubmitting] = useState<{ attemptId: string } | null>(null);
  const hasAutoResumed = useRef(false);

  async function saveProgress(payload: AttemptProgressPayload) {
    if (!window.navigator.onLine) {
      queueProgress(payload);
      setSaveStatus("offline");
      return;
    }

    setSaveStatus("saving");

    try {
      const result = await saveAttempt({ data: payload });
      removeQueuedProgress(payload.attemptId);
      setLastSaved(formatSavedTime(result.savedAt));
      setSaveStatus("saved");
    } catch {
      queueProgress(payload);
      setSaveStatus("error");
      posthog.capture(productAnalyticsEvents.attemptAutosaveFailed, {
        attempt_id: payload.attemptId,
        tryout_id: tryout.id,
        tryout_title: tryout.title,
      });
    }
  }

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!tryout.activeAttemptId) return;
    if (hasAutoResumed.current) return;
    if (attemptData) return;

    hasAutoResumed.current = true;
    resumeAttempt({ withCountdown: false });
  }, [attemptData, isReady, tryout.activeAttemptId]);

  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "active") return;
    if (!attemptData) return;
    if (submitting) return;

    const saveCurrentProgress = () => {
      queueProgress(makeAttemptProgressPayload(attemptData.attempt.id, questions, answers, flagged, qIndex));
    };

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      saveCurrentProgress();
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    window.addEventListener("pagehide", saveCurrentProgress);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener("pagehide", saveCurrentProgress);
    };
  }, [answers, attemptData, flagged, phase, qIndex, questions, submitting]);

  useEffect(() => {
    if (phase !== "active") return;
    if (!attemptData) return;
    if (submitting) return;

    const payload = makeAttemptProgressPayload(attemptData.attempt.id, questions, answers, flagged, qIndex);
    const timer = window.setTimeout(() => {
      saveProgress(payload);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [answers, attemptData, flagged, phase, qIndex, questions, submitting]);

  useEffect(() => {
    if (!attemptData) return;

    const flushQueuedProgress = () => {
      const queuedProgress = readQueuedProgress(attemptData.attempt.id);

      if (!queuedProgress) return;

      saveProgress(queuedProgress);
    };

    window.addEventListener("online", flushQueuedProgress);

    return () => window.removeEventListener("online", flushQueuedProgress);
  }, [attemptData]);

  useEffect(() => {
    if (phase !== "active") return;
    if (!attemptData) return;
    if (submitting) return;
    if (timeLeft > 0) return;

    submitAttempt({
      data: {
        ...makeAttemptProgressPayload(attemptData.attempt.id, questions, answers, flagged, qIndex),
        autoSubmitReason: "deadline_reached",
      },
    })
      .then((result) => {
        removeQueuedProgress(result.attemptId);
        setSubmitting({ attemptId: result.attemptId });
      })
      .catch(() => {});
  }, [answers, attemptData, flagged, phase, qIndex, questions, submitting, timeLeft]);

  useEffect(() => {
    if (!submitting) return;
    const timer = setTimeout(() => {
      navigate({ to: "/results/$attemptId", params: { attemptId: String(submitting.attemptId) } });
    }, 8200);
    return () => clearTimeout(timer);
  }, [submitting, navigate]);

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
          <div className="mt-5 relative h-20 w-20 rounded-full border-2 border-primary-soft bg-white shadow-sm">
            <div
              className="absolute inset-2 rounded-full animate-spin"
              style={{
                background: "conic-gradient(from 0deg, #205072, #0ea5e9, #205072)",
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

  const resumeAttempt = async ({ withCountdown }: { withCountdown: boolean }) => {
    setStartError("");

    let nextAttemptData: TakeAttempt;

    try {
      nextAttemptData = await startOrResumeAttempt({ data: { tryoutId: tryout.id } });
    } catch (error) {
      setConfirmStart(false);
      setStartError(getStartErrorMessage(error));
      return;
    }

    const queuedProgress = readQueuedProgress(nextAttemptData.attempt.id);
    const nextAnswers = getRestoredAnswers(nextAttemptData, queuedProgress);
    const markedIndexes = getRestoredMarkedIndexes(nextAttemptData, queuedProgress);
    const nextQuestionIndex = getRestoredQuestionIndex(nextAttemptData, queuedProgress);

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(nextAttemptData.attempt.deadlineAt).getTime() - Date.now()) / 1000),
    );

    setAttemptData(nextAttemptData);
    setQuestions(nextAttemptData.questions);
    setAnswers(nextAnswers);
    setFlagged(markedIndexes);
    setQIndex(nextQuestionIndex);
    setSelected(nextAnswers[nextQuestionIndex] ?? null);
    setTimeLeft(remainingSeconds);
    setConfirmStart(false);
    setPhase(withCountdown ? "countdown" : "active");

    if (queuedProgress) {
      saveProgress(queuedProgress);
    }
  };

  const handleStart = () => {
    resumeAttempt({ withCountdown: true });
  };

  if (phase === "preparation") {
    return (
      <PreparationScreen
        tryout={tryout}
        totalQuestions={total}
        onBack={() => navigate({ to: "/tryout" })}
        onStart={() => setConfirmStart(true)}
        confirmOpen={confirmStart}
        onConfirmCancel={() => setConfirmStart(false)}
        onConfirmStart={handleStart}
        startError={startError}
      />
    );
  }

  if (phase === "countdown") {
    return <CountdownOverlay value={countdownValue} />;
  }

  if (submitting) {
    return <CalculatingOverlay />;
  }

  const q = questions[qIndex];
  if (!q || !attemptData) {
    return <CalculatingOverlay />;
  }

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
    submitAttempt({ data: makeAttemptProgressPayload(attemptData.attempt.id, questions, answers, flagged, qIndex) })
      .then((result) => {
        removeQueuedProgress(result.attemptId);
        setShowSubmitConfirm(false);
        setSubmitting({ attemptId: result.attemptId });
      })
      .catch(() => {
        setShowSubmitConfirm(false);
      });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Link to="/tryout" className="icon-btn shrink-0" aria-label="Tutup tryout">
            <CloseIcon />
          </Link>
          <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden min-w-0">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full font-extrabold text-[11px] sm:text-[12px] bg-white shadow-sm border-2 border-stone-200">
              {qIndex + 1}/{total}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full font-extrabold text-[11px] sm:text-[12px] shadow-sm border-2 ${
              isTimeLow ? "bg-red-50 border-red-300 text-red-600" : "bg-primary-tint border-brand-sky text-primary-dark"
            }`}>
              <ClockIcon />
              {timeDisplay}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-3xl mx-auto w-full pb-28">
        <div className="bg-white rounded-[var(--radius-xl)] p-5 sm:p-6 mb-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="flex justify-between items-start gap-3 mb-4">
            <span className="bg-primary text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full tracking-wide uppercase shrink-0">
              {q.categoryName.toUpperCase()}
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[var(--radius-md)] border-2 cursor-pointer flex items-center justify-center transition-all duration-150 ${
                  flagged.includes(qIndex) ? "bg-coral text-white border-coral-dark" : "bg-white text-stone-500 border-stone-200"
                }`}
                onClick={handleFlag}
                title="Ragu-ragu"
                type="button"
              >
                <FlagIcon />
              </button>
              <button
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-[var(--radius-md)] border-2 border-stone-200 bg-white text-stone-500 cursor-pointer flex items-center justify-center transition-all hover:bg-stone-50 hover:border-stone-300"
                onClick={() => setShowReport(true)}
                title="Laporkan soal"
                type="button"
              >
                <AlertIcon />
              </button>
            </div>
          </div>
          <h2 className="m-0 max-w-[34ch] text-lg font-bold leading-relaxed sm:text-xl">{q.questionText}</h2>
        </div>

        <div className="flex flex-col gap-2.5 sm:gap-3">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                className={`flex items-center gap-3 sm:gap-3.5 w-full text-left px-3.5 sm:px-4 py-3.5 sm:py-4.5 bg-white border-3 border-stone-200 rounded-[var(--radius-lg)] font-semibold text-sm sm:text-base cursor-pointer transition-all duration-100 ${
                  isSelected ? "border-primary bg-primary-tint" : ""
                }`}
                style={{ borderBottom: isSelected ? "5px solid var(--color-primary-dark)" : "5px solid var(--color-stone-300)" }}
                onClick={() => handleSelect(i)}
              >
                <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center font-bold shrink-0 transition-all duration-150 ${
                  isSelected ? "bg-primary border-b-3 text-white" : "bg-stone-200 border-b-3 text-stone-500"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        <SaveStatusLine status={saveStatus} lastSaved={lastSaved} />

        <div className="mt-6 bg-white rounded-[var(--radius-lg)] p-4 sm:p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="font-semibold text-xs text-stone-400 mb-3 uppercase tracking-wide">Navigasi Soal</div>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-2">
            {questions.map((_, i) => {
              let cls = "bg-stone-100 border-stone-200 text-stone-500";
              const isFlagged = flagged.includes(i);
              const isAnswered = answers[i] !== undefined;
              if (i === qIndex) {
                cls = "bg-primary border-primary-dark text-white border-b-primary-dark ring-2 ring-primary-light ring-offset-2";
              } else if (isAnswered) {
                if (isFlagged) {
                  cls = "bg-amber border-amber-dark text-white border-b-amber-dark";
                } else {
                  cls = "bg-success border-success-dark text-white border-b-success-dark";
                }
              }
              return (
                <button
                  key={i}
                  className={`aspect-square border-2 rounded-[8px] sm:rounded-[10px] font-extrabold text-[11px] sm:text-[13px] cursor-pointer transition-all duration-150 relative ${cls}`}
                  onClick={() => handleNav(i)}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-coral rounded-full border-2 border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-3xl -translate-x-1/2 rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-200 border-b-stone-300 bg-white/98 p-3 shadow-xl backdrop-blur-xl sm:p-4">
        <button
          className="btn btn-primary w-full"
          onClick={qIndex === total - 1 ? () => setShowSubmitConfirm(true) : () => {
            if (qIndex < total - 1) {
              setQIndex(qIndex + 1);
              setSelected(answers[qIndex + 1] ?? null);
            }
          }}
        >
          {qIndex === total - 1 ? "Selesai" : "Selanjutnya"}
        </button>
      </div>

      {showSubmitConfirm && (
        <div className="dialog-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) setShowSubmitConfirm(false) }}>
          <div className="dialog-box text-left">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 bg-primary-tint text-primary border-2 border-primary-soft flex items-center justify-center">
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
                  className="w-full text-left px-4 py-3 rounded-[var(--radius-md)] border-2 border-stone-200 font-semibold text-sm hover:border-primary hover:bg-primary-tint transition-all"
                  onClick={() => {
                    setShowReport(false);
                    reportAttemptQuestion({
                      data: {
                        attemptId: attemptData.attempt.id,
                        snapshotId: q.snapshotId,
                        reason: toReportReason(reason),
                      },
                    }).then(() => {
                      posthog.capture(productAnalyticsEvents.questionReported, {
                        tryout_id: tryout.id,
                        attempt_id: attemptData.attempt.id,
                        snapshot_id: q.snapshotId,
                        reason: toReportReason(reason),
                      });
                    }).catch(() => {});
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

function makeAttemptProgressPayload(
  attemptId: string,
  questions: TakeQuestion[],
  answers: (number | undefined)[],
  flagged: number[],
  lastQuestionIndex: number,
) {
  return {
    attemptId,
    lastQuestionIndex,
    answers: questions.map((question, index) => ({
      snapshotId: question.snapshotId,
      selectedOption: toOptionLetter(answers[index]),
    })),
    markedSnapshotIds: flagged
      .map((index) => questions[index]?.snapshotId)
      .filter((snapshotId): snapshotId is string => Boolean(snapshotId)),
  };
}

function getRestoredAnswers(
  attemptData: TakeAttempt,
  queuedProgress: AttemptProgressPayload | null,
) {
  const restoredAnswers = new Array<number | undefined>(attemptData.questions.length).fill(undefined);

  for (const answer of attemptData.answers) {
    const answerIndex = attemptData.questions.findIndex((question) => question.snapshotId === answer.snapshotId);

    if (answerIndex >= 0 && answer.selectedIndex !== null) {
      restoredAnswers[answerIndex] = answer.selectedIndex;
    }
  }

  if (!queuedProgress) return restoredAnswers;

  for (const answer of queuedProgress.answers) {
    const answerIndex = attemptData.questions.findIndex((question) => question.snapshotId === answer.snapshotId);

    if (answerIndex >= 0) {
      restoredAnswers[answerIndex] = toOptionIndex(answer.selectedOption);
    }
  }

  return restoredAnswers;
}

function getRestoredMarkedIndexes(
  attemptData: TakeAttempt,
  queuedProgress: AttemptProgressPayload | null,
) {
  const snapshotIds = queuedProgress?.markedSnapshotIds ?? attemptData.markedSnapshotIds;

  return snapshotIds
    .map((snapshotId) => attemptData.questions.findIndex((question) => question.snapshotId === snapshotId))
    .filter((index) => index >= 0);
}

function getRestoredQuestionIndex(
  attemptData: TakeAttempt,
  queuedProgress: AttemptProgressPayload | null,
) {
  const lastQuestionIndex = queuedProgress?.lastQuestionIndex ?? attemptData.attempt.lastQuestionIndex;
  const lastAvailableIndex = attemptData.questions.length - 1;

  if (lastAvailableIndex < 0) return 0;
  if (lastQuestionIndex < 0) return 0;
  if (lastQuestionIndex > lastAvailableIndex) return lastAvailableIndex;

  return lastQuestionIndex;
}

function toOptionLetter(index: number | undefined) {
  if (index === undefined) return null;

  const optionLetters = ["A", "B", "C", "D", "E"] as const;

  return optionLetters[index] ?? null;
}

function toOptionIndex(option: "A" | "B" | "C" | "D" | "E" | null) {
  if (!option) return undefined;

  const optionLetters = ["A", "B", "C", "D", "E"] as const;
  const optionIndex = optionLetters.findIndex((letter) => letter === option);

  if (optionIndex < 0) return undefined;

  return optionIndex;
}

function getProgressQueueKey(attemptId: string) {
  return `ilmorax:attempt-progress:${attemptId}`;
}

function queueProgress(payload: AttemptProgressPayload) {
  window.localStorage.setItem(getProgressQueueKey(payload.attemptId), JSON.stringify(payload));
}

function readQueuedProgress(attemptId: string) {
  const value = window.localStorage.getItem(getProgressQueueKey(attemptId));

  if (!value) return null;

  try {
    return JSON.parse(value) as AttemptProgressPayload;
  } catch {
    removeQueuedProgress(attemptId);
    return null;
  }
}

function removeQueuedProgress(attemptId: string) {
  window.localStorage.removeItem(getProgressQueueKey(attemptId));
}

function formatSavedTime(value: string) {
  const savedAt = new Date(value);

  return `${String(savedAt.getHours()).padStart(2, "0")}:${String(savedAt.getMinutes()).padStart(2, "0")}`;
}

function SaveStatusLine({ status, lastSaved }: { status: SaveStatus; lastSaved: string }) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <div className="text-center text-xs text-stone-400 mt-4 font-medium">
        Menyimpan jawaban...
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="text-center text-xs text-amber-600 mt-4 font-semibold">
        Offline. Jawaban disimpan di perangkat dan akan dikirim saat online.
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center text-xs text-rose-600 mt-4 font-semibold">
        Gagal menyimpan ke server. Perubahan disimpan sementara di perangkat.
      </div>
    );
  }

  if (!lastSaved) return null;

  return (
    <div className="text-center text-xs text-stone-400 mt-4 font-medium">
      Tersimpan pukul {lastSaved}
    </div>
  );
}

function getStartErrorMessage(error: unknown) {
  return getSafeErrorMessage(error, "Gagal memulai tryout. Silakan coba lagi.");
}

function toReportReason(reason: string) {
  if (reason === "Answer key salah") return "answer_key_wrong";
  if (reason === "Pembahasan keliru") return "explanation_wrong";
  if (reason === "Soal tidak jelas") return "question_unclear";
  if (reason === "Typo") return "typo";

  return "other";
}

interface PreparationScreenProps {
  tryout: TryoutPreparation;
  totalQuestions: number;
  onBack: () => void;
  onStart: () => void;
  confirmOpen: boolean;
  onConfirmCancel: () => void;
  onConfirmStart: () => void;
  startError: string;
}

function PreparationScreen({
  tryout,
  totalQuestions,
  onBack,
  onStart,
  confirmOpen,
  onConfirmCancel,
  onConfirmStart,
  startError,
}: PreparationScreenProps) {
  const avgSecondsPerQuestion = Math.round((tryout.durationMinutes * 60) / totalQuestions);
  const xpReward = 50 + totalQuestions * 20;
  const categoryName = tryout.categoryName;
  const color = tryout.categoryColor;
  const hasReachedDailyLimit = Boolean(
    !tryout.activeAttemptId &&
    tryout.dailyAttemptLimit !== null &&
    tryout.attemptsToday >= tryout.dailyAttemptLimit,
  );
  const attemptLimitText = tryout.hasExtendedPractice
    ? `Normal ${tryout.normalDailyAttemptLimit} kali pertama per hari dapat XP. Setelah itu tetap bisa latihan tanpa XP.`
    : `Maksimal ${tryout.dailyAttemptLimit} kali pengerjaan per hari untuk tryout yang sama.`;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] antialiased page-enter">
      <div
        className="relative overflow-hidden pb-10"
        style={{
          background:
            `radial-gradient(1200px 400px at 20% -10%, ${color}22, transparent 60%), radial-gradient(900px 500px at 90% -20%, ${color}18, transparent 70%), var(--color-bg)`,
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
                background: color,
                borderBottom: "5px solid rgba(0,0,0,0.18)",
              }}
            >
              <TryoutModuleIcon tryoutId={tryout.id} />
            </div>
            <span
              className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2"
              style={{
                color: color,
                borderColor: `${color}33`,
                background: `${color}10`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
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
          <StatCard icon={<DocumentIcon />} label="Jumlah Soal" value={`${totalQuestions}`} unit="soal" accent="#205072" />
          <StatCard icon={<ClockIcon />} label="Durasi" value={`${tryout.durationMinutes}`} unit="menit" accent="#0ea5e9" />
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
            <RuleItem icon={<RefreshIcon />}>
              {attemptLimitText}
            </RuleItem>
          </ul>
        </div>

        <div
          className={`mt-4 rounded-[var(--radius-lg)] p-4 text-[13px] font-medium flex items-start gap-3 border-2 ${
            hasReachedDailyLimit
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-primary-soft bg-primary-tint text-primary-dark"
          }`}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-white/70 bg-white/70">
            <RefreshIcon />
          </span>
          <div>
            <div className="font-semibold mb-0.5">Kesempatan hari ini</div>
            {tryout.hasExtendedPractice
              ? `Kamu sudah mengerjakan ${tryout.attemptsToday} kali hari ini. XP hanya diberikan untuk ${tryout.normalDailyAttemptLimit} kesempatan normal.`
              : `Kamu sudah mengerjakan ${tryout.attemptsToday}/${tryout.dailyAttemptLimit} kali hari ini.`}
            {hasReachedDailyLimit && " Silakan coba lagi besok."}
          </div>
        </div>

        {startError && (
          <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-rose-200 bg-rose-50 p-4 text-[13px] font-semibold text-rose-700">
            {startError}
          </div>
        )}

        {isPaidTryout(tryout.accessLevel) && (
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
              Modul ini membuka soal pilihan dan pembahasan lengkap untuk akses yang sesuai.
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t-2 border-stone-200 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div className="max-w-[480px] mx-auto px-5 py-4 flex gap-3">
          <button className="btn btn-white px-5" onClick={onBack}>
            Batal
          </button>
          <button className="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-55" onClick={onStart} disabled={hasReachedDailyLimit}>
            Mulai Tryout
          </button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && onConfirmCancel()}>
        <DialogContent className="p-6 text-left">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{
              background: `${color}1A`,
              color: color,
            }}
          >
            <TryoutModuleIcon tryoutId={tryout.id} />
          </div>
          <DialogTitle className="mb-2 text-center">
            Siap memulai?
          </DialogTitle>
          <DialogDescription className="mb-4 text-center text-stone-500">
            Timer akan berjalan selama {tryout.durationMinutes} menit dan tidak dapat dijeda.
            Pastikan kamu sudah siap.
          </DialogDescription>
          <div className="grid grid-cols-3 gap-2 mb-5 text-center">
            <MiniStat label="Soal" value={`${totalQuestions}`} />
            <MiniStat label="Menit" value={`${tryout.durationMinutes}`} />
            <MiniStat label="XP" value={`+${xpReward}`} />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-white flex-1" onClick={onConfirmCancel} type="button">
              Nanti dulu
            </button>
            <button className="btn btn-primary flex-1" onClick={onConfirmStart} type="button">
              Ya, mulai
            </button>
          </div>
        </DialogContent>
      </Dialog>
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

function TryoutModuleIcon({ tryoutId }: { tryoutId: string }) {
  if (tryoutId === "2") return <CapsuleIcon />;
  if (tryoutId === "3") return <HeartPulseIcon />;
  if (tryoutId === "4") return <MicrobeIcon />;
  if (tryoutId === "5") return <HospitalIcon />;
  if (tryoutId === "6") return <CalculatorIcon />;
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
      <path d="M2 8.82a15 15 0 0 1 20 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12.859a10 10 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20v-4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function CalculatingOverlay() {
  const steps = [
    "Memeriksa jawaban",
    "Menghitung skor",
    "Menganalisis performa",
    "Menyusun pembahasan",
    "Menyiapkan hasil",
  ];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => (i < steps.length ? i + 1 : i));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-stone-50">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(520px 360px at 50% 30%, rgba(20,184,166,0.18), transparent 70%), radial-gradient(720px 420px at 80% 10%, rgba(14,165,233,0.14), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      />
      <div className="relative flex flex-col items-center text-center px-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
          Memproses
        </div>
        <div className="mt-5 relative h-20 w-20 rounded-full border-2 border-primary-soft bg-white shadow-sm">
          <div
            className="absolute inset-2 rounded-full animate-spin"
            style={{
              background: "conic-gradient(from 0deg, #205072, #0ea5e9, #205072)",
              filter: "blur(10px)",
              opacity: 0.45,
            }}
          />
          <div className="absolute inset-4 rounded-full bg-white border-2 border-stone-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-primary" fill="none" aria-hidden="true">
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <p className="mt-5 text-[15px] font-semibold text-stone-700">
          Menghitung hasil tryout
        </p>
        <p className="mt-1 text-[13px] font-medium text-stone-500 max-w-[32ch]">
          Tunggu sebentar, kami sedang menyiapkan nilai dan pembahasanmu.
        </p>

        <ul className="mt-6 flex flex-col gap-2.5 text-left">
          {steps.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <li key={s} className="flex items-center gap-3 text-[13px] font-medium">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? "border-primary-light bg-primary-tint text-primary"
                      : active
                      ? "border-brand-sky bg-white text-primary"
                      : "border-stone-200 bg-white text-stone-300"
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                  )}
                </span>
                <span className={done ? "text-stone-500" : active ? "text-stone-800" : "text-stone-400"}>
                  {s}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
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
        <div className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary-soft/80 mb-6">
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

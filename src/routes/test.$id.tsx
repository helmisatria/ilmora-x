import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useApp, questionBank, tryouts, type Question, type WrongAnswer } from "../data";

export const Route = createFileRoute("/test/$id")({
  component: TestComponent,
});

function TestComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, isPremium, addAttempt } = useApp();
  const testId = parseInt(id, 10);
  const [isReady, setIsReady] = useState(false);
  const [tick, setTick] = useState(0);

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
  const [reportQuestion, setReportQuestion] = useState<number | null>(null);

  const [lastSaved, setLastSaved] = useState<string>("");

  useEffect(() => {
    setIsReady(true);
    setAnswers(new Array(questions.length).fill(undefined));
  }, [testId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && timeLeft % 30 === 0 && timeLeft !== tryout.duration * 60) {
      const now = new Date();
      setLastSaved(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    }
  }, [timeLeft]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center text-stone-400">
          <div className="text-3xl mb-3">🔄</div>
          <p>Memuat tryout...</p>
        </div>
      </div>
    );
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
    const wrongs: WrongAnswer[] = [];
    questions.forEach((question, i) => {
      const sel = answers[i];
      const ok = sel === question.correct;
      if (ok) {
        correct++;
      } else {
        const wrongAnswer: WrongAnswer = {
          id: question.id,
          subject: getCategoryLabel(question.categoryId),
          question: question.question,
          options: question.options,
          correct: question.correct,
          explanation: question.explanation,
          explanationPreview: question.explanation.slice(0, 120) + "...",
          videoUrl: question.videoUrl,
          isPremium: question.isPremium,
          user: sel !== undefined ? question.options[sel] : "Tidak dijawab",
        };
        wrongs.push(wrongAnswer);
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    const xpEarn = 50 + correct * 20;
    navigate({ to: "/results" });
  };

  function getCategoryLabel(catId: string): string {
    const labels: Record<string, string> = {
      klinis: "KLINIS",
      farmakologi: "FARMAKOLOGI",
      "farmasi-klinik": "FARMASI KLINIS",
    };
    return labels[catId] || catId.toUpperCase();
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl flex items-center gap-3 px-4 py-3.5 border-b-2 border-stone-200">
        <Link to="/tryout" className="icon-btn">✕</Link>
        <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-2">
          <div className="px-3.5 py-2 rounded-full font-extrabold text-[12px] bg-white shadow-sm border-2 border-stone-200">
            {qIndex + 1}/{total}
          </div>
          <div className={`px-3.5 py-2 rounded-full font-extrabold text-[12px] shadow-sm border-2 ${
            isTimeLow ? "bg-red-50 border-red-300 text-red-600" : "bg-teal-50 border-teal-200 text-teal-700"
          }`}>
            ⏱ {timeDisplay}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-[640px] mx-auto w-full pb-24">
        <div className="bg-white rounded-[var(--radius-xl)] p-6 mb-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-primary text-white text-[11px] font-black px-3.5 py-1.5 rounded-full tracking-wide uppercase">
              {getCategoryLabel(q.categoryId)}
            </span>
            <div className="flex gap-2">
              <button
                className={`w-11 h-11 rounded-[var(--radius-md)] border-2 text-xl cursor-pointer flex items-center justify-center transition-all duration-150 ${
                  flagged.includes(qIndex) ? "bg-coral border-coral-dark" : "bg-white border-stone-200"
                }`}
                onClick={handleFlag}
                title="Ragu-ragu"
              >
                🚩
              </button>
              <button
                className="w-11 h-11 rounded-[var(--radius-md)] border-2 border-stone-200 bg-white text-xl cursor-pointer flex items-center justify-center transition-all hover:bg-stone-50 hover:border-stone-300"
                onClick={() => setShowReport(true)}
                title="Laporkan soal"
              >
                ⚠️
              </button>
            </div>
          </div>
          <h2 className="text-xl font-bold leading-relaxed m-0">{q.question}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-4.5 bg-white border-3 border-stone-200 rounded-[var(--radius-lg)] font-semibold text-base cursor-pointer transition-all duration-100 ${
                  isSelected
                    ? "border-primary bg-teal-50 border-b-primary-dark"
                    : "border-b-stone-300"
                }`}
                style={{ borderBottom: isSelected ? "5px solid var(--color-primary-dark)" : "5px solid var(--color-stone-300)" }}
                onClick={() => handleSelect(i)}
              >
                <span className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-black shrink-0 transition-all duration-150 ${
                  isSelected
                    ? "bg-primary border-b-3 text-white"
                    : "bg-stone-200 border-b-3 text-stone-500"
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
          <div className="font-black text-xs text-stone-400 mb-3 uppercase tracking-wide">Navigasi Soal</div>
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
          onClick={qIndex === total - 1 ? handleSubmit : () => {
            if (qIndex < total - 1) {
              setQIndex(qIndex + 1);
              setSelected(answers[qIndex + 1] ?? null);
            }
          }}
        >
          {qIndex === total - 1 ? "SELESAI" : "SELANJUTNYA"}
        </button>
      </div>

      {showReport && (
        <div className="dialog-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}>
          <div className="dialog-box text-left">
            <h3 className="text-xl font-black mb-3">🚨 Laporkan Soal</h3>
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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { questionBank, state, type Question, type WrongAnswer } from "../data/state";

export const Route = createFileRoute("/test/$id")({
  component: TestComponent,
});

function TestComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const testId = parseInt(id, 10);
  const [isReady, setIsReady] = useState(false);
  const [tick, setTick] = useState(0); // For forcing re-renders

  // Initialize test if not started or different test
  useEffect(() => {
    if (!state.test || state.test.id !== testId) {
      const qs = questionBank[testId] || questionBank[1];
      state.test = {
        id: testId,
        qIndex: 0,
        selected: null,
        flagged: [],
        questions: JSON.parse(JSON.stringify(qs)) as Question[],
        answers: [],
      };
    }
    setIsReady(true);
  }, [testId]);

  const test = state.test;

  if (!isReady || !test) {
    return (
      <div className="test-view" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center", color: "var(--gray-400)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔄</div>
          <p>Memuat tryout...</p>
        </div>
      </div>
    );
  }

  const q = test.questions[test.qIndex];
  const total = test.questions.length;
  const pct = Math.round((test.qIndex / total) * 100);

  const handleOptionClick = (i: number) => {
    test.selected = i;
    test.answers[test.qIndex] = i;
    // Force re-render
    setTick((t) => t + 1);
  };

  const handleNext = () => {
    if (test.qIndex < test.questions.length - 1) {
      test.qIndex++;
      test.selected = test.answers[test.qIndex] ?? null;
      setTick((t) => t + 1);
    } else {
      // Submit
      let correct = 0;
      const wrongs: WrongAnswer[] = [];
      test.questions.forEach((question, i) => {
        const sel = test.answers[i];
        const ok = sel === question.correct;
        if (ok) {
          correct++;
        } else {
          const wrongAnswer: WrongAnswer = {
            id: question.id,
            subject: question.subject,
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
      const score = Math.round((correct / test.questions.length) * 100);
      const xpEarn = 50 + correct * 20;
      state.xp += xpEarn;
      state.gems += 12;
      state.streak++;
      state.lastResults = { score, correct, total: test.questions.length, xpEarn, wrongs };
      navigate({ to: "/results" });
    }
  };

  const handleFlag = () => {
    const i = test.qIndex;
    if (test.flagged.includes(i)) {
      test.flagged = test.flagged.filter((x) => x !== i);
    } else {
      test.flagged = [...test.flagged, i];
    }
    setTick((t) => t + 1);
  };

  const handleNavClick = (i: number) => {
    test.qIndex = i;
    test.selected = test.answers[i] ?? null;
    setTick((t) => t + 1);
  };

  return (
    <div className="test-view" key={tick}>
      <div className="test-header">
        <Link to="/tryout" className="icon-btn">
          ✕
        </Link>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="header-pills">
          <div className="pill">
            Soal {test.qIndex + 1}/{total}
          </div>
          <div className="pill timer">01:48</div>
        </div>
      </div>
      <div className="test-body">
        <div className="q-card">
          <div className="q-top">
            <span className="q-subject">{q.subject}</span>
            <button
              className={`flag-btn ${test.flagged.includes(test.qIndex) ? "active" : ""}`}
              onClick={handleFlag}
              title="Ragu-ragu"
            >
              🚩
            </button>
          </div>
          <h2 className="q-text">{q.question}</h2>
        </div>
        <div className="options">
          {q.options.map((opt, i) => {
            const classes = ["option"];
            if (test.selected === i) classes.push("selected");
            return (
              <button key={i} className={classes.join(" ")} onClick={() => handleOptionClick(i)}>
                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="q-navigator">
          <div className="nav-title">Navigasi Soal</div>
          <div className="nav-grid">
            {test.questions.map((_, i) => {
              let cls = "nav-btn";
              if (i === test.qIndex) cls += " current";
              else if (test.answers[i] !== undefined) cls += " answered";
              if (test.flagged.includes(i)) cls += " flagged";
              return (
                <button key={i} className={cls} onClick={() => handleNavClick(i)}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="test-footer">
        <button className="btn btn-primary btn-check" onClick={handleNext}>
          {test.qIndex === total - 1 ? "SELESAI" : "SELANJUTNYA"}
        </button>
      </div>
    </div>
  );
}

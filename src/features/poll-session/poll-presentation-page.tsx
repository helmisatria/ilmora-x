import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { subscribeToPollUpdates } from "./poll-live-client";
import { getPollSessionAdmin } from "./poll-admin-functions";
import "./poll-presentation.css";

export const pollOptions = ["A", "B", "C", "D", "E"] as const;

type PollOption = (typeof pollOptions)[number];
export type PollSessionDetail = Awaited<ReturnType<typeof getPollSessionAdmin>>;
type PollRound = PollSessionDetail["rounds"][number];

export function PollPresentationPage({ detail }: { detail: PollSessionDetail }) {
  const router = useRouter();
  const activeRound = detail.rounds.find((round) => round.status === "open") ?? null;
  const latestRound = detail.rounds.at(-1) ?? null;
  const round = activeRound ?? latestRound ?? null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const joinHost = useJoinHost();

  useEffect(() => {
    if (detail.session.status !== "open") return;

    const unsubscribe = subscribeToPollUpdates({
      sessionId: detail.session.id,
      onUpdate: () => {
        router.invalidate();
      },
    });

    return unsubscribe;
  }, [detail.session.id, detail.session.status, router]);

  useEffect(() => {
    if (!activeRound?.timerSeconds) {
      setSecondsLeft(null);
      return;
    }

    const openedAt = new Date(activeRound.openedAt).getTime();
    const totalMs = activeRound.timerSeconds * 1000;
    const update = () => {
      setSecondsLeft(Math.max(Math.ceil((openedAt + totalMs - Date.now()) / 1000), 0));
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeRound?.id, activeRound?.openedAt, activeRound?.timerSeconds]);

  const totalAnswers = round?.totalAnswers ?? 0;
  const joined = detail.participants.length;
  const isRevealed = Boolean(round && round.status === "closed");

  return (
    <main className="poll-present">
      <div className="poll-present-inner">
        <header className="poll-present-head">
          <h1 className="poll-present-brand">
            <i />
            IlmoraX · Live Poll
          </h1>

          <div className="poll-present-code">
            <span className="poll-present-eyebrow">Kode Poll</span>
            <strong>{detail.session.code}</strong>
            <span>{joinHost}</span>
          </div>
        </header>

        <section className="poll-present-body">
          {round ? (
            <>
              <div className="poll-present-question-block">
                <div className="poll-present-round">
                  {round.label}
                  {isRevealed ? " · Jawaban dibuka" : " · Pertanyaan"}
                </div>
                {round.questionText ? (
                  <h2 className="poll-present-question">{round.questionText}</h2>
                ) : (
                  <p className="poll-present-question is-empty">Lihat soal dari pembimbing.</p>
                )}
                {isRevealed ? (
                  <p className="poll-present-answer">Jawaban benar {round.correctOption}</p>
                ) : (
                  <p className="poll-present-answer is-quiet">Jawab di perangkat masing-masing</p>
                )}
              </div>

              <ol className="poll-present-options">
                {pollOptions.map((option) => {
                  const text = getRoundOptionText(round, option);
                  const count = round.counts[option] ?? 0;
                  const percent = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                  const isCorrect = isRevealed && round.correctOption === option;

                  return (
                    <li className={`poll-present-row ${isCorrect ? "is-correct" : ""}`} key={option}>
                      <span className="poll-present-letter">{option}</span>
                      <span className="poll-present-text">{text || "—"}</span>
                      <span className="poll-present-count">{count}</span>
                      <div className="poll-present-track">
                        <div className="poll-present-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <div className="poll-present-waiting">
              <span className="poll-present-eyebrow">Menunggu</span>
              <p>Menunggu round dimulai.</p>
            </div>
          )}
        </section>

        <footer className="poll-present-foot">
          {joined > 0 && (
            <div className="poll-present-dots" aria-hidden="true">
              {Array.from({ length: Math.min(joined, 24) }, (_, index) => (
                <i className={index < totalAnswers ? "is-on" : ""} key={index} />
              ))}
            </div>
          )}
          <span className="poll-present-status">
            <strong>{totalAnswers}/{joined}</strong> sudah menjawab
          </span>
          {joinHost && <span className="poll-present-help">{joinHost}</span>}
          {secondsLeft !== null && (
            <div className={`poll-present-timer ${secondsLeft <= 10 ? "is-low" : ""}`}>
              <small>sisa</small>
              {formatCountdown(secondsLeft)}
              <small>detik</small>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}

function getRoundOptionText(round: PollRound, option: PollOption) {
  if (option === "A") return round.optionA;
  if (option === "B") return round.optionB;
  if (option === "C") return round.optionC;
  if (option === "D") return round.optionD;
  return round.optionE;
}

function formatCountdown(totalSeconds: number) {
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function useJoinHost() {
  const [joinHost, setJoinHost] = useState("");

  useEffect(() => {
    setJoinHost(`${window.location.host}/poll`);
  }, []);

  return joinHost;
}

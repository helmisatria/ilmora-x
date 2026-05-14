import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../data";
import { getPollStudentState, joinPollSession, submitPollAnswer } from "../lib/poll-functions";
import { getSafeErrorMessage } from "../lib/user-errors";

const pollOptions = ["A", "B", "C", "D", "E"] as const;
type PollOption = (typeof pollOptions)[number];
type StudentState = Awaited<ReturnType<typeof getPollStudentState>>;

export const Route = createFileRoute("/poll/$code")({
  head: ({ params }) => ({
    meta: [
      { title: "Live Poll — IlmoraX" },
      { name: "description", content: `Gabung live poll dengan kode ${params.code}. Vote jawaban dan lihat hasil setelah round ditutup.` },
      { property: "og:title", content: "Live Poll — IlmoraX" },
      { property: "og:description", content: "Gabung live poll dan vote jawaban secara real-time." },
    ],
  }),
  component: PollActiveComponent,
});

function PollActiveComponent() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<StudentState | null>(null);
  const [error, setError] = useState("");
  const [busyOption, setBusyOption] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const loadState = useCallback(async () => {
    const participantToken = getStoredParticipantToken(code);
    const nextState = await getPollStudentState({ data: { code, participantToken } });

    setState(nextState);
  }, [code]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const participantToken = getStoredParticipantToken(code);
        const nextState = await getPollStudentState({ data: { code, participantToken } });

        if (!isMounted) return;

        setState(nextState);
      } catch (error) {
        if (!isMounted) return;

        setError(getSafeErrorMessage(error, "Poll tidak bisa dibuka."));
      }
    };

    load();
    const intervalId = window.setInterval(load, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [code, navigate, loadState]);

  useEffect(() => {
    if (!state?.round || !state.round.timerSeconds || state.round.status !== "open") {
      setSecondsLeft(null);
      return;
    }

    const openedAt = new Date(state.round.openedAt).getTime();
    const timerLimitMs = state.round.timerSeconds * 1000;

    const calculate = () => {
      const now = Date.now();
      const remaining = Math.max(
        Math.ceil((openedAt + timerLimitMs - now) / 1000),
        0,
      );

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        loadState();
      }
    };

    calculate();
    const countdownId = window.setInterval(calculate, 1000);

    return () => window.clearInterval(countdownId);
  }, [state?.round?.id, state?.round?.status, state?.round?.openedAt, state?.round?.timerSeconds, loadState, state?.round]);

  const answer = async (selectedOption: PollOption) => {
    const participantToken = getStoredParticipantToken(code);

    if (!participantToken || !state?.joined || !state.round) {
      await navigate({ to: "/poll/join" });
      return;
    }

    setBusyOption(selectedOption);
    setError("");

    try {
      await submitPollAnswer({
        data: {
          roundId: state.round.id,
          participantToken,
          selectedOption,
        },
      });
      await loadState();
    } catch (error) {
      setError(getSafeErrorMessage(error, "Jawaban gagal dikirim."));
    } finally {
      setBusyOption("");
    }
  };

  if (error && !state) {
    return (
      <StateShell title="Poll tidak tersedia" kicker="Live Poll" description={error}>
        <Link to="/poll/join" className="btn btn-primary mt-6 w-full">Kembali</Link>
      </StateShell>
    );
  }

  if (!state || !state.joined) {
    if (state && !state.joined) {
      return (
        <JoinPollFromCode
          code={code}
          session={state.session}
          onJoined={loadState}
        />
      );
    }

    return <PollLoading />;
  }

  const round = state.round;
  const isTimerActive = Boolean(round?.timerSeconds);
  const isRoundOpen = round?.status === "open";
  const isRoundClosed = round?.status === "closed";
  const isRoundTimeExpired = secondsLeft === 0;
  const isTimerUrgent = isTimerActive && secondsLeft !== null && secondsLeft > 0 && secondsLeft <= 10;
  const canAnswer = isRoundOpen && !isRoundTimeExpired;
  const hasAnswered = Boolean(state.myAnswer);

  const countdownText = isTimerActive && secondsLeft !== null
    ? `Sisa waktu: ${formatCountdown(secondsLeft)}`
    : "";

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 42%, #eef8f6 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 320px at 14% -18%, #f59e0b33, transparent 62%), radial-gradient(760px 340px at 94% -14%, rgba(32,80,114,0.12), transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[880px] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link to="/poll/join" className="icon-btn" aria-label="Kembali">
              <ArrowLeftIcon />
            </Link>
            <div className="rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
              {state.session.code}
            </div>
          </div>

          <div className="pt-7">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              {state.participant.displayName}
            </div>
            <h1 className="mt-2 max-w-[16ch] text-[34px] font-black leading-tight tracking-tight text-stone-800 sm:text-[44px]">
              {state.session.title}
            </h1>
            <p className="m-0 mt-3 max-w-[52ch] text-[14px] font-semibold leading-relaxed text-stone-500 sm:text-[15px]">
              Lihat soal dari pembimbing, lalu pilih A, B, C, D, atau E di sini.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[880px] gap-5 px-5 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                {round ? round.label : "Waiting"}
              </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-800">
                {getRoundTitle(round?.status)}
              </h2>
            </div>
            {countdownText ? (
              <div className={`rounded-[var(--radius-md)] border-2 px-3 py-2 text-xs font-black ${
                isRoundTimeExpired
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : isTimerUrgent
                    ? "border-rose-300 bg-rose-50 text-rose-700 animate-pulse"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }`}>
                {countdownText}
              </div>
            ) : null}
            {state.myScore && (
              <div className="rounded-[var(--radius-lg)] border-2 border-primary-soft bg-primary-tint px-3 py-2 text-right">
                <div className="text-[10px] font-black uppercase tracking-wide text-primary-dark">Rank</div>
                <div className="text-xl font-black text-primary">#{state.myScore.rank}</div>
              </div>
            )}
          </div>

          {round && (
            <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
              {pollOptions.map((option) => {
                const selected = state.myAnswer?.selectedOption === option;
                const correct = isRoundClosed && round.correctOption === option;

                return (
                  <button
                    key={option}
                    className={`flex aspect-square min-h-14 items-center justify-center rounded-[var(--radius-lg)] border-2 border-b-4 text-2xl font-black transition-all duration-150 active:translate-y-0.5 ${
                      correct
                    ? "border-green-200 border-b-green-500 bg-green-50 text-success"
                    : selected
                          ? "border-primary border-b-primary-dark bg-primary-tint text-primary-dark"
                          : "border-stone-100 border-b-stone-200 bg-white text-primary hover:-translate-y-0.5 hover:shadow-sm"
                    }`}
                    onClick={() => answer(option)}
                    disabled={!canAnswer || Boolean(busyOption)}
                    type="button"
                  >
                    {busyOption === option ? "..." : option}
                  </button>
                );
              })}
            </div>
          )}

          {!round && (
            <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-dashed border-stone-200 bg-stone-50 p-6 text-center">
              <p className="text-sm font-extrabold text-stone-600">Menunggu dimulai.</p>
            </div>
          )}

          {hasAnswered && isRoundOpen && (
            <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-primary-soft bg-primary-tint p-4 text-sm font-bold text-primary-darker">
              Jawaban tersimpan. Kamu masih bisa menggantinya sampai pembimbing reveal hasilnya.
            </div>
          )}

          {isRoundTimeExpired && isRoundOpen ? (
            <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
              Waktu habis. Menunggu pembimbing menutup round.
            </div>
          ) : null}

          {state.myAnswer && isRoundClosed && (
            <div className={`mt-5 rounded-[var(--radius-lg)] border-2 border-b-4 p-4 ${state.myAnswer.isCorrect ? "border-green-200 border-b-green-500 bg-green-50 text-green-800" : "border-rose-200 border-b-rose-400 bg-rose-50 text-rose-800"}`}>
              <div className="text-[10px] font-black uppercase tracking-wide opacity-70">Hasil round</div>
              <div className="mt-1 text-xl font-black">
                {state.myAnswer.isCorrect ? "Benar" : "Belum tepat"} · {state.myAnswer.points ?? 0} poin
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-coral-dark">
              {error}
            </div>
          )}
        </section>

        <aside className="grid gap-5">
          <ParticipantStatusList statuses={state.participantStatuses} />
          <TopScores scores={state.topScores} />
        </aside>
      </div>
    </main>
  );
}

function JoinPollFromCode({
  code,
  session,
  onJoined,
}: {
  code: string;
  session: Extract<StudentState, { joined: false }>["session"];
  onJoined: () => Promise<void>;
}) {
  const { user } = useApp();
  const [displayName, setDisplayName] = useState(user.email ? user.name : "");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const needsName = !user.email;

  const join = async () => {
    if (needsName && !displayName.trim()) {
      setError("Isi nama tampilan dulu.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const result = await joinPollSession({
        data: {
          code,
          displayName,
          participantToken: getStoredParticipantToken(code),
        },
      });

      window.localStorage.setItem(getParticipantStorageKey(code), result.participantToken);
      await onJoined();
    } catch (error) {
      setError(getSafeErrorMessage(error, "Gagal gabung Poll."));
    } finally {
      setJoining(false);
    }
  };

  return (
    <StateShell
      title={session.title}
      kicker={`Live Poll ${session.code}`}
      description="Masukkan nama tampilan untuk bergabung ke sesi ini."
    >
      {needsName ? (
        <input
          type="text"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setError("");
          }}
          placeholder="Nama kamu"
          className="mt-6 w-full rounded-[var(--radius-md)] border-2 border-stone-200 px-4 py-3 text-center font-semibold outline-none transition-colors focus:border-primary"
        />
      ) : (
        <div className="mt-6 rounded-[var(--radius-md)] border-2 border-primary-soft bg-primary-tint p-3 text-xs font-bold text-primary-darker">
          Poll akan memakai akunmu: {user.name}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-coral-dark">
          {error}
        </div>
      )}

      <button className="btn btn-primary mt-5 w-full" onClick={join} disabled={joining} type="button">
        {joining ? "Menghubungkan..." : "Gabung Poll"}
      </button>
    </StateShell>
  );
}

function ParticipantStatusList({ statuses }: { statuses: Extract<StudentState, { joined: true }>["participantStatuses"] }) {
  const answeredCount = statuses.filter((status) => status.answered).length;

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">Status peserta</div>
        <div className="rounded-full border-2 border-primary-soft bg-primary-tint px-2.5 py-1 text-[10px] font-black text-primary-dark">
          {answeredCount}/{statuses.length}
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-3">
        {statuses.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((status) => (
              <div
                key={status.id}
                className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                  status.answered
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-stone-200 bg-stone-50 text-stone-500"
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.answered ? "bg-success" : "bg-stone-300"}`} />
                <span className="min-w-0 truncate">{status.displayName}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-2 text-sm font-semibold text-stone-400">Belum ada peserta.</p>
        )}
      </div>
    </section>
  );
}

function TopScores({ scores }: { scores: Extract<StudentState, { joined: true }>["topScores"] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">Top skor</div>
      <div className="mt-3 grid gap-2">
        {scores.map((score) => (
          <div key={score.participantId} className="flex items-center gap-3 rounded-[var(--radius-md)] border-2 border-amber-100 bg-amber-50 px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">#{score.rank}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-black text-stone-800">{score.displayName}</span>
            <span className="text-sm font-black text-primary">{score.totalPoints}</span>
          </div>
        ))}
        {scores.length === 0 && <p className="text-sm font-semibold text-stone-400">Belum ada skor.</p>}
      </div>
    </section>
  );
}

function PollLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-5 py-12">
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
          Live Poll
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
              <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h1 className="mt-5 text-[22px] font-bold leading-tight tracking-tight text-stone-800">
          Menghubungkan Poll
        </h1>
        <p className="mt-1.5 text-[13.5px] font-medium text-stone-500 max-w-[32ch]">
          Sebentar, kami membaca sesi kelas.
        </p>
      </div>
    </main>
  );
}

function StateShell({ title, kicker, description, children }: { title: string; kicker: string; description: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-5 py-12">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(520px 360px at 50% 30%, rgba(20,184,166,0.14), transparent 70%), radial-gradient(720px 420px at 80% 10%, rgba(14,165,233,0.10), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      />
      <div className="poll-state-card relative w-full max-w-[420px] rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-7 text-center shadow-sm">
        <div className="poll-state-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary-soft bg-primary-tint text-primary">
          <SignalIcon />
        </div>
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          {kicker}
        </div>
        <h1 className="mx-auto mt-2 text-[26px] font-bold leading-tight tracking-tight text-stone-800">
          {title}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500">
          {description}
        </p>
        {children}
      </div>
    </main>
  );
}

function getParticipantStorageKey(code: string) {
  return `ilmorax:poll:${code}:participant-token`;
}

function getStoredParticipantToken(code: string) {
  if (typeof window === "undefined") return undefined;

  return window.localStorage.getItem(getParticipantStorageKey(code)) ?? undefined;
}

function getRoundTitle(status: string | undefined) {
  if (status === "open") return "Pilih jawabanmu";
  if (status === "closed") return "Hasil round";

  return "Menunggu pembimbing";
}

function formatCountdown(totalSeconds: number) {
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle className="poll-signal-dot" cx="12" cy="17" r="1.7" fill="currentColor" />
      <path
        className="poll-signal-wave poll-signal-wave-inner"
        d="M8.7 13.8a5 5 0 0 1 6.6 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        className="poll-signal-wave poll-signal-wave-outer"
        d="M5.2 10.5a10.1 10.1 0 0 1 13.6 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

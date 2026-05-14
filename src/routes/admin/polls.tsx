import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  archivePollSessionAdmin,
  closePollRoundAdmin,
  closePollSessionAdmin,
  correctPollRoundAdmin,
  createPollRoundAdmin,
  createPollSessionAdmin,
  getPollSessionAdmin,
  listPollSessionsAdmin,
  reopenPollSessionAdmin,
} from "../../lib/poll-functions";
import { getSafeErrorMessage } from "../../lib/user-errors";

const pollOptions = ["A", "B", "C", "D", "E"] as const;
const searchSchema = z.object({
  sessionId: z.string().optional(),
});

type PollOption = (typeof pollOptions)[number];
type PollSessionList = Awaited<ReturnType<typeof listPollSessionsAdmin>>;
type PollSessionDetail = Awaited<ReturnType<typeof getPollSessionAdmin>>;
type PollRound = PollSessionDetail["rounds"][number];

export const Route = createFileRoute("/admin/polls")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ sessionId: search.sessionId }),
  loader: async ({ deps }) => {
    const sessions = await listPollSessionsAdmin();
    const selectedSessionId = deps.sessionId || sessions.find((session) => session.status === "open")?.id || sessions[0]?.id || "";
    const detail = selectedSessionId
      ? await getPollSessionAdmin({ data: { sessionId: selectedSessionId } }).catch(() => null)
      : null;

    return { sessions, detail };
  },
  head: () => ({ meta: [{ title: "Polls — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPollsPage,
});

function AdminPollsPage() {
  const { sessions, detail } = Route.useLoaderData() as {
    sessions: PollSessionList;
    detail: PollSessionDetail | null;
  };
  const router = useRouter();
  const navigate = useNavigate();
  const [title, setTitle] = useState(defaultSessionTitle());
  const [correctOption, setCorrectOption] = useState<PollOption>("A");
  const [roundLabel, setRoundLabel] = useState("");
  const [timerSeconds, setTimerSeconds] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedSessionId, setCopiedSessionId] = useState("");

  useEffect(() => {
    if (!detail || detail.session.status !== "open") return;

    const intervalId = window.setInterval(() => {
      router.invalidate();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [detail, router]);

  const activeRound = detail?.rounds.find((round) => round.status === "open") ?? null;
  const latestRound = detail?.rounds.at(-1) ?? null;
  const visibleRound = activeRound ?? latestRound ?? null;

  const runAction = async (actionName: string, action: () => Promise<unknown>) => {
    setBusyAction(actionName);
    setErrorMessage("");

    try {
      await action();
      await router.invalidate();
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Poll action failed."));
    } finally {
      setBusyAction("");
    }
  };

  const createSession = async () => {
    await runAction("create-session", async () => {
      const nextDetail = await createPollSessionAdmin({ data: { title, accessMode: "open_guest" } });
      setTitle(defaultSessionTitle());
      await navigate({ to: "/admin/polls", search: { sessionId: nextDetail.session.id } });
    });
  };

  const createRound = async () => {
    if (!detail) return;

    await runAction("create-round", async () => {
      await createPollRoundAdmin({
        data: {
          sessionId: detail.session.id,
          label: roundLabel,
          correctOption,
          timerSeconds: timerSeconds ? Number(timerSeconds) : null,
        },
      });
      setRoundLabel("");
      setTimerSeconds("");
    });
  };

  const closeRound = async (roundId: string) => {
    await runAction("close-round", () => closePollRoundAdmin({ data: { roundId } }));
  };

  const correctRound = async (roundId: string, nextCorrectOption: PollOption) => {
    await runAction(`correct-${roundId}`, () => correctPollRoundAdmin({ data: { roundId, correctOption: nextCorrectOption } }));
  };

  const closeSession = async () => {
    if (!detail) return;

    await runAction("close-session", () => closePollSessionAdmin({ data: { sessionId: detail.session.id } }));
  };

  const reopenSession = async () => {
    if (!detail) return;

    await runAction("reopen-session", () => reopenPollSessionAdmin({ data: { sessionId: detail.session.id } }));
  };

  const archiveSession = async () => {
    if (!detail) return;

    await runAction("archive-session", () => archivePollSessionAdmin({
      data: {
        sessionId: detail.session.id,
        archived: detail.session.archivedAt === null,
      },
    }));
  };

  const copyStudentUrl = async () => {
    if (!detail) return;
    if (typeof window === "undefined") return;

    const studentUrl = `${window.location.origin}/poll/${detail.session.code}`;

    try {
      await window.navigator.clipboard.writeText(studentUrl);
      setCopiedSessionId(detail.session.id);
      window.setTimeout(() => setCopiedSessionId(""), 1800);
    } catch {
      setErrorMessage("Poll URL was not copied. Copy it from the share field.");
    }
  };

  return (
    <main className="admin-shell">
      <div className="admin-lane">
        <header className="admin-header flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <a href="/admin" className="admin-back-link">Admin</a>
            <h1 className="admin-title">Poll Sessions</h1>
            <p className="admin-description">Run live A/B/C/D/E classroom rounds with session-local scores and history.</p>
          </div>
          <button className="admin-button-primary w-fit" onClick={createSession} disabled={busyAction === "create-session"} type="button">
            Start Session
          </button>
        </header>

        {errorMessage && <p className="admin-alert mt-6">{errorMessage}</p>}

        <section className="admin-panel mt-6 p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
            <label className="block">
              <span className="admin-kicker">New session title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="admin-control mt-2" />
            </label>
            <button className="admin-button-secondary h-12" onClick={createSession} disabled={busyAction === "create-session"} type="button">
              Create
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <SessionList sessions={sessions} selectedSessionId={detail?.session.id ?? ""} />

          {detail ? (
            <section className="grid gap-5">
              <div
                className="relative overflow-hidden rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-6 text-amber-50 shadow-sm"
              >
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    background:
                      "radial-gradient(420px 220px at 88% 0%, rgba(245,158,11,0.34), transparent 70%), radial-gradient(320px 210px at 0% 100%, rgba(20,184,166,0.18), transparent 72%)",
                  }}
                />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-200/80">
                      <span className={`h-1.5 w-1.5 rounded-full ${detail.session.status === "open" ? "bg-green-400" : "bg-amber-300"}`} />
                      {detail.session.status === "open" ? "Live classroom" : "History"}
                    </div>
                    <h2 className="mt-2.5 text-[28px] font-black leading-tight tracking-tight text-amber-50 sm:text-3xl">
                      {detail.session.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-amber-100/70">
                      {detail.participants.length} peserta · {detail.rounds.length} rounds · {formatDateTime(detail.session.openedAt)}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-[var(--radius-lg)] border-2 border-amber-300/40 bg-amber-200/10 p-4 text-center lg:w-[260px]">
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-200/70">Kode Poll</div>
                    <div className="mt-1.5 text-[42px] font-black leading-none tracking-[0.2em] text-amber-50">{detail.session.code}</div>
                    <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-amber-200/20 bg-black/15 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-left text-[11px] font-bold text-amber-100/70">
                        {getStudentPollUrl(detail.session.code)}
                      </span>
                    </div>
                    <button
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-amber-300 px-3 py-2.5 text-xs font-black text-stone-900 shadow-[inset_0_-2px_0_rgba(180,83,9,0.5)] transition-all hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-[inset_0_-2px_0_rgba(180,83,9,0.5),0_4px_12px_rgba(245,158,11,0.25)] active:translate-y-0 active:shadow-[inset_0_-2px_0_rgba(180,83,9,0.5)]"
                      onClick={copyStudentUrl}
                      type="button"
                    >
                      {copiedSessionId === detail.session.id ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          Copy student URL
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {detail.session.status === "open" && (
                <section className="admin-panel p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <label className="block flex-1">
                      <span className="admin-kicker">Round label</span>
                      <input value={roundLabel} onChange={(event) => setRoundLabel(event.target.value)} placeholder={`Round ${detail.rounds.length + 1}`} className="admin-control mt-2" />
                    </label>
                    <label className="block">
                      <span className="admin-kicker">Correct</span>
                      <select value={correctOption} onChange={(event) => setCorrectOption(event.target.value as PollOption)} className="admin-control mt-2 w-28">
                        {pollOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="admin-kicker">Timer sec</span>
                      <input value={timerSeconds} onChange={(event) => setTimerSeconds(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Manual" className="admin-control mt-2 w-32" />
                    </label>
                    <button className="admin-button-success h-12 min-w-32" onClick={createRound} disabled={busyAction === "create-round"} type="button">
                      {activeRound ? "Next" : "Start Round"}
                    </button>
                  </div>
                </section>
              )}

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                <RoundPanel
                  round={visibleRound}
                  participantCount={detail.participants.length}
                  busyAction={busyAction}
                  onCloseRound={closeRound}
                  onCorrectRound={correctRound}
                />
                <StudentPreview detail={detail} round={visibleRound} />
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <ParticipantPanel detail={detail} round={activeRound} />
                <LeaderboardPanel scores={detail.scores} />
              </div>

              <section className="admin-panel flex flex-col gap-3 p-5 sm:flex-row sm:justify-between">
                <button className="admin-button-secondary" onClick={archiveSession} disabled={busyAction === "archive-session"} type="button">
                  {detail.session.archivedAt ? "Unarchive" : "Archive"}
                </button>
                {detail.session.status === "open" ? (
                  <button className="admin-button-primary" onClick={closeSession} disabled={busyAction === "close-session"} type="button">
                    Close Session
                  </button>
                ) : (
                  <button className="admin-button-success" onClick={reopenSession} disabled={busyAction === "reopen-session"} type="button">
                    Reopen Session
                  </button>
                )}
              </section>
            </section>
          ) : (
            <section className="admin-panel p-8 text-center">
              <p className="text-base font-extrabold text-stone-700">No Poll Session yet.</p>
              <p className="mt-1 text-sm font-semibold text-stone-400">Create one to show the join code and start the first round.</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function SessionList({ sessions, selectedSessionId }: { sessions: PollSessionList; selectedSessionId: string }) {
  const visibleSessions = sessions.filter((session) => !session.archivedAt || session.id === selectedSessionId);

  return (
    <aside className="admin-panel overflow-hidden xl:sticky xl:top-6">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Sessions</h2>
      </div>
      {visibleSessions.map((session) => (
        <Link
          key={session.id}
          to="/admin/polls"
          search={{ sessionId: session.id }}
          className={`block border-b border-stone-100 p-4 no-underline transition-colors last:border-b-0 ${session.id === selectedSessionId ? "bg-primary-tint" : "bg-white hover:bg-stone-50"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <b className="block truncate text-sm font-black text-stone-800">{session.title}</b>
              <span className="mt-1 block text-xs font-semibold text-stone-400">{session.code} · {session.participantCount} peserta</span>
            </div>
            <StatusPill status={session.status} />
          </div>
        </Link>
      ))}
      {visibleSessions.length === 0 && <p className="p-5 text-sm font-semibold text-stone-400">No sessions yet.</p>}
    </aside>
  );
}

function RoundPanel({
  round,
  participantCount,
  busyAction,
  onCloseRound,
  onCorrectRound,
}: {
  round: PollRound | null;
  participantCount: number;
  busyAction: string;
  onCloseRound: (roundId: string) => void;
  onCorrectRound: (roundId: string, correctOption: PollOption) => void;
}) {
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const isTimerActive = Boolean(round?.timerSeconds);
  const isTimerUrgent = isTimerActive && countdownSeconds !== null && countdownSeconds > 0 && countdownSeconds <= 10;

  useEffect(() => {
    if (!round || round.status !== "open" || !round.timerSeconds) {
      setCountdownSeconds(null);
      return;
    }

    const openedAt = new Date(round.openedAt).getTime();
    const timeoutMs = round.timerSeconds * 1000;

    const update = () => {
      const remaining = Math.max(
        Math.ceil((openedAt + timeoutMs - Date.now()) / 1000),
        0,
      );
      setCountdownSeconds(remaining);
    };

    update();
    const timerId = window.setInterval(update, 1000);

    return () => window.clearInterval(timerId);
  }, [round?.id, round?.status, round?.openedAt, round?.timerSeconds]);

  const timerText = countdownSeconds === null
    ? ""
    : countdownSeconds <= 0
      ? "Timer habis"
      : `Sisa waktu: ${formatCountdown(countdownSeconds)}`;

  if (!round) {
    return (
      <section className="admin-panel p-8 text-center">
        <p className="text-base font-extrabold text-stone-700">No active round.</p>
        <p className="mt-1 text-sm font-semibold text-stone-400">Choose the correct answer and start Round 1.</p>
      </section>
    );
  }

  return (
    <section className="admin-panel overflow-hidden">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">{round.label}</h2>
          <p className="mt-1 text-xs font-semibold text-stone-400">
            {round.totalAnswers}/{participantCount} answered · Correct {round.correctOption}
          </p>
          {isTimerActive && timerText ? (
            <p className={`mt-2 text-[11px] font-black ${isTimerUrgent ? "text-rose-600" : "text-primary"}`}>
              {timerText}
            </p>
          ) : null}
        </div>
        {round.status === "open" ? (
          <button className="admin-button-primary" onClick={() => onCloseRound(round.id)} disabled={busyAction === "close-round"} type="button">
            Reveal
          </button>
        ) : (
          <StatusPill status="closed" />
        )}
      </div>

      <div className="grid gap-3 p-5">
        {pollOptions.map((option) => {
          const count = round.counts[option] ?? 0;
          const percent = round.totalAnswers > 0 ? Math.round((count / round.totalAnswers) * 100) : 0;
          const isCorrect = round.status === "closed" && round.correctOption === option;

          return (
            <div key={option} className={`rounded-[var(--radius-lg)] border-2 border-b-4 p-3 ${isCorrect ? "border-green-200 border-b-green-500 bg-green-50" : "border-stone-100 border-b-stone-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-lg font-black ${isCorrect ? "border-green-200 bg-white text-success" : "border-primary-soft bg-primary-tint text-primary"}`}>
                  {option}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-stone-400">
                    <span>{count} votes</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {round.status === "closed" && (
        <div className="border-t border-stone-100 p-5">
          <span className="admin-kicker">Correct answer correction</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {pollOptions.map((option) => (
              <button
                key={option}
                className={`h-10 w-10 rounded-xl border-2 border-b-4 text-sm font-black ${round.correctOption === option ? "border-primary border-b-primary-dark bg-primary-tint text-primary-dark" : "border-stone-100 border-b-stone-200 bg-white text-stone-500"}`}
                onClick={() => onCorrectRound(round.id, option)}
                disabled={busyAction === `correct-${round.id}` || round.correctOption === option}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StudentPreview({ detail, round }: { detail: PollSessionDetail; round: PollRound | null }) {
  const isClosedRound = round?.status === "closed";

  return (
    <section className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Student preview</div>
      <h2 className="mt-1 text-xl font-black tracking-tight text-stone-800">{detail.session.title}</h2>
      <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-primary-soft bg-primary-tint p-4">
        <div className="text-xs font-black uppercase tracking-wide text-primary-dark">{round ? round.label : "Waiting"}</div>
        <p className="mt-1 text-sm font-semibold text-primary-darker">
          {round ? (round.status === "open" ? "Pilih jawabanmu." : "Round selesai.") : "Menunggu dimulai."}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {pollOptions.map((option) => (
          <div
            key={option}
            className={`flex aspect-square items-center justify-center rounded-[var(--radius-lg)] border-2 border-b-4 text-xl font-black ${isClosedRound && round.correctOption === option ? "border-green-200 border-b-green-500 bg-green-50 text-success" : "border-stone-100 border-b-stone-200 bg-white text-primary"}`}
          >
            {option}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-800">
        Participants can see who answered, but not peer choices while the round is open.
      </div>
    </section>
  );
}

function ParticipantPanel({ detail, round }: { detail: PollSessionDetail; round: PollRound | null }) {
  const answeredIds = new Set(round?.answers.map((answer) => answer.participantId) ?? []);
  const answeredCount = answeredIds.size;

  return (
    <section className="admin-panel overflow-hidden">
      <div className="admin-panel-header flex items-center justify-between">
        <div>
          <h2 className="admin-panel-title">Participants</h2>
          <p className="mt-1 text-xs font-semibold text-stone-400">{answeredCount}/{detail.participants.length} answered</p>
        </div>
        <div className="flex h-7 items-center rounded-full border-2 border-green-100 bg-green-50 px-2.5 text-[10px] font-black text-success">
          {answeredCount}/{detail.participants.length}
        </div>
      </div>
      <div className="max-h-[280px] overflow-y-auto p-3">
        {detail.participants.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {detail.participants.map((participant) => {
              const answered = answeredIds.has(participant.id);

              return (
                <div
                  key={participant.id}
                  className={`inline-flex max-w-[200px] items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                    answered
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-stone-200 bg-stone-50 text-stone-500"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${answered ? "bg-success" : "bg-stone-300"}`} />
                  <span className="min-w-0 flex-1 truncate">{participant.displayName}</span>
                  <span className="shrink-0 text-[9px] font-black uppercase opacity-50">
                    {participant.studentUserId ? "S" : "G"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-2 text-sm font-semibold text-stone-400">Waiting for participants to join.</p>
        )}
      </div>
    </section>
  );
}
function LeaderboardPanel({ scores }: { scores: PollSessionDetail["scores"] }) {
  return (
    <section className="admin-panel overflow-hidden">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Session leaderboard</h2>
      </div>
      {scores.map((score) => (
        <div key={score.participantId} className="flex items-center gap-3 border-b border-stone-100 p-4 last:border-b-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-sm font-black text-amber-700">
            #{score.rank}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-sm font-black text-stone-800">{score.displayName}</b>
            <span className="text-xs font-semibold text-stone-400">{score.correctAnswers} correct · {score.answeredRounds} answered</span>
          </div>
          <span className="text-lg font-black text-primary">{score.totalPoints}</span>
        </div>
      ))}
      {scores.length === 0 && <p className="p-5 text-sm font-semibold text-stone-400">Scores appear after participants answer.</p>}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const className = status === "open"
    ? "border-green-100 bg-green-50 text-success"
    : "border-stone-100 bg-stone-50 text-stone-500";

  return (
    <span className={`shrink-0 rounded-full border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${className}`}>
      {status}
    </span>
  );
}

function defaultSessionTitle() {
  return `Kelas ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date())}`;
}

function getStudentPollUrl(code: string) {
  if (typeof window === "undefined") {
    return `/poll/${code}`;
  }

  return `${window.location.origin}/poll/${code}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCountdown(totalSeconds: number) {
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

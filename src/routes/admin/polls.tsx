import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { z } from "zod";
import {
  archivePollSessionAdmin,
  closePollRoundAdmin,
  closePollSessionAdmin,
  correctPollRoundAdmin,
  createPollRoundAdmin,
  createPollSessionAdmin,
  getPollSessionAdmin,
  importPollRoundPlanAdmin,
  listPollSessionsAdmin,
  reopenPollSessionAdmin,
  skipPollRoundPlanItemAdmin,
} from "../../lib/poll-functions";
import { subscribeToPollUpdates } from "../../lib/poll-live";
import { getSafeErrorMessage } from "../../lib/user-errors";

const pollOptions = ["A", "B", "C", "D", "E"] as const;
const searchSchema = z.object({
  sessionId: z.string().optional(),
});

type PollOption = (typeof pollOptions)[number];
type PollSessionList = Awaited<ReturnType<typeof listPollSessionsAdmin>>;
type PollSessionDetail = Awaited<ReturnType<typeof getPollSessionAdmin>>;
type PollRound = PollSessionDetail["rounds"][number];
type PollPlanItem = PollSessionDetail["planItems"][number];

type PollPlanWorkbookRow = {
  label?: string;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_option?: string;
  timer_seconds?: string | number;
};

const pollPlanSheetHeaders = [
  "label",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_option",
  "timer_seconds",
] as const;

export const Route = createFileRoute("/admin/polls")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ sessionId: search.sessionId }),
  loader: async ({ deps }) => {
    const sessions = await listPollSessionsAdmin();
    const fallbackSessionId = sessions.find((session) => session.status === "open")?.id || sessions[0]?.id || "";
    const requestedSessionExists = Boolean(deps.sessionId && sessions.some((session) => session.id === deps.sessionId));
    const selectedSessionId = requestedSessionExists ? deps.sessionId || "" : fallbackSessionId;
    const detail = selectedSessionId
      ? await getPollSessionAdmin({ data: { sessionId: selectedSessionId } })
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
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [optionE, setOptionE] = useState("");
  const [selectedPlanItemId, setSelectedPlanItemId] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedSessionId, setCopiedSessionId] = useState("");
  const activeRound = detail?.rounds.find((round) => round.status === "open") ?? null;
  const latestRound = detail?.rounds.at(-1) ?? null;
  const visibleRound = activeRound ?? latestRound ?? null;
  const selectedSessionId = detail?.session.id ?? "";
  const selectedSessionStatus = detail?.session.status ?? "";
  const selectedPlanItem = detail?.planItems.find((item) => item.id === selectedPlanItemId) ?? null;

  useEffect(() => {
    if (!selectedSessionId || selectedSessionStatus !== "open") return;

    const unsubscribe = subscribeToPollUpdates({
      sessionId: selectedSessionId,
      onUpdate: () => {
        router.invalidate();
      },
    });
    const fallbackId = window.setInterval(() => {
      router.invalidate();
    }, 60_000);

    return () => {
      unsubscribe();
      window.clearInterval(fallbackId);
    };
  }, [selectedSessionId, selectedSessionStatus, router]);

  useEffect(() => {
    if (!activeRound?.timerSeconds) return;

    const openedAt = new Date(activeRound.openedAt).getTime();
    const expiresAt = openedAt + activeRound.timerSeconds * 1000;
    const delayMs = Math.max(expiresAt - Date.now(), 0);
    const timeoutId = window.setTimeout(() => {
      router.invalidate();
    }, delayMs + 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeRound?.id, activeRound?.openedAt, activeRound?.timerSeconds, router]);

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
          planItemId: selectedPlanItemId || undefined,
          label: roundLabel,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          optionE,
          correctOption,
          timerSeconds: timerSeconds ? Number(timerSeconds) : null,
        },
      });
      setRoundLabel("");
      setTimerSeconds("");
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setOptionE("");
      setSelectedPlanItemId("");
    });
  };

  const loadPlanItem = (item: PollPlanItem) => {
    setSelectedPlanItemId(item.id);
    setRoundLabel(item.label ?? "");
    setQuestionText(item.questionText);
    setOptionA(item.optionA);
    setOptionB(item.optionB);
    setOptionC(item.optionC);
    setOptionD(item.optionD);
    setOptionE(item.optionE ?? "");
    setCorrectOption(item.correctOption);
    setTimerSeconds(item.timerSeconds ? String(item.timerSeconds) : "");
  };

  const clearRoundForm = () => {
    setSelectedPlanItemId("");
    setRoundLabel("");
    setTimerSeconds("");
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setOptionE("");
    setCorrectOption("A");
  };

  const downloadPlanTemplate = async () => {
    await runAction("download-plan-template", async () => {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        makeSheet(XLSX, pollPlanSheetHeaders, makeSamplePlanRows()),
        "rounds",
      );
      saveWorkbook(XLSX, workbook, `ilmorax-poll-plan-template-${formatTimestamp(new Date())}.xlsx`);
    });
  };

  const importPlanWorkbook = async (file: File) => {
    if (!detail) return;

    await runAction("import-plan", async () => {
      const items = await readPollPlanWorkbook(file);
      await importPollRoundPlanAdmin({
        data: {
          sessionId: detail.session.id,
          items,
        },
      });
      clearRoundForm();
    });
  };

  const skipPlanItem = async (item: PollPlanItem) => {
    await runAction(`skip-plan:${item.id}`, async () => {
      await skipPollRoundPlanItemAdmin({ data: { planItemId: item.id } });

      if (selectedPlanItemId === item.id) {
        clearRoundForm();
      }
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

              <PollPlanPanel
                detail={detail}
                busyAction={busyAction}
                selectedPlanItemId={selectedPlanItemId}
                onDownloadTemplate={downloadPlanTemplate}
                onImportWorkbook={importPlanWorkbook}
                onLoadPlanItem={loadPlanItem}
                onSkipPlanItem={skipPlanItem}
              />

              {detail.session.status === "open" && (
                <section className="admin-panel p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="admin-panel-title">Start next round</h2>
                      <p className="mt-1 text-xs font-semibold text-stone-400">
                        {selectedPlanItem ? `Loaded planned row ${selectedPlanItem.sortOrder}. Review before opening.` : "Use a planned row or type a manual classroom prompt."}
                      </p>
                    </div>
                    <button className="admin-button-ghost" onClick={clearRoundForm} type="button">
                      Clear
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_140px] lg:items-end">
                      <label className="block">
                        <span className="admin-kicker">Round label</span>
                        <input value={roundLabel} onChange={(event) => setRoundLabel(event.target.value)} placeholder={`Round ${detail.rounds.length + 1}`} className="admin-control mt-2" />
                      </label>
                      <label className="block">
                        <span className="admin-kicker">Correct</span>
                        <select value={correctOption} onChange={(event) => setCorrectOption(event.target.value as PollOption)} className="admin-control mt-2">
                          {pollOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="admin-kicker">Timer sec</span>
                        <input value={timerSeconds} onChange={(event) => setTimerSeconds(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Manual" className="admin-control mt-2" />
                      </label>
                    </div>

                    <label className="block">
                      <span className="admin-kicker">Teacher question</span>
                      <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Optional. Shown only on the teacher presentation view." className="admin-control mt-2 min-h-24" />
                    </label>

                    <div className="grid gap-3 md:grid-cols-2">
                      <OptionInput label="A" value={optionA} onChange={setOptionA} />
                      <OptionInput label="B" value={optionB} onChange={setOptionB} />
                      <OptionInput label="C" value={optionC} onChange={setOptionC} />
                      <OptionInput label="D" value={optionD} onChange={setOptionD} />
                      <OptionInput label="E" value={optionE} onChange={setOptionE} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button className="admin-button-success h-12 min-w-36" onClick={createRound} disabled={busyAction === "create-round"} type="button">
                        {activeRound ? "Close current & start" : "Start Round"}
                      </button>
                      <a
                        href={`/admin/polls/presentation?sessionId=${encodeURIComponent(detail.session.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-button-secondary no-underline"
                      >
                        Presentation view
                      </a>
                    </div>
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
                {detail.session.status !== "open" || detail.session.archivedAt ? (
                  <button className="admin-button-secondary" onClick={archiveSession} disabled={busyAction === "archive-session"} type="button">
                    {detail.session.archivedAt ? "Unarchive" : "Archive"}
                  </button>
                ) : (
                  <span />
                )}
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

function PollPlanPanel({
  detail,
  busyAction,
  selectedPlanItemId,
  onDownloadTemplate,
  onImportWorkbook,
  onLoadPlanItem,
  onSkipPlanItem,
}: {
  detail: PollSessionDetail;
  busyAction: string;
  selectedPlanItemId: string;
  onDownloadTemplate: () => void;
  onImportWorkbook: (file: File) => Promise<void> | void;
  onLoadPlanItem: (item: PollPlanItem) => void;
  onSkipPlanItem: (item: PollPlanItem) => void;
}) {
  const plannedItems = detail.planItems.filter((item) => item.status === "planned");
  const startedCount = detail.planItems.filter((item) => item.status === "started").length;
  const skippedCount = detail.planItems.filter((item) => item.status === "skipped").length;
  const canReplacePlan = detail.session.status === "open" && !detail.session.archivedAt;

  return (
    <section className="admin-panel overflow-hidden">
      <div className="admin-panel-header flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="admin-panel-title">Poll Round Plan</h2>
          <p className="mt-1 text-xs font-semibold text-stone-400">
            {plannedItems.length} queued · {startedCount} started · {skippedCount} skipped
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="admin-button-secondary" onClick={onDownloadTemplate} disabled={busyAction === "download-plan-template"} type="button">
            Download template
          </button>
          <FileUpload
            accept=".xlsx"
            busy={busyAction === "import-plan" || !canReplacePlan}
            placeholder="Upload plan"
            onFileSelect={onImportWorkbook}
          />
        </div>
      </div>

      {plannedItems.length === 0 ? (
        <div className="p-6 text-sm font-semibold text-stone-400">
          No queued rows. Upload an XLSX plan or start rounds manually.
        </div>
      ) : (
        <div className="grid gap-3 p-4">
          {plannedItems.map((item) => (
            <div key={item.id} className={`rounded-[var(--radius-lg)] border-2 p-4 ${selectedPlanItemId === item.id ? "border-primary bg-primary-tint" : "border-stone-100 bg-white"}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                    Row {item.sortOrder} · Correct {item.correctOption}{item.timerSeconds ? ` · ${item.timerSeconds}s` : ""}
                  </div>
                  <h3 className="mt-1 text-sm font-black leading-snug text-stone-800">
                    {item.label || `Round ${item.sortOrder}`}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-stone-500">
                    {item.questionText}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="admin-button-secondary" onClick={() => onLoadPlanItem(item)} type="button">
                    Load
                  </button>
                  <button className="admin-button-ghost text-amber-700 hover:bg-amber-50" onClick={() => onSkipPlanItem(item)} disabled={busyAction === `skip-plan:${item.id}`} type="button">
                    Skip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OptionInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="admin-kicker">Option {label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Option ${label}`} className="admin-control mt-2" />
    </label>
  );
}

function FileUpload({
  accept,
  busy,
  placeholder,
  onFileSelect,
}: {
  accept: string;
  busy: boolean;
  placeholder: string;
  onFileSelect: (file: File) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isUnavailable = busy || isUploading;

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    if (isUnavailable) return;
    if (!isAcceptedFile(file, accept)) return;

    setFileName(file.name);

    try {
      setIsUploading(true);
      await onFileSelect(file);
    } finally {
      setIsUploading(false);
      setFileName("");
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.value = "";
    void selectFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = isUnavailable ? "none" : "copy";

    if (isUnavailable) return;

    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUnavailable) return;

    void selectFile(event.dataTransfer.files?.[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={isUnavailable ? -1 : 0}
      aria-disabled={isUnavailable}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`admin-file-upload ${isUnavailable ? "pointer-events-none opacity-50" : ""} ${fileName ? "admin-file-upload-active" : ""} ${isDragging ? "border-primary bg-primary-tint text-primary-dark" : ""}`}
    >
      <UploadIcon className="h-4 w-4 shrink-0" />
      <span className="truncate">{isDragging ? "Drop .xlsx here" : isUploading ? "Importing..." : fileName || placeholder}</span>
      <input ref={inputRef} onChange={handleChange} disabled={isUnavailable} className="sr-only" type="file" accept={accept} />
    </div>
  );
}

function isAcceptedFile(file: File, accept: string) {
  if (accept !== ".xlsx") return true;

  return file.name.toLowerCase().endsWith(".xlsx");
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

  const hasTeacherContent = Boolean(round.questionText);

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

      {hasTeacherContent && (
        <div className="border-b border-stone-100 p-5">
          <p className="text-base font-black leading-relaxed text-stone-800">{round.questionText}</p>
          <div className="mt-4 grid gap-2">
            {pollOptions.map((option) => {
              const optionText = getRoundOptionText(round, option);
              if (!optionText) return null;

              return (
                <div key={option} className="flex gap-3 rounded-[var(--radius-md)] border border-stone-100 bg-stone-50 p-3 text-sm font-semibold text-stone-600">
                  <span className="font-black text-primary">{option}</span>
                  <span>{optionText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function getRoundOptionText(round: PollRound, option: PollOption) {
  if (option === "A") return round.optionA;
  if (option === "B") return round.optionB;
  if (option === "C") return round.optionC;
  if (option === "D") return round.optionD;
  return round.optionE;
}

function makeSamplePlanRows() {
  return [
    {
      label: "Review Farmakologi 1",
      question_text: "Obat antihipertensi yang bekerja menghambat ACE adalah...",
      option_a: "Captopril",
      option_b: "Amlodipine",
      option_c: "Furosemide",
      option_d: "Propranolol",
      option_e: "",
      correct_option: "A",
      timer_seconds: 60,
    },
    {
      label: "Review Farmakologi 2",
      question_text: "Efek samping khas aminoglikosida yang perlu dimonitor adalah...",
      option_a: "Hipoglikemia",
      option_b: "Ototoksisitas",
      option_c: "Batuk kering",
      option_d: "Hiperpigmentasi",
      option_e: "",
      correct_option: "B",
      timer_seconds: "",
    },
  ];
}

function makeSheet(
  XLSX: typeof import("xlsx"),
  headers: readonly string[],
  rows: Record<string, string | number | null | undefined>[],
) {
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(headers)]);

  if (rows.length === 0) return sheet;

  XLSX.utils.sheet_add_json(sheet, rows, {
    header: Array.from(headers),
    skipHeader: true,
    origin: "A2",
  });

  return sheet;
}

function saveWorkbook(XLSX: typeof import("xlsx"), workbook: import("xlsx").WorkBook, fileName: string) {
  const workbookBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function readPollPlanWorkbook(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets.rounds ?? workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error("Workbook must include a rounds sheet.");
  }

  const rows = XLSX.utils.sheet_to_json<PollPlanWorkbookRow>(sheet, { defval: "" });

  if (rows.length === 0) {
    throw new Error("The rounds sheet must include at least one row.");
  }

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const item = {
      label: optionalTextValue(row.label),
      questionText: textValue(row.question_text),
      optionA: textValue(row.option_a),
      optionB: textValue(row.option_b),
      optionC: textValue(row.option_c),
      optionD: textValue(row.option_d),
      optionE: optionalTextValue(row.option_e),
      correctOption: normalizePollOption(row.correct_option, rowNumber),
      timerSeconds: optionalNumberValue(row.timer_seconds, rowNumber),
    };

    if (!item.questionText) throw new Error(`Row ${rowNumber}: question_text is required.`);
    if (!item.optionA) throw new Error(`Row ${rowNumber}: option_a is required.`);
    if (!item.optionB) throw new Error(`Row ${rowNumber}: option_b is required.`);
    if (!item.optionC) throw new Error(`Row ${rowNumber}: option_c is required.`);
    if (!item.optionD) throw new Error(`Row ${rowNumber}: option_d is required.`);
    if (item.correctOption === "E" && !item.optionE) throw new Error(`Row ${rowNumber}: option_e is required when correct_option is E.`);

    return item;
  });
}

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function optionalTextValue(value: unknown) {
  const text = textValue(value);
  if (!text) return undefined;
  return text;
}

function optionalNumberValue(value: unknown, rowNumber: number) {
  const text = textValue(value);
  if (!text) return null;

  const number = Number(text);
  if (!Number.isInteger(number) || number < 5 || number > 600) {
    throw new Error(`Row ${rowNumber}: timer_seconds must be blank or an integer from 5 to 600.`);
  }

  return number;
}

function normalizePollOption(value: unknown, rowNumber: number): PollOption {
  const option = textValue(value).toUpperCase();

  if (option === "A" || option === "B" || option === "C" || option === "D" || option === "E") {
    return option;
  }

  throw new Error(`Row ${rowNumber}: correct_option must be A, B, C, D, or E.`);
}

function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}

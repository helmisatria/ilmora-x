import { Link, useNavigate, useRouter } from "@tanstack/react-router";
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
} from "./poll-admin-functions";
import {
  formatPollDateTime,
  formatPollPlanTimestamp,
  getPollRoundOptionText,
  getStudentPollUrl,
  makeDefaultPollSessionTitle,
  makePollPlanSheet,
  makeSamplePollPlanRows,
  pollPlanSheetHeaders,
  readPollPlanWorkbook,
  savePollPlanWorkbook,
} from "./admin-poll-workbook";
import { subscribeToPollUpdates } from "./poll-live-client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { getSafeErrorMessage } from "../../lib/user-errors";
import "./poll-cockpit.css";

const pollOptions = ["A", "B", "C", "D", "E"] as const;
const TIMER_MIN_SECONDS = 5;
const TIMER_MAX_SECONDS = 600;

export const adminPollsSearchSchema = z.object({
  sessionId: z.string().optional(),
});

type PollOption = (typeof pollOptions)[number];
type PollSessionList = Awaited<ReturnType<typeof listPollSessionsAdmin>>;
type PollSessionSummary = PollSessionList[number];
type PollSessionDetail = Awaited<ReturnType<typeof getPollSessionAdmin>>;
type PollRound = PollSessionDetail["rounds"][number];
type PollPlanItem = PollSessionDetail["planItems"][number];

export type AdminPollsPageData = {
  sessions: PollSessionList;
  detail: PollSessionDetail | null;
};

type StageMode = "voting" | "revealed" | "composing" | "closed" | "empty";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export function AdminPollsPage({ sessions, detail }: AdminPollsPageData) {
  const router = useRouter();
  const navigate = useNavigate();
  const [title, setTitle] = useState(makeDefaultPollSessionTitle());
  const [creatingSession, setCreatingSession] = useState(false);
  const [composingRound, setComposingRound] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
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
  const [copied, setCopied] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const activeRound = detail?.rounds.find((round) => round.status === "open") ?? null;
  const latestRound = detail?.rounds.at(-1) ?? null;
  const visibleRound = activeRound ?? latestRound ?? null;
  const selectedSessionId = detail?.session.id ?? "";
  const selectedPlanItem = detail?.planItems.find((item) => item.id === selectedPlanItemId) ?? null;
  const plannedItems = detail?.planItems.filter((item) => item.status === "planned") ?? [];
  const startedPlanCount = detail?.planItems.filter((item) => item.status === "started").length ?? 0;
  const skippedPlanCount = detail?.planItems.filter((item) => item.status === "skipped").length ?? 0;
  const joinedCount = detail?.participants.length ?? 0;
  const visibleSessions = sessions.filter((session) => !session.archivedAt || session.id === selectedSessionId);

  const stageMode: StageMode = !detail
    ? "empty"
    : detail.session.status !== "open"
      ? "closed"
      : activeRound
        ? "voting"
        : composingRound
          ? "composing"
          : latestRound
            ? "revealed"
            : "composing";

  const rosterRound = stageMode === "composing" ? null : visibleRound;
  const answeredCount = rosterRound?.totalAnswers ?? 0;
  const correctCount = visibleRound?.answers.filter((answer) => answer.isCorrect).length ?? 0;
  const pendingParticipants = detail?.participants.filter(
    (participant) => !(rosterRound?.answers.some((answer) => answer.participantId === participant.id) ?? false),
  ) ?? [];

  const timerValue = timerSeconds === "" ? null : Number(timerSeconds);
  const timerInvalid = timerValue !== null && (timerValue < TIMER_MIN_SECONDS || timerValue > TIMER_MAX_SECONDS);
  const optionValues = [optionA, optionB, optionC, optionD, optionE];
  const hasAnyContent = [questionText, ...optionValues].some((value) => value.trim().length > 0);
  const hasRequiredContent = Boolean(
    questionText.trim()
    && optionA.trim()
    && optionB.trim()
    && optionC.trim()
    && optionD.trim()
    && (correctOption !== "E" || optionE.trim()),
  );
  const canStartWithContent = hasRequiredContent && !timerInvalid;
  const canStartWithoutContent = !hasAnyContent && !timerInvalid;

  useEffect(() => {
    setComposingRound(false);
    setSelectedPlanItemId("");
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId || detail?.session.status !== "open") return;

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
  }, [selectedSessionId, detail?.session.status, router]);

  useEffect(() => {
    if (!activeRound?.timerSeconds) {
      setCountdownSeconds(null);
      return;
    }

    const openedAt = new Date(activeRound.openedAt).getTime();
    const totalMs = activeRound.timerSeconds * 1000;
    const update = () => {
      setCountdownSeconds(Math.max(Math.ceil((openedAt + totalMs - Date.now()) / 1000), 0));
    };

    update();
    const intervalId = window.setInterval(update, 1000);
    const timeoutId = window.setTimeout(() => {
      router.invalidate();
    }, Math.max(openedAt + totalMs - Date.now(), 0) + 250);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
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
      setTitle(makeDefaultPollSessionTitle());
      setCreatingSession(false);
      await navigate({ to: "/admin/polls", search: { sessionId: nextDetail.session.id } });
    });
  };

  const createRound = async ({ withContent }: { withContent: boolean }) => {
    if (!detail) return;

    await runAction("create-round", async () => {
      const data = withContent
        ? {
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
            timerSeconds: timerValue,
          }
        : {
            sessionId: detail.session.id,
            label: roundLabel,
            correctOption,
            timerSeconds: timerValue,
          };

      await createPollRoundAdmin({ data });
      clearRoundForm();
      setComposingRound(false);
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
    setComposingRound(true);
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
        makePollPlanSheet(XLSX, pollPlanSheetHeaders, makeSamplePollPlanRows()),
        "rounds",
      );
      savePollPlanWorkbook(XLSX, workbook, `ilmorax-poll-plan-template-${formatPollPlanTimestamp(new Date())}.xlsx`);
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

  const requestCloseRound = () => {
    if (!activeRound) return;

    if (activeRound.totalAnswers === 0) {
      setConfirm({
        title: "Tutup round tanpa jawaban?",
        description: "Belum ada peserta yang menjawab round ini. Setelah ditutup, jawaban tidak bisa masuk lagi.",
        confirmLabel: "Tutup round",
        onConfirm: () => {
          setConfirm(null);
          void closeRound(activeRound.id);
        },
      });
      return;
    }

    void closeRound(activeRound.id);
  };

  const correctRound = async (roundId: string, nextCorrectOption: PollOption) => {
    await runAction(`correct-${roundId}`, () => correctPollRoundAdmin({ data: { roundId, correctOption: nextCorrectOption } }));
  };

  const closeSession = async () => {
    if (!detail) return;

    await runAction("close-session", () => closePollSessionAdmin({ data: { sessionId: detail.session.id } }));
  };

  const requestCloseSession = () => {
    if (!detail) return;

    setConfirm({
      title: "Akhiri sesi ini?",
      description: activeRound
        ? "Round yang sedang berjalan akan ditutup dan tidak ada jawaban baru yang masuk. Sesi bisa dibuka lagi nanti."
        : "Peserta tidak bisa menjawab lagi setelah sesi ditutup. Sesi bisa dibuka lagi nanti.",
      confirmLabel: "Akhiri sesi",
      onConfirm: () => {
        setConfirm(null);
        void closeSession();
      },
    });
  };

  const reopenSession = async () => {
    if (!detail) return;

    await runAction("reopen-session", () => reopenPollSessionAdmin({ data: { sessionId: detail.session.id } }));
  };

  const archiveSession = async () => {
    if (!detail) return;

    await runAction("archive-session", async () => {
      await archivePollSessionAdmin({
        data: {
          sessionId: detail.session.id,
          archived: detail.session.archivedAt === null,
        },
      });
    });
  };

  const copyStudentUrl = async () => {
    if (!detail) return;
    if (typeof window === "undefined") return;

    const studentUrl = getStudentPollUrl(detail.session.code);

    try {
      await window.navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMessage("Kode Poll tidak tersalin. Salin manual dari tautan di bawah kode.");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane poll-lane">
        <AdminPageHeader
          title="Poll Sessions"
          description="Jalankan round live, bagikan Kode Poll, dan buka jawaban saat kelas siap."
        />

        {errorMessage && <p className="admin-alert mt-4">{errorMessage}</p>}

        <div className="poll-cockpit mt-4">
          <aside className="poll-rail">
            <div className="poll-rail-head">
              <h2>Sesi Poll</h2>
              <span>{visibleSessions.length}</span>
            </div>

            <div className="poll-rail-list">
              {visibleSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === selectedSessionId}
                />
              ))}
              {visibleSessions.length === 0 && (
                <p className="poll-roster-empty">Belum ada sesi. Buat sesi pertama di bawah.</p>
              )}
            </div>

            <div className="poll-rail-foot">
              {creatingSession ? (
                <div className="poll-new-form">
                  <input
                    aria-label="Judul sesi baru"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void createSession();
                      if (event.key === "Escape") setCreatingSession(false);
                    }}
                    autoFocus
                  />
                  <div className="poll-new-actions">
                    <button
                      className="poll-btn-dark"
                      onClick={createSession}
                      disabled={busyAction === "create-session" || title.trim().length === 0}
                      type="button"
                    >
                      {busyAction === "create-session" ? "Membuat..." : "Buat sesi"}
                    </button>
                    <button className="poll-btn-plain" onClick={() => setCreatingSession(false)} type="button">
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button className="poll-new" onClick={() => setCreatingSession(true)} type="button">
                  + Sesi baru
                </button>
              )}

              {detail && (
                <details className="poll-setup">
                  <summary>Persiapan sesi</summary>
                  <div className="poll-setup-body">
                    <div className="poll-setup-row">
                      <button
                        className="poll-btn-plain"
                        onClick={downloadPlanTemplate}
                        disabled={busyAction === "download-plan-template"}
                        type="button"
                      >
                        Unduh template
                      </button>
                      <FileUpload
                        accept=".xlsx"
                        busy={busyAction === "import-plan" || detail.session.status !== "open"}
                        placeholder="Unggah rencana"
                        onFileSelect={importPlanWorkbook}
                      />
                    </div>

                    <p className="poll-plan-note">
                      {plannedItems.length} antre · {startedPlanCount} dimulai · {skippedPlanCount} dilewati
                    </p>

                    {plannedItems.length > 0 && (
                      <div className="poll-plan-list">
                        {plannedItems.map((item) => (
                          <div className="poll-plan-item" key={item.id}>
                            <span>
                              Baris {item.sortOrder} · {item.correctOption}
                              {item.timerSeconds ? ` · ${item.timerSeconds}s` : ""}
                            </span>
                            <p>{item.label || item.questionText}</p>
                            <div>
                              <button onClick={() => loadPlanItem(item)} type="button">
                                Muat
                              </button>
                              <button
                                onClick={() => skipPlanItem(item)}
                                disabled={busyAction === `skip-plan:${item.id}`}
                                type="button"
                              >
                                Lewati
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </aside>

          {detail ? (
            <section className="poll-stage">
              <StageHeader
                code={detail.session.code}
                joined={joinedCount}
                answered={stageMode === "composing" ? 0 : answeredCount}
                mode={stageMode}
                countdownSeconds={countdownSeconds}
                timerSeconds={activeRound?.timerSeconds ?? null}
                correctCount={correctCount}
                copied={copied}
                onCopy={copyStudentUrl}
              />

              {(stageMode === "voting" || stageMode === "revealed") && visibleRound && (
                <>
                  <div className="poll-round-head">
                    <span className="poll-round-tag">{visibleRound.label}</span>
                    <span className="poll-round-sub">
                      {stageMode === "revealed"
                        ? `Jawaban benar ${visibleRound.correctOption}`
                        : "Pertanyaan pembimbing"}
                    </span>
                  </div>

                  {visibleRound.questionText ? (
                    <h1 className="poll-question">{visibleRound.questionText}</h1>
                  ) : (
                    <h1 className="poll-question is-empty">
                      Tanpa pertanyaan tertulis. Peserta menjawab dari soal yang dibacakan.
                    </h1>
                  )}

                  <RoundLadder round={visibleRound} revealed={stageMode === "revealed"} />

                  <div className="poll-stage-foot">
                    <p className="poll-stage-note">
                      <i />
                      {stageMode === "revealed"
                        ? "Papan skor sudah diperbarui dengan jawaban round ini"
                        : joinedCount === 0
                          ? "Belum ada peserta bergabung. Bagikan Kode Poll ke kelas."
                          : pendingParticipants.length > 0
                            ? `Menunggu ${pendingParticipants.slice(0, 3).map((participant) => participant.displayName).join(", ")}${pendingParticipants.length > 3 ? `, +${pendingParticipants.length - 3} lagi` : ""}`
                            : "Semua peserta sudah menjawab"}
                    </p>
                    <div className="poll-stage-actions">
                      {stageMode === "voting" ? (
                        <button
                          className="poll-btn-primary"
                          onClick={requestCloseRound}
                          disabled={busyAction === "close-round"}
                          type="button"
                        >
                          {busyAction === "close-round" ? "Menutup..." : "Tutup & buka jawaban"}
                        </button>
                      ) : (
                        <button
                          className="poll-btn-primary"
                          onClick={() => setComposingRound(true)}
                          type="button"
                        >
                          Round berikutnya
                        </button>
                      )}
                      <a
                        className="poll-btn-ghost"
                        href={`/admin/polls/presentation?sessionId=${encodeURIComponent(detail.session.id)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Layar kelas
                      </a>
                      <button className="poll-btn-quiet" onClick={requestCloseSession} type="button">
                        Akhiri sesi
                      </button>
                    </div>
                  </div>
                </>
              )}

              {stageMode === "composing" && (
                <>
                  <div className="poll-round-head">
                    <span className="poll-round-tag">Round {detail.rounds.length + 1}</span>
                    <span className="poll-round-sub">
                      {selectedPlanItem ? `Rencana baris ${selectedPlanItem.sortOrder}` : "Siap mulai"}
                    </span>
                  </div>

                  <div className="poll-composer">
                    <p className="poll-composer-hint">
                      {plannedItems.length > 0
                        ? `${plannedItems.length} rencana round siap dipakai, atau tulis pertanyaan baru.`
                        : "Tulis pertanyaan di bawah, atau mulai round tanpa pertanyaan tertulis."}
                    </p>

                    {plannedItems.length > 0 && (
                      <label className="poll-field">
                        <span>Rencana round</span>
                        <select
                          className="poll-select"
                          value={selectedPlanItemId}
                          onChange={(event) => {
                            const item = plannedItems.find((candidate) => candidate.id === event.target.value);
                            if (item) {
                              loadPlanItem(item);
                              return;
                            }
                            clearRoundForm();
                          }}
                        >
                          <option value="">Tulis manual</option>
                          {plannedItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              Baris {item.sortOrder} · {(item.label || item.questionText).slice(0, 60)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="poll-composer-grid">
                      <label className="poll-field">
                        <span>Label round</span>
                        <input
                          className="poll-input"
                          value={roundLabel}
                          onChange={(event) => setRoundLabel(event.target.value)}
                          placeholder={`Round ${detail.rounds.length + 1}`}
                        />
                      </label>
                      <label className="poll-field">
                        <span>Jawaban benar</span>
                        <select
                          className="poll-select"
                          value={correctOption}
                          onChange={(event) => setCorrectOption(event.target.value as PollOption)}
                        >
                          {pollOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label className="poll-field">
                        <span>Timer (detik)</span>
                        <input
                          className="poll-input"
                          value={timerSeconds}
                          onChange={(event) => setTimerSeconds(event.target.value.replace(/\D/g, "").slice(0, 3))}
                          placeholder="Tanpa timer"
                          inputMode="numeric"
                        />
                        {timerInvalid && (
                          <span className="poll-field-error">{TIMER_MIN_SECONDS}–{TIMER_MAX_SECONDS} detik, atau kosongkan.</span>
                        )}
                      </label>
                    </div>

                    <label className="poll-field">
                      <span>Pertanyaan</span>
                      <textarea
                        className="poll-textarea"
                        value={questionText}
                        onChange={(event) => setQuestionText(event.target.value)}
                        placeholder="Contoh: Siapa presiden pertama Republik Indonesia?"
                      />
                    </label>

                    <div className="poll-composer-options">
                      {([
                        ["A", optionA, setOptionA],
                        ["B", optionB, setOptionB],
                        ["C", optionC, setOptionC],
                        ["D", optionD, setOptionD],
                        ["E", optionE, setOptionE],
                      ] as const).map(([letter, value, setValue]) => (
                        <label className={`poll-field ${letter === "E" ? "poll-field-wide" : ""}`} key={letter}>
                          <span>
                            Pilihan {letter}
                            {letter === "E" ? " (opsional)" : ""}
                          </span>
                          <input
                            className="poll-input"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder={letter === "E" ? "Boleh kosong" : `Teks pilihan ${letter}`}
                          />
                        </label>
                      ))}
                    </div>

                    <div className="poll-composer-actions">
                      <button
                        className="poll-btn-primary"
                        onClick={() => createRound({ withContent: true })}
                        disabled={!canStartWithContent || busyAction === "create-round"}
                        type="button"
                      >
                        {busyAction === "create-round" ? "Memulai..." : `Mulai Round ${detail.rounds.length + 1}`}
                      </button>
                      {(canStartWithoutContent || !hasAnyContent) && (
                        <button
                          className="poll-btn-ghost"
                          onClick={() => createRound({ withContent: false })}
                          disabled={!canStartWithoutContent || busyAction === "create-round"}
                          type="button"
                        >
                          Mulai tanpa pertanyaan
                        </button>
                      )}
                      {hasAnyContent && (
                        <button className="poll-btn-ghost" onClick={clearRoundForm} type="button">
                          Kosongkan
                        </button>
                      )}
                      {latestRound && (
                        <button className="poll-btn-quiet" onClick={() => setComposingRound(false)} type="button">
                          Batal
                        </button>
                      )}
                    </div>

                    <p className="poll-composer-hint">
                      Pertanyaan dan pilihan A–D wajib diisi untuk menampilkan soal. Pilihan E opsional.
                    </p>
                  </div>
                </>
              )}

              {stageMode === "closed" && (
                <>
                  <div className="poll-round-head">
                    <span className="poll-round-tag">Sesi ditutup</span>
                    <span className="poll-round-sub">
                      {visibleRound ? `Round terakhir ${visibleRound.label}` : "Belum ada round"}
                    </span>
                  </div>

                  {visibleRound ? (
                    <>
                      {visibleRound.questionText ? (
                        <h1 className="poll-question">{visibleRound.questionText}</h1>
                      ) : (
                        <h1 className="poll-question is-empty">Round tanpa pertanyaan tertulis.</h1>
                      )}
                      <RoundLadder round={visibleRound} revealed />
                    </>
                  ) : (
                    <p className="poll-composer-hint">Sesi ini belum punya round. Buka sesi untuk memulai.</p>
                  )}

                  <div className="poll-stage-foot">
                    <div className="poll-stage-actions">
                      <button
                        className="poll-btn-primary"
                        onClick={reopenSession}
                        disabled={busyAction === "reopen-session"}
                        type="button"
                      >
                        {busyAction === "reopen-session" ? "Membuka..." : "Buka sesi"}
                      </button>
                      <button
                        className="poll-btn-quiet"
                        onClick={archiveSession}
                        disabled={busyAction === "archive-session"}
                        type="button"
                      >
                        {detail.session.archivedAt ? "Batalkan arsip" : "Arsipkan sesi"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="poll-stage poll-stage-empty">
              <span className="poll-eyebrow">Poll Sessions</span>
              <h2>Belum ada sesi</h2>
              <p>Buat sesi, bagikan Kode Poll ke kelas, lalu mulai round pertama.</p>
              <div className="poll-stage-actions">
                <button className="poll-btn-primary" onClick={() => setCreatingSession(true)} type="button">
                  Buat sesi
                </button>
              </div>
            </section>
          )}

          {detail ? (
            <RosterPanel
              participants={detail.participants}
              round={rosterRound}
              scores={detail.scores}
            />
          ) : (
            <aside className="poll-roster">
              <div className="poll-roster-section">
                <div className="poll-roster-head">
                  <h3>Peserta</h3>
                </div>
                <p className="poll-roster-empty">Peserta muncul setelah sesi dibuat dan kode dibagikan.</p>
              </div>
            </aside>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          state={confirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}

function SessionRow({ session, isActive }: { session: PollSessionSummary; isActive: boolean }) {
  return (
    <Link
      to="/admin/polls"
      search={{ sessionId: session.id }}
      className={`poll-session ${isActive ? "is-active" : ""} ${session.status === "open" ? "is-live" : ""}`}
      aria-current={isActive ? "true" : undefined}
    >
      <div className="poll-session-top">
        <span className="poll-session-dot" />
        <span className="poll-session-state">{session.status === "open" ? "Live" : session.status === "closed" ? "Ditutup" : "Draf"}</span>
        <span className="poll-session-time">{formatSessionTime(session.openedAt)}</span>
      </div>
      <span className="poll-session-title">{session.title}</span>
      <span className="poll-session-meta">
        {session.code} · {session.roundCount} round · {session.participantCount} bergabung
      </span>
    </Link>
  );
}

function StageHeader({
  code,
  joined,
  answered,
  mode,
  countdownSeconds,
  timerSeconds,
  correctCount,
  copied,
  onCopy,
}: {
  code: string;
  joined: number;
  answered: number;
  mode: StageMode;
  countdownSeconds: number | null;
  timerSeconds: number | null;
  correctCount: number;
  copied: boolean;
  onCopy: () => void;
}) {
  const joinHost = useJoinHost();
  const answeredLabel = mode === "composing"
    ? "round belum dimulai"
    : mode === "closed"
      ? "jawaban round terakhir"
      : "sudah menjawab";
  const showDots = joined > 0;

  return (
    <header className="poll-stage-head">
      <div>
        <span className="poll-eyebrow">Kode Poll</span>
        <div className="poll-code-row">
          <span className="poll-code">{code}</span>
          <button className="poll-copy" onClick={onCopy} type="button">
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
        <span className="poll-join-hint">
          Buka <b>{joinHost ?? "halaman poll"}</b>, masukkan kode
        </span>
      </div>

      <div className="poll-answered">
        <div className="poll-answered-num">
          {answered}<span>/{joined}</span>
        </div>
        <span className="poll-answered-label">{answeredLabel}</span>
        {showDots && (
          <div className="poll-dots" aria-hidden="true">
            {Array.from({ length: Math.min(joined, 24) }, (_, index) => (
              <i className={index < answered ? "is-on" : ""} key={index} />
            ))}
          </div>
        )}
      </div>

      {mode === "voting" && (
        timerSeconds && countdownSeconds !== null ? (
          <TimerRing seconds={countdownSeconds} total={timerSeconds} />
        ) : (
          <div className="poll-timer-flat">
            <b>Tanpa timer</b>
          </div>
        )
      )}

      {mode === "revealed" && (
        <div className="poll-score-tile" aria-label={`${correctCount} jawaban benar`}>
          <span>{correctCount}</span>
          <b>benar</b>
        </div>
      )}

      {mode === "closed" && (
        <div className="poll-timer-flat">
          <b>Sesi ditutup</b>
        </div>
      )}
    </header>
  );
}

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const remainingRatio = total > 0 ? Math.min(Math.max(seconds / total, 0), 1) : 0;
  const offset = circumference * (1 - remainingRatio);
  const display = seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : String(seconds);
  const unit = seconds >= 60 ? "sisa" : "detik";

  return (
    <div className={`poll-ring ${seconds <= 10 ? "is-low" : ""}`} aria-label={`Sisa ${seconds} detik`}>
      <svg viewBox="0 0 86 86" aria-hidden="true">
        <circle className="poll-ring-track" cx="43" cy="43" r={radius} />
        <circle
          className="poll-ring-value"
          cx="43"
          cy="43"
          r={radius}
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
        />
      </svg>
      <div className="poll-ring-center">
        <div className="poll-ring-num">{display}</div>
        <div className="poll-ring-unit">{unit}</div>
      </div>
    </div>
  );
}

function RoundLadder({ round, revealed }: { round: PollRound; revealed: boolean }) {
  const totalAnswers = round.totalAnswers;
  const showCorrect = revealed || round.status === "closed";

  return (
    <ol className="poll-ladder">
      {pollOptions.map((option) => {
        const text = getPollRoundOptionText(round, option);
        const count = round.counts[option] ?? 0;
        const percent = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
        const isCorrect = showCorrect && round.correctOption === option;

        return (
          <li
            className={`poll-row ${isCorrect ? "is-correct" : ""} ${count === 0 && !isCorrect ? "is-zero" : ""}`}
            key={option}
          >
            <span className="poll-row-letter">{option}</span>
            <div className="poll-row-main">
              <div className="poll-row-text">
                {text || "—"}
                {isCorrect && <span className="poll-badge-true">Benar</span>}
              </div>
              <div className="poll-row-track">
                <div className="poll-row-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <div className="poll-row-count">
              {count}
              <span>suara</span>
            </div>
            <div className="poll-row-pct">{percent}%</div>
          </li>
        );
      })}
    </ol>
  );
}

function RosterPanel({
  participants,
  round,
  scores,
}: {
  participants: PollSessionDetail["participants"];
  round: PollRound | null;
  scores: PollSessionDetail["scores"];
}) {
  const answeredIds = new Set(round?.answers.map((answer) => answer.participantId) ?? []);

  return (
    <aside className="poll-roster">
      <div className="poll-roster-section">
        <div className="poll-roster-head">
          <h3>Peserta</h3>
          <span>{participants.length} bergabung</span>
        </div>
        {participants.length > 0 ? (
          participants.map((participant) => {
            const answered = answeredIds.has(participant.id);

            return (
              <div className={`poll-person ${answered ? "is-in" : ""}`} key={participant.id}>
                <span className="poll-avatar">{initials(participant.displayName)}</span>
                <span className="poll-person-name">{participant.displayName}</span>
                <span className="poll-person-state">{answered ? "Menjawab" : "Menunggu"}</span>
              </div>
            );
          })
        ) : (
          <p className="poll-roster-empty">Belum ada peserta. Bagikan Kode Poll ke kelas.</p>
        )}
      </div>

      <div className="poll-roster-section">
        <div className="poll-roster-head">
          <h3>Papan skor</h3>
          <span>Total sesi</span>
        </div>
        {scores.length > 0 ? (
          scores.map((score) => (
            <div className="poll-score-row" key={score.participantId}>
              <span className="poll-score-rank">#{score.rank}</span>
              <span className="poll-score-name">{score.displayName}</span>
              <span className="poll-score-pts">{score.totalPoints}</span>
            </div>
          ))
        ) : (
          <p className="poll-roster-empty">Skor muncul setelah peserta menjawab round pertama.</p>
        )}
      </div>

      <p className="poll-roster-foot">Skor dihitung dari jawaban benar dan kecepatan menjawab.</p>
    </aside>
  );
}

function ConfirmDialog({ state, onCancel }: { state: ConfirmState; onCancel: () => void }) {
  return (
    <div
      className="poll-confirm-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div className="poll-confirm" role="dialog" aria-modal="true" aria-labelledby="poll-confirm-title">
        <h2 id="poll-confirm-title">{state.title}</h2>
        <p>{state.description}</p>
        <div className="poll-confirm-actions">
          <button className="poll-btn-plain" onClick={onCancel} type="button">
            Batal
          </button>
          <button className="poll-btn-dark" onClick={state.onConfirm} type="button" autoFocus>
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
    if (!file.name.toLowerCase().endsWith(accept)) return;

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
      <span className="truncate">{isDragging ? "Lepas .xlsx di sini" : isUploading ? "Mengunggah..." : fileName || placeholder}</span>
      <input ref={inputRef} onChange={handleChange} disabled={isUnavailable} className="sr-only" type="file" accept={accept} />
    </div>
  );
}

function formatSessionTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function useJoinHost() {
  const [joinHost, setJoinHost] = useState<string | null>(null);

  useEffect(() => {
    setJoinHost(`${window.location.host}/poll`);
  }, []);

  return joinHost;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

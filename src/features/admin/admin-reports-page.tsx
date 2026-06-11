import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  listQuestionReportsAdmin,
  updateQuestionReportStatusAdmin,
} from "./admin-report-functions";

export const reportStatusFilters = ["open", "reviewed", "resolved", "dismissed", "all"] as const;
const reportStatuses = ["open", "reviewed", "resolved", "dismissed"] as const;
export const reportReasonFilters = ["answer_key_wrong", "explanation_wrong", "question_unclear", "typo", "other", "all"] as const;

export type ReportStatusFilter = (typeof reportStatusFilters)[number];
type ReportStatus = (typeof reportStatuses)[number];
export type ReportReasonFilter = (typeof reportReasonFilters)[number];
export type ReportQueue = Awaited<ReturnType<typeof listQuestionReportsAdmin>>;
type ReportRow = ReportQueue["reports"][number];

export type ReportSearch = {
  status?: ReportStatusFilter;
  reason?: ReportReasonFilter;
  tryoutId?: string;
  questionId?: string;
};

export function AdminReportsPage({
  queue,
  search,
}: {
  queue: ReportQueue;
  search: ReportSearch;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const status = search.status ?? "open";
  const reason = search.reason ?? "all";
  const tryoutId = search.tryoutId ?? "";
  const questionId = search.questionId ?? "";
  const [busyReportId, setBusyReportId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateFilters = (nextFilters: {
    status?: ReportStatusFilter;
    reason?: ReportReasonFilter;
    tryoutId?: string;
    questionId?: string;
  }) => {
    navigate({
      to: "/admin/reports",
      search: {
        status: nextFilters.status ?? status,
        reason: nextFilters.reason ?? reason,
        tryoutId: nextFilters.tryoutId ?? tryoutId,
        questionId: nextFilters.questionId ?? questionId,
      },
    });
  };

  const updateStatus = async (reportId: string, nextStatus: ReportStatus) => {
    setBusyReportId(reportId);
    setErrorMessage("");

    try {
      await updateQuestionReportStatusAdmin({ data: { reportId, status: nextStatus } });
      await router.invalidate();
    } catch {
      setErrorMessage("Report status was not updated.");
    } finally {
      setBusyReportId("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Question reports</h1>
          <p className="admin-description">Review Student reports with Attempt context and mark the moderation outcome.</p>
        </header>

        {errorMessage && (
          <p className="admin-alert mt-6">{errorMessage}</p>
        )}

        <section className="admin-panel mt-6 p-5">
          <div className="grid gap-4 lg:grid-cols-[180px_220px_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="block">
              <span className="admin-kicker">Status</span>
              <select
                value={status}
                onChange={(event) => updateFilters({ status: event.target.value as ReportStatusFilter })}
                className="admin-control mt-2"
              >
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All</option>
              </select>
            </label>

            <label className="block">
              <span className="admin-kicker">Reason</span>
              <select
                value={reason}
                onChange={(event) => updateFilters({ reason: event.target.value as ReportReasonFilter })}
                className="admin-control mt-2"
              >
                <option value="all">All Reasons</option>
                {reportReasonFilters.filter((value) => value !== "all").map((value) => (
                  <option key={value} value={value}>{getReasonLabel(value)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="admin-kicker">Try-out</span>
              <select
                value={tryoutId}
                onChange={(event) => updateFilters({ tryoutId: event.target.value })}
                className="admin-control mt-2"
              >
                <option value="">All Try-outs</option>
                {queue.tryouts.map((tryout) => (
                  <option key={tryout.id} value={tryout.id}>{tryout.title}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="admin-kicker">Question</span>
              <select
                value={questionId}
                onChange={(event) => updateFilters({ questionId: event.target.value })}
                className="admin-control mt-2"
              >
                <option value="">All Questions</option>
                {queue.questions.map((question) => (
                  <option key={question.id} value={question.id}>{question.questionText}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateFilters({ reason: "all" })}
              className={reason === "all" ? "admin-button-primary" : "admin-button-ghost"}
            >
              All reasons
            </button>
            {queue.reasons.map((reasonGroup) => (
              <button
                key={reasonGroup.reason}
                type="button"
                onClick={() => updateFilters({ reason: reasonGroup.reason })}
                className={reason === reasonGroup.reason ? "admin-button-primary" : "admin-button-ghost"}
              >
                {getReasonLabel(reasonGroup.reason)} ({reasonGroup.count})
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel mt-6 overflow-hidden">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">Moderation queue</h2>
              <p className="mt-1 text-xs font-semibold text-stone-400">{queue.reports.length} reports shown</p>
            </div>
          </div>

          {queue.reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              busy={busyReportId === report.id}
              onUpdateStatus={updateStatus}
            />
          ))}

          {queue.reports.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-stone-400">No reports match these filters.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ReportCard({
  report,
  busy,
  onUpdateStatus,
}: {
  report: ReportRow;
  busy: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus) => void;
}) {
  return (
    <article className="border-b border-stone-100 p-5 last:border-b-0 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={report.status} />
            <span className="admin-meta-tag first:before:hidden">Reason: {getReasonLabel(report.reason)}</span>
            <span className="admin-meta-tag">Reported {formatDateTime(report.createdAt)}</span>
          </div>

          <h3 className="mt-3 text-base font-black leading-snug tracking-tight text-stone-800">
            {report.questionText}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="admin-meta-tag first:before:hidden">{report.tryoutTitle}</span>
            <span className="admin-meta-tag">Attempt #{report.attemptNumber}</span>
            <span className="admin-meta-tag">Score {report.attemptScore}%</span>
            <span className="admin-meta-tag">{report.categoryName} / {report.subCategoryName} / {report.topicName}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <ReportAction label="Reopen" status="open" report={report} busy={busy} onUpdateStatus={onUpdateStatus} />
          <ReportAction label="Reviewed" status="reviewed" report={report} busy={busy} onUpdateStatus={onUpdateStatus} />
          <ReportAction label="Resolved" status="resolved" report={report} busy={busy} onUpdateStatus={onUpdateStatus} />
          <ReportAction label="Dismiss" status="dismissed" report={report} busy={busy} onUpdateStatus={onUpdateStatus} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <InfoBox label="Student" value={`${report.studentName} (${report.studentEmail})`} />
        <InfoBox label="Student answer" value={report.selectedOption ?? "Unanswered"} />
        <InfoBox label="Correct answer" value={report.correctOption} />
      </div>

      {report.note && (
        <div className="mt-4 rounded-[var(--radius-md)] border-2 border-amber-100 bg-amber-50/60 p-4">
          <p className="admin-kicker text-amber-700">{report.reason === "other" ? "Custom reason" : "Student note"}</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-700">{report.note}</p>
        </div>
      )}

      <div className="mt-4 rounded-[var(--radius-md)] border-2 border-stone-100 bg-stone-50 p-4">
        <p className="admin-kicker">Explanation snapshot</p>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-stone-600">{report.explanation}</p>
      </div>
    </article>
  );
}

function ReportAction({
  label,
  status,
  report,
  busy,
  onUpdateStatus,
}: {
  label: string;
  status: ReportStatus;
  report: ReportRow;
  busy: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus) => void;
}) {
  const active = report.status === status;

  return (
    <button
      onClick={() => onUpdateStatus(report.id, status)}
      disabled={busy || active}
      className={active ? "admin-button-primary" : "admin-button-ghost"}
      type="button"
    >
      {label}
    </button>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border-2 border-stone-100 bg-white p-4">
      <p className="admin-kicker">{label}</p>
      <p className="mt-2 text-sm font-bold text-stone-800">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ReportStatus }) {
  const config = {
    open: "border-amber-200 bg-amber-50 text-amber-700",
    reviewed: "border-sky-200 bg-sky-50 text-sky-700",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dismissed: "border-stone-200 bg-stone-100 text-stone-500",
  };

  return (
    <span className={`admin-status-pill ${config[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: ReportStatus) {
  const labels = {
    open: "Open",
    reviewed: "Reviewed",
    resolved: "Resolved",
    dismissed: "Dismissed",
  };

  return labels[status];
}

function getReasonLabel(reason: ReportRow["reason"] | ReportReasonFilter) {
  const labels = {
    answer_key_wrong: "Answer key wrong",
    explanation_wrong: "Explanation wrong",
    question_unclear: "Question unclear",
    typo: "Typo",
    other: "Other",
    all: "All Reasons",
  };

  return labels[reason];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

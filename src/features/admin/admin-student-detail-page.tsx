import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { getSafeErrorMessage } from "../../lib/user-errors";
import { getLevelForXp } from "../engagement-surface/level-catalog";
import {
  getStudentEvaluationAdmin,
  setStudentStatusAdmin,
  startStudentImpersonationAdmin,
} from "./admin-user-functions";

export type StudentEvaluation = Awaited<ReturnType<typeof getStudentEvaluationAdmin>>;
type EvaluationCategory = StudentEvaluation["categories"][number];
type EvaluationAttempt = StudentEvaluation["attempts"][number];

const ATTEMPTS_PAGE_SIZE = 10;

const rowClassName = "flex items-center gap-3 border-t border-stone-100 px-3 py-2.5 first:border-t-0 last:rounded-b-xl sm:px-4";

export function AdminStudentDetailPage({
  evaluation,
}: {
  evaluation: StudentEvaluation;
}) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(ATTEMPTS_PAGE_SIZE);
  const { student, summary, attempts, categories } = evaluation;
  const isSuspended = student.status === "suspended";
  const nextStatus = isSuspended ? "active" : "suspended";
  const isSuspendingSelf = student.isCurrentSessionUser && nextStatus === "suspended";
  const impersonateBlockedReason = getImpersonateBlockedReason({ isSuspended, isSelf: student.isCurrentSessionUser });
  const levelInfo = getLevelForXp(summary.xp);
  const visibleAttempts = attempts.slice(0, attemptLimit);
  const hiddenAttemptCount = attempts.length - visibleAttempts.length;

  const refresh = async () => {
    await router.invalidate();
  };

  const updateStudentStatus = async () => {
    if (nextStatus === "suspended" && !window.confirm(`Suspend ${student.name}? They will not be able to use the app until you unsuspend them.`)) return;

    setBusyAction("status");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await setStudentStatusAdmin({
        data: {
          studentUserId: student.userId,
          status: nextStatus,
        },
      });
      await refresh();
      setSuccessMessage(nextStatus === "suspended" ? "Student was suspended." : "Student was unsuspended.");
    } catch {
      setErrorMessage("Student status was not updated.");
    } finally {
      setBusyAction("");
    }
  };

  const impersonateStudent = async () => {
    setBusyAction("impersonate");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await startStudentImpersonationAdmin({
        data: { studentUserId: student.userId },
      });

      window.location.assign(result.redirectTo);
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Impersonation was not started."));
      setBusyAction("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <Link to="/admin/users" className="admin-back-link">Users</Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="admin-title">{student.name}</h1>
            <StatusPill status={student.status} />
          </div>
          <p className="admin-description">
            Per-Student evaluation from submitted and auto-submitted Attempts.
          </p>
        </header>

        {successMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
        {errorMessage && (
          <p role="alert" className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6" aria-labelledby="student-title">
          <AdminPanelHeader
            id="student-title"
            title="Student"
            description="Account details and actions."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={impersonateStudent}
                  disabled={Boolean(impersonateBlockedReason) || busyAction === "impersonate"}
                  title={impersonateBlockedReason}
                  className="admin-button-secondary"
                  type="button"
                >
                  Impersonate
                </button>
                <button
                  onClick={updateStudentStatus}
                  disabled={isSuspendingSelf || busyAction === "status"}
                  title={isSuspendingSelf ? "You cannot suspend your own account." : undefined}
                  className={`admin-button-ghost ${isSuspended ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"}`}
                  type="button"
                >
                  {isSuspended ? "Unsuspend" : "Suspend"}
                </button>
              </div>
            }
          />

          <dl className="grid gap-x-6 gap-y-3 p-4 grid-cols-2 lg:grid-cols-3">
            <Detail label="Email" value={student.email} className="col-span-2 lg:col-span-1" />
            <Detail label="Phone" value={student.phone} emptyLabel="Not set" />
            <Detail label="Institution" value={student.institution} emptyLabel="No institution" />
            <Detail label="Joined" value={formatDate(student.joinedAt)} />
            <Detail label="Profile" value={student.profileCompleted ? "Completed" : "Incomplete"} />
          </dl>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="XP" value={summary.xp.toLocaleString()} />
          <Metric label="Level" value={levelInfo.level} />
          <Metric label="Streak" value={summary.streak} />
          <Metric label="Attempts" value={summary.totalAttempts} />
          <Metric label="Questions" value={summary.totalQuestions} />
          <Metric label="Accuracy" value={`${summary.accuracy}%`} />
        </section>

        <section className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="admin-panel" role="region" aria-labelledby="category-performance-title">
            <AdminPanelHeader
              id="category-performance-title"
              title="Category performance"
              badge={<span className="admin-count">{categories.length}</span>}
              description="Open a category to see sub-categories and topics."
            />

            <div>
              {categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}

              {categories.length === 0 && (
                <EmptyState message="No submitted Attempts yet." />
              )}
            </div>
          </div>

          <div className="admin-panel" role="region" aria-labelledby="attempt-history-title">
            <AdminPanelHeader
              id="attempt-history-title"
              title="Attempt history"
              badge={<span className="admin-count">{attempts.length}</span>}
              description="Newest first."
            />

            <div>
              {visibleAttempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}

              {hiddenAttemptCount > 0 && (
                <div className="border-t border-stone-100 p-3 text-center">
                  <button
                    type="button"
                    onClick={() => setAttemptLimit(attemptLimit + ATTEMPTS_PAGE_SIZE)}
                    className="admin-button-secondary"
                  >
                    Show {Math.min(hiddenAttemptCount, ATTEMPTS_PAGE_SIZE)} more
                    <span className="font-medium text-stone-400">({hiddenAttemptCount} hidden)</span>
                  </button>
                </div>
              )}

              {attempts.length === 0 && (
                <EmptyState message="No submitted Attempts yet." />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function getImpersonateBlockedReason({ isSuspended, isSelf }: { isSuspended: boolean; isSelf: boolean }) {
  if (isSelf) return "You cannot impersonate your own account.";
  if (isSuspended) return "Suspended Students cannot be impersonated.";
  return undefined;
}

function Detail({ label, value, emptyLabel, className = "" }: { label: string; value: string | null; emptyLabel?: string; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="admin-kicker">{label}</dt>
      <dd className={`mt-0.5 text-[13px] font-semibold [overflow-wrap:anywhere] ${value ? "text-stone-800" : "text-stone-400"}`}>
        {value || emptyLabel}
      </dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-panel px-4 py-3">
      <p className="admin-kicker">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-stone-800">{value}</p>
    </div>
  );
}

function CategoryRow({ category }: { category: EvaluationCategory }) {
  const percent = getPercent(category.correct, category.total);

  return (
    <details className="group overflow-hidden border-t border-stone-100 first:border-t-0 last:rounded-b-xl">
      <summary className={`${rowClassName} cursor-pointer list-none border-t-0 transition-colors duration-150 hover:bg-stone-50/70 [&::-webkit-details-marker]:hidden`}>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-stone-50"
          aria-hidden="true"
        >
          <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[13.5px] font-bold text-stone-800">{category.name}</h3>
            <span className="shrink-0 text-[13.5px] font-bold tabular-nums" style={{ color: category.color }}>{percent}%</span>
          </div>
          <ProgressBar value={percent} color={category.color} />
          <p className="mt-1 text-xs font-semibold text-stone-500">
            {category.correct}/{category.total} correct
            {category.subCategories.length > 0 && ` · ${category.subCategories.length} ${category.subCategories.length === 1 ? "sub-category" : "sub-categories"}`}
          </p>
        </div>
        {category.subCategories.length > 0 && <ChevronIcon />}
      </summary>

      <div className="grid gap-3 border-t border-stone-100 bg-stone-50/40 px-3 py-3 sm:px-4">
        {category.subCategories.map((subCategory) => {
          const subCategoryPercent = getPercent(subCategory.correct, subCategory.total);

          return (
            <div key={subCategory.id}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate font-semibold text-stone-700">{subCategory.name}</span>
                <span className="shrink-0 font-bold tabular-nums text-primary">{subCategoryPercent}%</span>
              </div>
              <ProgressBar value={subCategoryPercent} color="#205072" />
              <p className="mt-1 text-xs font-medium text-stone-500">
                {subCategory.correct}/{subCategory.total} correct
              </p>
              {subCategory.topics.length > 0 && (
                <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 pl-3">
                  {subCategory.topics.map((topic) => {
                    const topicPercent = getPercent(topic.correct, topic.total);

                    return (
                      <li key={topic.id} className="rounded-md border border-stone-100 bg-white px-3 py-2">
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                          <span className="min-w-0 truncate font-semibold text-stone-600">{topic.name}</span>
                          <span className="shrink-0 font-bold tabular-nums text-primary">{topicPercent}%</span>
                        </div>
                        <ProgressBar value={topicPercent} color="#58cc02" />
                        <p className="mt-1 text-[11px] font-medium text-stone-500">
                          {topic.correct}/{topic.total} correct
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function AttemptRow({ attempt }: { attempt: EvaluationAttempt }) {
  const submittedAt = attempt.submittedAt ? formatDate(attempt.submittedAt) : "No submit date";

  return (
    <div className={`${rowClassName} transition-colors duration-150 hover:bg-stone-50/70`}>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[13.5px] font-bold text-stone-800">{attempt.tryoutTitle}</h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="admin-meta-tag">Attempt #{attempt.attemptNumber}</span>
          <span className="admin-meta-tag">{submittedAt}</span>
          <span className="admin-meta-tag">{attempt.correctCount}/{attempt.totalQuestions} correct</span>
          <span className="admin-meta-tag">+{attempt.xpEarned} XP</span>
          {attempt.status === "auto_submitted" && <span className="admin-meta-tag text-amber-700">Auto-submitted</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <p className="text-[15px] font-bold tabular-nums text-primary">{attempt.score}%</p>
        <Link
          to="/results/$attemptId/review"
          params={{ attemptId: attempt.id }}
          className="mt-0.5 text-xs font-bold text-primary no-underline hover:text-primary-dark"
        >
          Review
        </Link>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-semibold text-stone-400">{message}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "suspended" }) {
  const className = status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

  return (
    <span className={`admin-status-pill ${className}`}>
      {status === "active" ? "Active" : "Suspended"}
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-stone-400 transition-transform duration-150 group-open:rotate-180" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getPercent(correct: number, total: number) {
  if (total <= 0) return 0;

  return Math.round((correct / total) * 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getLevelForXp } from "../../data";
import {
  getStudentEvaluationAdmin,
  setStudentStatusAdmin,
  startStudentImpersonationAdmin,
} from "../../lib/admin-functions";

type StudentEvaluation = Awaited<ReturnType<typeof getStudentEvaluationAdmin>>;
type EvaluationCategory = StudentEvaluation["categories"][number];
type EvaluationAttempt = StudentEvaluation["attempts"][number];

export const Route = createFileRoute("/admin/users/$studentId")({
  loader: async ({ params }) => {
    const evaluation = await getStudentEvaluationAdmin({
      data: { studentUserId: params.studentId },
    });

    return { evaluation };
  },
  head: () => ({
    meta: [
      { title: "Student Detail — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminStudentDetailPage,
});

function AdminStudentDetailPage() {
  const { evaluation } = Route.useLoaderData() as { evaluation: StudentEvaluation };
  const router = useRouter();
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { student, summary, attempts, categories } = evaluation;
  const nextStatus = student.status === "suspended" ? "active" : "suspended";
  const isSuspendingSelf = student.isCurrentSessionUser && nextStatus === "suspended";
  const levelInfo = getLevelForXp(summary.xp);

  const refresh = async () => {
    await router.invalidate();
  };

  const updateStudentStatus = async () => {
    setBusyAction("status");
    setErrorMessage("");

    try {
      await setStudentStatusAdmin({
        data: {
          studentUserId: student.userId,
          status: nextStatus,
        },
      });
      await refresh();
    } catch {
      setErrorMessage("Student status was not updated.");
    } finally {
      setBusyAction("");
    }
  };

  const impersonateStudent = async () => {
    setBusyAction("impersonate");
    setErrorMessage("");

    try {
      const result = await startStudentImpersonationAdmin({
        data: { studentUserId: student.userId },
      });

      window.location.assign(result.redirectTo);
    } catch {
      setErrorMessage("Impersonation was not started.");
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

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Student</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="admin-meta-tag first:before:hidden">{student.email}</span>
                <span className="admin-meta-tag">{student.institution || "No institution"}</span>
                <span className="admin-meta-tag">Joined {formatDate(student.joinedAt)}</span>
                <span className="admin-meta-tag">
                  Profile {student.profileCompleted ? "completed" : "incomplete"}
                </span>
              </div>
              {student.phone && (
                <p className="mt-3 text-sm font-semibold text-stone-500">{student.phone}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={impersonateStudent}
                disabled={student.status === "suspended" || busyAction === "impersonate"}
                className="admin-button-secondary"
                type="button"
              >
                Impersonate
              </button>
              <button
                onClick={updateStudentStatus}
                disabled={isSuspendingSelf || busyAction === "status"}
                className={`admin-button-ghost ${student.status === "suspended" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"}`}
                type="button"
              >
                {student.status === "suspended" ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="XP" value={summary.xp.toLocaleString()} />
          <Metric label="Level" value={levelInfo.level} />
          <Metric label="Streak" value={summary.streak} />
          <Metric label="Attempts" value={summary.totalAttempts} />
          <Metric label="Questions" value={summary.totalQuestions} />
          <Metric label="Accuracy" value={`${summary.accuracy}%`} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="admin-panel overflow-hidden">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Category performance</h2>
            </div>

            <div>
              {categories.map((category) => (
                <CategoryPanel key={category.id} category={category} />
              ))}

              {categories.length === 0 && (
                <EmptyState message="No submitted Attempts yet." />
              )}
            </div>
          </div>

          <div className="admin-panel overflow-hidden">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Attempt history</h2>
            </div>

            <div>
              {attempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}

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

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-panel p-5">
      <p className="admin-kicker">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-stone-800">{value}</p>
    </div>
  );
}

function CategoryPanel({ category }: { category: EvaluationCategory }) {
  const percent = getPercent(category.correct, category.total);

  return (
    <div className="border-b border-stone-100 p-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold tracking-tight text-stone-800">{category.name}</h3>
          <p className="mt-1 text-xs font-semibold text-stone-400">
            {category.correct}/{category.total} correct
          </p>
        </div>
        <span className="text-lg font-black" style={{ color: category.color }}>{percent}%</span>
      </div>

      <ProgressBar value={percent} color={category.color} />

      <div className="mt-4 grid gap-3">
        {category.subCategories.map((subCategory) => {
          const subCategoryPercent = getPercent(subCategory.correct, subCategory.total);

          return (
            <div key={subCategory.id}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-stone-600">{subCategory.name}</span>
                <span className="shrink-0 font-bold text-primary">{subCategoryPercent}%</span>
              </div>
              <ProgressBar value={subCategoryPercent} color="#205072" />
              <p className="mt-1 text-xs font-medium text-stone-400">
                {subCategory.correct}/{subCategory.total} correct
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: EvaluationAttempt }) {
  const submittedAt = attempt.submittedAt ? formatDate(attempt.submittedAt) : "No submit date";

  return (
    <div className="border-b border-stone-100 p-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-800">
            {attempt.tryoutTitle}
          </h3>
          <p className="mt-1.5 text-xs font-semibold text-stone-400">
            Attempt #{attempt.attemptNumber} · {submittedAt}
          </p>
          <p className="mt-1 text-xs font-medium text-stone-400">
            {attempt.correctCount}/{attempt.totalQuestions} correct · +{attempt.xpEarned} XP
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-primary">{attempt.score}%</p>
          <Link
            to="/results/$attemptId/review"
            params={{ attemptId: attempt.id }}
            className="mt-2 inline-flex text-xs font-bold text-primary no-underline hover:text-primary-dark"
          >
            Review
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100">
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

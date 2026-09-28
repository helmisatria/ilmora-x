import type { ReactNode } from "react";
import { getAdminContentCounts } from "./admin-content-counts";

export type AdminInsights = Awaited<ReturnType<typeof getAdminContentCounts>>;
type DifficultQuestion = AdminInsights["difficultQuestions"][number];
type ReportedQuestion = AdminInsights["reportedQuestions"][number];
type TryoutParticipation = AdminInsights["tryoutParticipation"][number];
type CategoryPerformance = AdminInsights["categoryPerformance"][number];
type RecentActivity = AdminInsights["recentActivity"][number];

export function AdminInsightsPage({ counts }: { counts: AdminInsights }) {
  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Insights</h1>
          <p className="admin-description">Student activity from the last {counts.periodDays} days, plus all-time content totals.</p>
        </header>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Metric label="Students · all time" value={counts.students} />
          <Metric label="New Students · 30 days" value={counts.newStudents} />
          <Metric label="Active Students · 30 days" value={counts.activeStudents} />
          <Metric label="Premium Students · current" value={counts.premiumStudents} />
          <Metric label="Free Students · current" value={counts.freeStudents} />
          <Metric label="Completed Attempts · 30 days" value={counts.periodAttempts} />
          <Metric label="Answered Questions · 30 days" value={counts.answeredQuestions} />
          <Metric label="Average Score · all time" value={`${counts.averageScore}%`} />
          <Metric label="Open reports" value={counts.openReports} />
          <Metric label="Try-outs" value={counts.tryouts} />
          <Metric label="Questions" value={counts.questions} />
          <Metric label="Categories" value={counts.categories} />
          <Metric label="Materi" value={counts.materi} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <InsightPanel title="Category Performance · 30 days" emptyMessage="No answered Questions in this period.">
            {counts.categoryPerformance.map((category: CategoryPerformance) => (
              <InsightRow
                key={category.category}
                title={category.category}
                meta={`${category.correct}/${category.answered} correct`}
                value={`${Math.round(100 * category.correct / category.answered)}%`}
              />
            ))}
          </InsightPanel>

          <InsightPanel title="Recent Activity · 30 days" emptyMessage="No Student activity in this period.">
            {counts.recentActivity.map((event: RecentActivity, index: number) => (
              <InsightRow
                key={`${event.createdAt}:${index}`}
                title={event.studentName}
                meta={formatActivity(event.eventType)}
                value={formatDate(event.createdAt)}
              />
            ))}
          </InsightPanel>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <InsightPanel title="Difficult Questions" emptyMessage="No answered Questions yet.">
            {counts.difficultQuestions.map((question: DifficultQuestion) => (
              <InsightRow
                key={question.questionId}
                title={question.questionText}
                meta={`${question.correctAnswers}/${question.totalAnswers} correct`}
                value={`${question.accuracy}%`}
              />
            ))}
          </InsightPanel>

          <InsightPanel title="Reported Questions" emptyMessage="No open reports.">
            {counts.reportedQuestions.map((question: ReportedQuestion) => (
              <InsightRow
                key={question.questionId}
                title={question.questionText}
                meta="Open reports"
                value={question.openReports}
              />
            ))}
          </InsightPanel>

          <InsightPanel title="Try-out Participation" emptyMessage="No completed Attempts yet.">
            {counts.tryoutParticipation.map((tryout: TryoutParticipation) => (
              <InsightRow
                key={tryout.tryoutId}
                title={tryout.title}
                meta={`${tryout.averageScore}% average score`}
                value={tryout.completedAttempts}
              />
            ))}
          </InsightPanel>
        </div>
      </div>
    </main>
  );
}

function formatActivity(eventType: string) {
  const labels: Record<string, string> = {
    login: "Signed in",
    profile_completed: "Completed profile",
    tryout_started: "Started Try-out",
    tryout_submitted: "Submitted Try-out",
    question_reported: "Reported Question",
    materi_viewed: "Viewed Materi",
  };

  return labels[eventType] ?? eventType;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-panel p-5">
      <p className="admin-kicker">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-stone-800">{value}</p>
    </div>
  );
}

function InsightPanel({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  const hasRows = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);

  return (
    <section className="admin-panel overflow-hidden">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">{title}</h2>
      </div>

      {hasRows ? (
        <div>
          {children}
        </div>
      ) : (
        <p className="p-6 text-sm font-semibold text-stone-400">{emptyMessage}</p>
      )}
    </section>
  );
}

function InsightRow({
  title,
  meta,
  value,
}: {
  title: string;
  meta: string;
  value: number | string;
}) {
  return (
    <div className="border-b border-stone-100 p-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-800">{title}</h3>
          <p className="mt-1.5 text-xs font-semibold text-stone-400">{meta}</p>
        </div>
        <p className="shrink-0 text-lg font-black text-primary">{value}</p>
      </div>
    </div>
  );
}

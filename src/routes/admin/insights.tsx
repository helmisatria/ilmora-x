import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getAdminContentCounts } from "../../lib/admin-functions";

type AdminInsights = Awaited<ReturnType<typeof getAdminContentCounts>>;
type DifficultQuestion = AdminInsights["difficultQuestions"][number];
type ReportedQuestion = AdminInsights["reportedQuestions"][number];
type TryoutParticipation = AdminInsights["tryoutParticipation"][number];

export const Route = createFileRoute("/admin/insights")({
  loader: async () => getAdminContentCounts(),
  head: () => ({ meta: [{ title: "Insights — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminInsightsPage,
});

function AdminInsightsPage() {
  const counts = Route.useLoaderData() as AdminInsights;

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Insights</h1>
          <p className="admin-description">Basic Milestone 1 metrics from real tables.</p>
        </header>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Metric label="Students" value={counts.students} />
          <Metric label="Active Students" value={counts.activeStudents} />
          <Metric label="Completed Attempts" value={counts.completedAttempts} />
          <Metric label="Average Score" value={`${counts.averageScore}%`} />
          <Metric label="Open reports" value={counts.openReports} />
          <Metric label="Try-outs" value={counts.tryouts} />
          <Metric label="Questions" value={counts.questions} />
          <Metric label="Categories" value={counts.categories} />
          <Metric label="Materi" value={counts.materi} />
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

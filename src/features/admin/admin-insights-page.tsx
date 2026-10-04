import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, CheckCircledIcon, PersonIcon, ReaderIcon, RocketIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { getAdminContentCounts } from "./admin-content-counts";

export type AdminInsights = Awaited<ReturnType<typeof getAdminContentCounts>>;
const number = new Intl.NumberFormat("id-ID");

export function AdminInsightsPage({ counts }: { counts: AdminInsights }) {
  const period = `Last ${counts.periodDays} days`;
  const premiumShare = counts.students > 0 ? Math.min(100, 100 * counts.premiumStudents / counts.students) : 0;
  const participatingTryouts = counts.tryoutParticipation.filter((tryout) => tryout.completedAttempts > 0);

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/admin" className="admin-back-link">Admin</Link>
            <h1 className="admin-title">Insights</h1>
            <p className="admin-description">See who's learning, where they struggle, and what needs your attention.</p>
          </div>
          <span className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600">Activity window · {period.toLowerCase()}</span>
        </header>

        <section className="mt-6" aria-labelledby="engagement-title">
          <SectionHeading id="engagement-title" title="Learning activity" description={period} />
          <div className="admin-panel mt-3 grid grid-cols-2 gap-px overflow-hidden bg-stone-100 xl:grid-cols-4">
            <Metric label="Active students" value={counts.activeStudents} hint="Signed in or took a learning action" icon={<PersonIcon />} emphasized />
            <Metric label="New students" value={counts.newStudents} hint="Joined during this period" icon={<RocketIcon />} />
            <Metric label="Completed attempts" value={counts.periodAttempts} hint="Try-outs submitted during this period" icon={<CheckCircledIcon />} />
            <Metric label="Answered questions" value={counts.answeredQuestions} hint="From attempts completed in this period" icon={<ReaderIcon />} />
          </div>
        </section>

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Panel title="Category performance" description={`${period} · correct answers by category`}>
            {counts.categoryPerformance.length > 0 ? (
              <div className="space-y-5 p-5">
                {counts.categoryPerformance.map((category) => {
                  const accuracy = category.answered > 0 ? Math.round(100 * category.correct / category.answered) : 0;
                  return (
                    <div key={category.category}>
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="min-w-0 break-words text-sm font-bold text-stone-800">{category.category || "Uncategorized"}</h3>
                        <span className="shrink-0 text-lg font-bold tabular-nums text-primary">{accuracy}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${accuracy}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-stone-500">{number.format(category.correct)} of {number.format(category.answered)} answers correct</p>
                    </div>
                  );
                })}
                <p className="border-t border-stone-100 pt-3 text-xs leading-relaxed text-stone-500">Small answer counts can give an incomplete picture. Compare accuracy alongside the number of answers.</p>
              </div>
            ) : <EmptyState title="No answers to compare yet" description="Category results appear after students answer questions and complete a try-out." />}
          </Panel>

          <div className="grid gap-4">
            <Panel title="Needs attention" description="Current open question reports" action={<Link to="/admin/reports" className="insights-link">Review reports <ArrowRightIcon /></Link>}>
              <div className="p-5">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold tabular-nums ${counts.openReports > 0 ? "text-amber-700" : "text-stone-800"}`}>{number.format(counts.openReports)}</span>
                  <span className="text-sm text-stone-500">open {counts.openReports === 1 ? "report" : "reports"}</span>
                </div>
                {counts.reportedQuestions.length > 0 ? (
                  <ul className="mt-4 divide-y divide-stone-100">
                    {counts.reportedQuestions.map((question) => (
                      <li key={question.questionId} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-stone-700">{question.questionText}</p>
                        <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{number.format(question.openReports)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm leading-relaxed text-stone-500">All clear. No question reports are waiting for review.</p>}
              </div>
            </Panel>

            <Panel title="Student base" description="All registered students · current access" action={<Link to="/admin/users" className="insights-link">View students <ArrowRightIcon /></Link>}>
              <div className="p-5">
                <p className="text-3xl font-bold tabular-nums text-stone-800">{number.format(counts.students)} <span className="text-sm font-medium text-stone-500">{counts.students === 1 ? "student" : "students"}</span></p>
                <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                  <div className="h-full bg-brand-aqua" style={{ width: `${premiumShare}%` }} />
                </div>
                <dl className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-brand-aqua" aria-hidden="true" /><dt className="text-stone-600">Premium students</dt><dd className="font-bold tabular-nums text-stone-800">{number.format(counts.premiumStudents)}</dd></div>
                  <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-stone-200" aria-hidden="true" /><dt className="text-stone-600">Free students</dt><dd className="font-bold tabular-nums text-stone-800">{number.format(counts.freeStudents)}</dd></div>
                </dl>
              </div>
            </Panel>
          </div>
        </div>

        <section className="mt-7" aria-labelledby="results-title">
          <SectionHeading id="results-title" title="Learning results" description="All completed attempts · lifetime" />
          <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
            <Panel title="Lowest question accuracy" description="Up to 5 questions, ordered from lowest accuracy">
              <div className="flex items-center justify-between gap-4 border-b border-stone-100 bg-primary-tint/60 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold text-stone-600">Average score · all time</p>
                  <p className="mt-1 text-xs text-stone-500">Based on {number.format(counts.completedAttempts)} completed {counts.completedAttempts === 1 ? "attempt" : "attempts"}</p>
                </div>
                <p className="shrink-0 text-2xl font-bold tabular-nums text-primary">{counts.completedAttempts > 0 ? `${counts.averageScore}%` : "—"}</p>
              </div>
              {counts.difficultQuestions.length > 0 ? (
                <ul className="divide-y divide-stone-100">
                  {counts.difficultQuestions.map((question) => (
                    <li key={`${question.questionId}:${question.questionText}`} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-stone-800">{question.questionText}</p>
                        <p className="mt-1.5 text-xs text-stone-500">{number.format(question.correctAnswers)} of {number.format(question.totalAnswers)} answers correct</p>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${question.accuracy < 50 ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-600"}`}>{question.accuracy}%</span>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="No question results yet" description="Completed try-outs will show which questions students find hardest." />}
            </Panel>

            <Panel title="Try-out participation" description="Up to 5 try-outs with the most completed attempts" action={<Link to="/admin/tryouts" className="insights-link">View try-outs <ArrowRightIcon /></Link>}>
              {participatingTryouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
                      <tr><th scope="col" className="px-5 py-3 font-semibold">Try-out</th><th scope="col" className="px-3 py-3 text-right font-semibold">Attempts</th><th scope="col" className="px-5 py-3 text-right font-semibold">Avg. score</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {participatingTryouts.map((tryout) => (
                        <tr key={tryout.tryoutId}>
                          <th scope="row" className="px-5 py-4 font-semibold text-stone-800"><Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tryout.tryoutId }} className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{tryout.title}</Link></th>
                          <td className="px-3 py-4 text-right font-bold tabular-nums text-stone-700">{number.format(tryout.completedAttempts)}</td>
                          <td className="px-5 py-4 text-right tabular-nums text-stone-600">{tryout.averageScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState title="No completed try-outs yet" description="Participation and average scores appear when students submit their attempts." />}
            </Panel>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Panel title="Recent activity" description={`${period} · latest 10 recorded actions`}>
            {counts.recentActivity.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {counts.recentActivity.map((event, index) => (
                  <li key={`${event.createdAt}:${index}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                    <div className="min-w-0"><p className="break-words text-sm font-semibold text-stone-800">{event.studentName}</p><p className="mt-1 text-xs text-stone-500">{formatActivity(event.eventType)}</p></div>
                    <time dateTime={event.createdAt} className="text-xs tabular-nums text-stone-500">{formatDate(event.createdAt)} WIB</time>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="No recorded activity in this period" description="Sign-ins, try-out activity, reports, and material views appear here as students use IlmoraX." />}
          </Panel>

          <Panel title="Content library" description="All-time totals">
            <dl className="divide-y divide-stone-100 px-5">
              <LibraryCount label="Try-outs" value={counts.tryouts} />
              <LibraryCount label="Questions" value={counts.questions} />
              <LibraryCount label="Categories" value={counts.categories} />
              <LibraryCount label="Materi" value={counts.materi} />
            </dl>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id={id} className="text-base font-bold text-stone-800">{title}</h2><p className="text-xs text-stone-500">{description}</p></div>;
}

function Metric({ label, value, hint, icon, emphasized = false }: { label: string; value: number; hint: string; icon: ReactNode; emphasized?: boolean }) {
  return (
    <div className={`min-w-0 p-4 sm:p-5 ${emphasized ? "bg-primary-tint" : "bg-white"}`}>
      <div className="flex items-center gap-2 text-primary"><span aria-hidden="true">{icon}</span><h3 className="text-xs font-semibold text-stone-600">{label}</h3></div>
      <p className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${emphasized ? "text-primary" : "text-stone-800"}`}>{number.format(value)}</p>
      <p className="mt-2 text-xs leading-relaxed text-stone-500">{hint}</p>
    </div>
  );
}

function Panel({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="admin-panel min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
        <div><h2 className="admin-panel-title">{title}</h2><p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p></div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="px-5 py-6"><p className="text-sm font-semibold text-stone-700">{title}</p><p className="mt-1.5 max-w-[48ch] text-xs leading-relaxed text-stone-500">{description}</p></div>;
}

function LibraryCount({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3 py-3.5"><dt className="text-sm text-stone-600">{label}</dt><dd className="text-base font-bold tabular-nums text-stone-800">{number.format(value)}</dd></div>;
}

function formatActivity(eventType: string) {
  const labels: Record<string, string> = { login: "Signed in", profile_completed: "Completed profile", tryout_started: "Started a try-out", tryout_submitted: "Submitted a try-out", question_reported: "Reported a question", materi_viewed: "Viewed materi" };
  return labels[eventType] ?? eventType.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

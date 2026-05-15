import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getPollSessionAdmin } from "../../lib/poll-functions";
import { subscribeToPollUpdates } from "../../lib/poll-live";

const pollOptions = ["A", "B", "C", "D", "E"] as const;
const searchSchema = z.object({
  sessionId: z.string().min(1),
});

type PollOption = (typeof pollOptions)[number];
type PollSessionDetail = Awaited<ReturnType<typeof getPollSessionAdmin>>;
type PollRound = PollSessionDetail["rounds"][number];

export const Route = createFileRoute("/admin/polls_/presentation")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ sessionId: search.sessionId }),
  loader: async ({ deps }) => {
    const detail = await getPollSessionAdmin({ data: { sessionId: deps.sessionId } });

    return { detail };
  },
  head: () => ({
    meta: [
      { title: "Poll Presentation — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PollPresentationPage,
});

function PollPresentationPage() {
  const { detail } = Route.useLoaderData() as { detail: PollSessionDetail };
  const router = useRouter();
  const activeRound = detail.rounds.find((round) => round.status === "open") ?? null;
  const latestRound = detail.rounds.at(-1) ?? null;
  const round = activeRound ?? latestRound ?? null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (detail.session.status !== "open") return;

    const unsubscribe = subscribeToPollUpdates({
      sessionId: detail.session.id,
      onUpdate: () => {
        router.invalidate();
      },
    });

    return unsubscribe;
  }, [detail.session.id, detail.session.status, router]);

  useEffect(() => {
    if (!round || round.status !== "open" || !round.timerSeconds) {
      setSecondsLeft(null);
      return;
    }

    const openedAt = new Date(round.openedAt).getTime();
    const timeoutMs = round.timerSeconds * 1000;

    const update = () => {
      const remaining = Math.max(Math.ceil((openedAt + timeoutMs - Date.now()) / 1000), 0);
      setSecondsLeft(remaining);
    };

    update();
    const timerId = window.setInterval(update, 1000);

    return () => window.clearInterval(timerId);
  }, [round?.id, round?.openedAt, round?.status, round?.timerSeconds]);

  return (
    <main className="min-h-screen bg-[#201a12] text-amber-50">
      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(900px 520px at 8% 8%, rgba(245,158,11,0.24), transparent 64%), radial-gradient(820px 520px at 92% 0%, rgba(20,184,166,0.18), transparent 62%), linear-gradient(180deg, #201a12 0%, #15110d 100%)",
        }}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-8 py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/15 pb-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200/60">
                IlmoraX Live Poll
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-amber-50">
                {detail.session.title}
              </h1>
            </div>
            <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-5 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/55">Kode Poll</div>
              <div className="mt-1 text-4xl font-black tracking-[0.2em]">{detail.session.code}</div>
            </div>
          </header>

          <section className="flex flex-1 items-center py-10">
            {round ? (
              <RoundStage round={round} secondsLeft={secondsLeft} />
            ) : (
              <div className="mx-auto max-w-3xl text-center">
                <div className="text-sm font-black uppercase tracking-[0.22em] text-amber-200/55">Waiting</div>
                <p className="mt-5 text-6xl font-black leading-tight tracking-tight">
                  Menunggu round dimulai.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function RoundStage({ round, secondsLeft }: { round: PollRound; secondsLeft: number | null }) {
  const isClosed = round.status === "closed";
  const hasContent = Boolean(round.questionText);

  return (
    <div className="w-full">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.22em] text-amber-200/55">
            {round.label}
          </div>
          <div className="mt-2 text-lg font-black text-amber-100/70">
            {isClosed ? "Hasil sudah direveal" : "Pilih jawaban di perangkat masing-masing"}
          </div>
        </div>
        {secondsLeft !== null ? (
          <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-5 py-3 text-3xl font-black">
            {formatCountdown(secondsLeft)}
          </div>
        ) : null}
      </div>

      {hasContent ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
          <section>
            <p className="text-[clamp(38px,5vw,72px)] font-black leading-[1.05] tracking-tight text-amber-50">
              {round.questionText}
            </p>
          </section>
          <section className="grid gap-4">
            {pollOptions.map((option) => {
              const optionText = getRoundOptionText(round, option);
              if (!optionText) return null;

              return (
                <div
                  key={option}
                  className={`flex gap-4 rounded-2xl border-2 p-5 ${
                    isClosed && round.correctOption === option
                      ? "border-green-300 bg-green-300/15 text-green-50"
                      : "border-amber-200/15 bg-amber-50/5 text-amber-50"
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-2xl font-black text-stone-950">
                    {option}
                  </span>
                  <span className="text-2xl font-black leading-snug">{optionText}</span>
                </div>
              );
            })}
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl text-center">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-amber-200/55">{round.label}</div>
          <p className="mt-5 text-6xl font-black leading-tight tracking-tight">
            Lihat soal dari pembimbing.
          </p>
        </div>
      )}

      {isClosed ? (
        <section className="mt-10 rounded-3xl border border-amber-200/15 bg-amber-50/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">Distribusi jawaban</h2>
            <div className="rounded-full bg-green-300 px-4 py-2 text-sm font-black text-stone-950">
              Jawaban benar: {round.correctOption}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {pollOptions.map((option) => {
              const count = round.counts[option] ?? 0;
              const percent = round.totalAnswers > 0 ? Math.round((count / round.totalAnswers) * 100) : 0;

              return (
                <div key={option} className="rounded-2xl border border-amber-200/15 bg-black/15 p-4">
                  <div className="flex items-center justify-between text-sm font-black text-amber-100/70">
                    <span>{option}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-3 text-4xl font-black">{count}</div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function getRoundOptionText(round: PollRound, option: PollOption) {
  if (option === "A") return round.optionA;
  if (option === "B") return round.optionB;
  if (option === "C") return round.optionC;
  if (option === "D") return round.optionD;
  return round.optionE;
}

function formatCountdown(totalSeconds: number) {
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { mockPolls, type Poll } from "../data";

export const Route = createFileRoute("/poll/$code")({
  head: ({ params }) => ({
    meta: [
      { title: "Live Poll — IlmoraX" },
      { name: "description", content: `Gabung live poll dengan kode ${params.code}. Vote jawaban dan lihat hasil setelah poll ditutup. Real-time polling untuk kelas dan tryout.` },
      { property: "og:title", content: "Live Poll — IlmoraX" },
      { property: "og:description", content: "Gabung live poll dan vote jawaban secara real-time." },
    ],
  }),
  component: PollActiveComponent,
});

const pollLetters = ["A", "B", "C", "D", "E"] as const;

function PollActiveComponent() {
  const { code } = Route.useParams();
  const poll = mockPolls.find((item) => item.code === code);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!poll) {
    return (
      <StateShell title="Poll tidak ditemukan" kicker="Kode tidak valid" description={`Kode ${code} tidak cocok dengan sesi aktif.`}>
        <Link to="/poll/join" className="btn btn-primary mt-6 w-full">Coba kode lain</Link>
      </StateShell>
    );
  }

  const showResults = poll.resultsRevealed || poll.status === "closed";

  if (poll.status === "draft") {
    return (
      <StateShell title="Menunggu poll dimulai" kicker="Live Poll" description={poll.title}>
        <CodeCard code={poll.code} />
      </StateShell>
    );
  }

  if (showResults) {
    return <ResultsState poll={poll} />;
  }

  if (submitted) {
    return <SubmittedState title={poll.title} selected={selected !== null ? pollLetters[selected] : ""} />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8f6_0%,#fbfaf7_48%,#f7f3ea_100%)]">
      <PollTopBar poll={poll} stateLabel="Live" stateTone="live" />

      <div className="mx-auto w-full max-w-[720px] px-5 py-8 pb-24 sm:px-6">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Kode {poll.code}
          </div>
          <h1 className="mx-auto mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[36px]">
            {poll.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[34ch] text-sm font-medium leading-relaxed text-stone-500">
            Pilih satu jawaban. Teks opsi disembunyikan, hanya huruf A sampai E yang ditampilkan.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-5 gap-2.5 sm:gap-3">
          {pollLetters.map((letter, index) => {
            const isSelected = selected === index;

            return (
              <button
                key={letter}
                className="group aspect-square rounded-[var(--radius-lg)] border-2 border-b-4 bg-white text-[24px] font-black shadow-sm transition-all duration-150 hover:-translate-y-1 active:translate-y-0 sm:text-[32px]"
                style={{
                  color: isSelected ? "#ffffff" : "#57534e",
                  background: isSelected ? "#14b8a6" : "#ffffff",
                  borderColor: isSelected ? "#0d9488" : "#e7e5e4",
                  borderBottomColor: isSelected ? "#0f766e" : "#d6d3d1",
                }}
                onClick={() => setSelected(index)}
                type="button"
              >
                {letter}
              </button>
            );
          })}
        </div>

        <button
          className="btn btn-primary btn-lg mt-6 w-full"
          disabled={selected === null}
          onClick={() => setSubmitted(true)}
          type="button"
        >
          Kirim Jawaban
        </button>

        <p className="mt-3 text-center text-xs font-medium text-stone-400">
          Hasil akan muncul setelah admin membuka hasil.
        </p>
      </div>
    </main>
  );
}

function PollTopBar({ poll, stateLabel, stateTone }: { poll: Poll; stateLabel: string; stateTone: "live" | "done" }) {
  const badgeStyle =
    stateTone === "live"
      ? "border-red-200 bg-red-50 text-red-600"
      : "border-stone-200 bg-stone-100 text-stone-600";

  return (
    <div className="sticky top-0 z-10 border-b-2 border-stone-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1040px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/poll/join" className="icon-btn" aria-label="Kembali">
          <ArrowLeftIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-base font-black text-stone-800">{poll.title}</b>
          <span className="text-xs font-bold text-stone-400">Kode {poll.code}</span>
        </div>
        <span className={`rounded-full border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${badgeStyle}`}>
          {stateLabel}
        </span>
      </div>
    </div>
  );
}

function SubmittedState({ title, selected }: { title: string; selected: string }) {
  return (
    <StateShell title="Jawaban terkirim" kicker="Menunggu hasil" description={title}>
      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] border-2 border-teal-200 bg-teal-50 px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Pilihan</span>
        <span className="text-lg font-black text-primary">{selected}</span>
      </div>
      <p className="mx-auto mt-4 max-w-[30ch] text-sm font-medium leading-relaxed text-stone-500">
        Admin belum membuka hasil. Tetap di halaman ini atau kembali ke dashboard.
      </p>
      <Link to="/dashboard" className="btn btn-white mt-6 w-full">Kembali ke Dashboard</Link>
    </StateShell>
  );
}

function ResultsState({ poll }: { poll: Poll }) {
  const totalVotes = poll.totalVotes || 1;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8f6_0%,#fbfaf7_48%,#f7f3ea_100%)]">
      <PollTopBar poll={poll} stateLabel="Hasil" stateTone="done" />

      <div className="mx-auto w-full max-w-[720px] px-5 py-8 pb-24 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-teal-100 bg-teal-50 text-primary">
            <ChartIcon />
          </div>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Hasil Dibuka
          </div>
          <h1 className="mx-auto mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[36px]">
            {poll.title}
          </h1>
          <p className="mt-3 text-sm font-semibold text-stone-500">{poll.totalVotes} suara total</p>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {pollLetters.map((letter) => {
            const votes = poll.votes[letter] || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isTop = Math.max(...Object.values(poll.votes)) === votes;

            return (
              <div
                key={letter}
                className={`rounded-[var(--radius-lg)] border-2 border-b-4 bg-white p-4 shadow-sm ${
                  isTop ? "border-primary border-b-primary-dark" : "border-stone-100 border-b-stone-200"
                }`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] text-lg font-black ${isTop ? "bg-primary text-white" : "bg-stone-200 text-stone-500"}`}>
                    {letter}
                  </span>
                  <span className="flex-1 text-sm font-extrabold text-stone-700">Pilihan {letter}</span>
                  <span className={`text-lg font-black ${isTop ? "text-primary" : "text-stone-700"}`}>{pct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                  <div className={`h-full rounded-full transition-all duration-700 ${isTop ? "bg-primary" : "bg-stone-400"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-xs font-bold text-stone-400">{votes} suara</div>
              </div>
            );
          })}
        </div>

        <Link to="/dashboard" className="btn btn-white mt-6 w-full">Kembali ke Dashboard</Link>
      </div>
    </main>
  );
}

function StateShell({ title, kicker, description, children }: { title: string; kicker: string; description: string; children: ReactNode }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center overflow-hidden px-5 py-12"
      style={{
        background:
          "radial-gradient(900px 340px at 8% -18%, #14b8a638, transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 48%, #f7f3ea 100%)",
      }}
    >
      <div className="w-full max-w-[440px] rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-teal-100 bg-teal-50 text-primary">
          <SignalIcon />
        </div>
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          {kicker}
        </div>
        <h1 className="mx-auto mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-[32ch] text-[14px] font-medium leading-relaxed text-stone-500">
          {description}
        </p>
        {children}
      </div>
    </main>
  );
}

function CodeCard({ code }: { code: string }) {
  return (
    <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-stone-50 p-4">
      <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Kode Poll</span>
      <div className="mt-1 text-2xl font-black tracking-[0.2em] text-stone-800">{code}</div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M4 18.5a11.5 11.5 0 0 1 16 0M7.5 15a6.5 6.5 0 0 1 9 0M11.9 19h.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

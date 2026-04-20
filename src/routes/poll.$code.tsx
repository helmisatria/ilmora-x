import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { mockPolls } from "../data";

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

function PollActiveComponent() {
  const { code } = Route.useParams();
  const poll = mockPolls.find((p) => p.code === code);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(poll?.status === "closed");

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="text-center">
          <div className="text-6xl mb-3">🔍</div>
          <h2 className="text-xl font-black mb-2">Poll tidak ditemukan</h2>
          <p className="text-sm text-stone-500 mb-5">Kode {code} tidak valid.</p>
          <Link to="/poll/join" className="btn btn-primary">Coba kode lain</Link>
        </div>
      </div>
    );
  }

  const showResults = poll.status === "closed";
  const isWaiting = poll.status === "draft";

  const letter = (i: number) => String.fromCharCode(65 + i);
  const totalVotes = poll.totalVotes || 1;

  if (isWaiting) {
    return (
      <WaitingState title={poll.title} code={poll.code} />
    );
  }

  if (showResults) {
    return (
      <ResultsState poll={poll} totalVotes={totalVotes} letter={letter} />
    );
  }

  if (submitted) {
    return (
      <SubmittedState title={poll.title} selected={selected !== null ? letter(selected) : ""} />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200 px-4 py-3.5 flex items-center gap-3">
        <Link to="/poll/join" className="icon-btn">←</Link>
        <div className="flex-1 min-w-0">
          <b className="block font-black text-base truncate">{poll.title}</b>
          <span className="text-xs text-stone-400 font-bold">Kode {poll.code} · LIVE</span>
        </div>
        <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide animate-pulse">
          ● Live
        </span>
      </div>

      <div className="max-w-[560px] mx-auto px-4 pt-6 pb-20">
        <h1 className="text-2xl font-black mb-2 text-center">{poll.title}</h1>
        <p className="text-sm text-stone-500 font-semibold mb-6 text-center">
          Pilih jawaban kamu di bawah
        </p>

        <div className="flex flex-col gap-3">
          {poll.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                className={`flex items-center gap-4 w-full text-left px-4 py-4 bg-white border-3 rounded-[var(--radius-lg)] font-semibold text-base cursor-pointer transition-all ${
                  isSelected ? "border-primary bg-teal-50" : "border-stone-200"
                }`}
                style={{ borderBottom: isSelected ? "5px solid var(--color-primary-dark)" : "5px solid var(--color-stone-300)" }}
                onClick={() => setSelected(i)}
              >
                <span className={`w-11 h-11 rounded-[12px] flex items-center justify-center font-black shrink-0 text-lg ${
                  isSelected ? "bg-primary text-white" : "bg-stone-200 text-stone-500"
                }`}>
                  {letter(i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        <button
          className="btn btn-primary btn-lg w-full mt-6"
          disabled={selected === null}
          onClick={() => setSubmitted(true)}
        >
          Kirim Jawaban 🚀
        </button>

        <p className="text-xs text-stone-400 text-center mt-3 font-medium">
          Jawabanmu tidak bisa diubah setelah dikirim
        </p>
      </div>
    </div>
  );
}

function WaitingState({ title, code }: { title: string; code: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4" style={{ animation: "bounce 1s infinite alternate" }}>⏳</div>
        <h1 className="text-2xl font-black mb-2">Menunggu poll dimulai…</h1>
        <p className="text-stone-500 font-semibold mb-5">{title}</p>
        <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-200 border-b-4 border-b-stone-300">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">Kode Poll</span>
          <div className="text-2xl font-black tracking-[0.2em] mt-1">{code}</div>
        </div>
      </div>
    </div>
  );
}

function SubmittedState({ title, selected }: { title: string; selected: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">🔒</div>
        <h1 className="text-2xl font-black mb-2">Jawaban terkirim!</h1>
        <p className="text-stone-500 font-semibold mb-2">{title}</p>
        <div className="inline-block bg-teal-50 border-2 border-teal-200 rounded-[var(--radius-md)] px-4 py-2 mb-5">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">Kamu pilih </span>
          <span className="text-primary font-black text-lg">{selected}</span>
        </div>
        <p className="text-sm text-stone-500">Menunggu hasil dari pembimbing…</p>
        <Link to="/dashboard" className="btn btn-white mt-6">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

function ResultsState({
  poll,
  totalVotes,
  letter,
}: {
  poll: (typeof mockPolls)[number];
  totalVotes: number;
  letter: (i: number) => string;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200 px-4 py-3.5 flex items-center gap-3">
        <Link to="/poll/join" className="icon-btn">←</Link>
        <div className="flex-1 min-w-0">
          <b className="block font-black text-base truncate">{poll.title}</b>
          <span className="text-xs text-stone-400 font-bold">Hasil · {poll.totalVotes} suara</span>
        </div>
        <span className="bg-stone-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
          Selesai
        </span>
      </div>

      <div className="max-w-[560px] mx-auto px-4 pt-6 pb-20">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">📊</div>
          <h1 className="text-2xl font-black">Hasil Poll</h1>
          <p className="text-sm text-stone-500 font-semibold">{poll.totalVotes} suara total</p>
        </div>

        <div className="flex flex-col gap-3">
          {poll.options.map((opt, i) => {
            const letterKey = letter(i);
            const votes = poll.votes[letterKey] || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isTop = Math.max(...Object.values(poll.votes)) === votes;

            return (
              <div key={i} className={`bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 ${
                isTop ? "border-primary border-b-4 border-b-primary-dark" : "border-stone-100 border-b-4 border-b-stone-200"
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-black text-lg ${
                    isTop ? "bg-primary text-white" : "bg-stone-200 text-stone-500"
                  }`}>
                    {letterKey}
                  </span>
                  <span className="flex-1 font-extrabold text-sm">{opt}</span>
                  <span className={`font-black text-lg ${isTop ? "text-primary" : "text-stone-700"}`}>{pct}%</span>
                </div>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isTop ? "bg-primary" : "bg-stone-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-stone-400 font-bold mt-1">{votes} suara</div>
              </div>
            );
          })}
        </div>

        <Link to="/dashboard" className="btn btn-white w-full mt-6">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

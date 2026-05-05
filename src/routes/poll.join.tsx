import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { mockPolls, useApp } from "../data";

export const Route = createFileRoute("/poll/join")({
  head: () => ({
    meta: [
      { title: "Gabung Live Poll — IlmoraX" },
      { name: "description", content: "Gabung live poll dengan kode 6 digit dari pembimbing. Vote A/B/C/D/E secara real-time dan lihat hasil setelah poll ditutup." },
      { property: "og:title", content: "Gabung Live Poll — IlmoraX" },
      { property: "og:description", content: "Gabung live poll dengan kode 6 digit dari pembimbing. Vote secara real-time." },
    ],
  }),
  component: PollJoinComponent,
});

function PollJoinComponent() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);

  const digits = code.replace(/\D/g, "").slice(0, 6);
  const poll = mockPolls.find((item) => item.code === digits);
  const needsName = poll?.accessMode === "open_guest";

  const handleJoin = () => {
    if (digits.length !== 6) {
      setError("Kode harus 6 digit.");
      return;
    }

    if (!poll) {
      setError("Kode poll tidak ditemukan. Coba 123456 atau 789012 untuk demo.");
      return;
    }

    if (poll.status === "closed" && !poll.resultsRevealed) {
      setError("Poll ini sudah ditutup dan hasilnya belum dibuka.");
      return;
    }

    if (needsName && !displayName.trim()) {
      setError("Masukkan nama dulu ya.");
      return;
    }

    navigate({ to: "/poll/$code", params: { code: digits } });
  };

  return (
    <main
      className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef8f6_0%,#fbfaf7_44%,#f7f3ea_100%)]"
      style={{
        background:
          "radial-gradient(900px 340px at 8% -18%, rgba(32,80,114,0.22), transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 48%, #f7f3ea 100%)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-col px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="icon-btn" aria-label="Kembali">
            <ArrowLeftIcon />
          </Link>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Live Poll
            </div>
            <b className="text-base font-bold text-stone-800">Gabung Poll</b>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Kode Pembimbing
            </div>
            <h1 className="mt-2 max-w-[18ch] text-[36px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[48px] lg:text-[56px]">
              Masuk ke sesi vote kelas
            </h1>
            <p className="m-0 mt-4 max-w-[50ch] text-[15px] font-medium leading-relaxed text-stone-500">
              Gunakan kode 6 digit dari pembimbing. Jawaban peserta hanya berupa pilihan A, B, C, D, atau E.
            </p>
          </div>

          <div className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-black uppercase tracking-wide text-stone-400">
              Kode Poll
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={digits}
              onChange={(event) => {
                setCode(event.target.value);
                setError(null);
              }}
              placeholder="000000"
              maxLength={6}
              className="mt-2 w-full rounded-[var(--radius-md)] border-2 border-stone-200 bg-stone-50 py-4 text-center text-4xl font-black tracking-[0.3em] outline-none transition-colors focus:border-primary"
            />

            {needsName && (
              <>
                <label className="mt-5 block text-xs font-black uppercase tracking-wide text-stone-400">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nama kamu"
                  className="mt-2 w-full rounded-[var(--radius-md)] border-2 border-stone-200 px-4 py-3 font-semibold outline-none transition-colors focus:border-primary"
                />
              </>
            )}

            {poll?.accessMode === "login_required" && (
              <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border-2 border-primary-soft bg-primary-tint p-3 text-xs font-bold text-primary-darker">
                <LockIcon />
                <span>Poll ini memakai akunmu: {user.name}</span>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-[var(--radius-md)] border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-coral-dark">
                {error}
              </div>
            )}

            <button className="btn btn-primary mt-5 w-full" onClick={handleJoin} disabled={digits.length !== 6} type="button">
              Gabung Poll
            </button>

            <div className="mt-6 border-t border-stone-100 pt-4">
              <p className="mb-2 text-center text-xs font-medium text-stone-400">Coba demo</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded-full border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-extrabold text-stone-600" onClick={() => setCode("123456")} type="button">
                  123456 aktif
                </button>
                <button className="rounded-full border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-extrabold text-stone-600" onClick={() => setCode("789012")} type="button">
                  789012 hasil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6.8 11h10.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-5.4c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { mockPolls, useApp } from "../data";

export const Route = createFileRoute("/poll/join")({
  component: PollJoinComponent,
});

function PollJoinComponent() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);

  const digits = code.replace(/\D/g, "").slice(0, 6);

  const poll = mockPolls.find((p) => p.code === digits);
  const needsName = poll?.accessMode === "open_guest";

  const handleJoin = () => {
    if (digits.length !== 6) {
      setError("Kode harus 6 digit");
      return;
    }
    if (!poll) {
      setError("Kode poll tidak ditemukan. Coba 123456 atau 789012 untuk demo.");
      return;
    }
    if (poll.status === "closed") {
      setError("Poll ini sudah ditutup.");
      return;
    }
    if (needsName && !displayName.trim()) {
      setError("Masukkan nama dulu ya");
      return;
    }
    navigate({ to: "/poll/$code", params: { code: digits } });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b-2 border-stone-200 px-4 py-3.5 flex items-center gap-3">
        <Link to="/dashboard" className="icon-btn">←</Link>
        <b className="font-black text-base">Gabung Poll</b>
      </div>

      <div className="max-w-[480px] mx-auto px-6 pt-10 pb-20">
        <div className="text-center mb-8">
          <div className="text-[64px] mb-3">📊</div>
          <h1 className="text-2xl font-black mb-2">Masukkan Kode Poll</h1>
          <p className="text-sm text-stone-500 font-semibold">
            Minta kode 6 digit ke pembimbingmu untuk gabung live poll.
          </p>
        </div>

        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
          <label className="block text-xs font-black uppercase tracking-wide text-stone-400 mb-2">
            Kode Poll
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={digits}
            onChange={(e) => { setCode(e.target.value); setError(null); }}
            placeholder="000000"
            maxLength={6}
            className="w-full text-center text-4xl font-black tracking-[0.3em] py-4 rounded-[var(--radius-md)] border-2 border-stone-200 focus:border-primary outline-none bg-stone-50"
          />

          {needsName && (
            <>
              <label className="block text-xs font-black uppercase tracking-wide text-stone-400 mt-5 mb-2">
                Nama Tampilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full px-4 py-3 rounded-[var(--radius-md)] border-2 border-stone-200 focus:border-primary outline-none font-semibold"
              />
            </>
          )}

          {poll?.accessMode === "login_required" && (
            <div className="mt-4 p-3 bg-teal-50 rounded-[var(--radius-md)] border border-teal-200 flex items-center gap-2 text-xs font-bold text-teal-800">
              🔒 Poll ini butuh login — nama pakai akunmu ({user.name})
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-[var(--radius-md)] border border-red-200 text-xs font-bold text-coral-dark">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary w-full mt-5"
            onClick={handleJoin}
            disabled={digits.length !== 6}
          >
            Gabung Poll →
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-stone-400 font-medium mb-2">Coba demo:</p>
          <div className="flex gap-2 justify-center">
            <button
              className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-white border-2 border-stone-200 text-stone-600"
              onClick={() => setCode("123456")}
            >
              123456 (aktif)
            </button>
            <button
              className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-white border-2 border-stone-200 text-stone-600"
              onClick={() => setCode("789012")}
            >
              789012 (ditutup)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

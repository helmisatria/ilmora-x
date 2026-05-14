import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "../data";
import { joinPollSession } from "../lib/poll-functions";
import { getSafeErrorMessage } from "../lib/user-errors";

export const Route = createFileRoute("/poll/join")({
  head: () => ({
    meta: [
      { title: "Gabung Live Poll — IlmoraX" },
      { name: "description", content: "Gabung live poll dengan kode 6 digit dari pembimbing. Vote A/B/C/D/E secara real-time dan lihat hasil setelah round ditutup." },
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
  const [displayName, setDisplayName] = useState(user.email ? user.name : "");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const digits = code.replace(/\D/g, "").slice(0, 6);
  const cleanDisplayName = displayName.trim();

  const handleJoin = async () => {
    if (joining) return;

    if (digits.length !== 6) {
      setError("Kode harus 6 digit.");
      return;
    }

    if (!cleanDisplayName) {
      setError("Isi nama dulu.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const participantToken = getOrCreateParticipantToken(digits);
      const result = await joinPollSession({
        data: {
          code: digits,
          displayName: cleanDisplayName,
          participantToken,
        },
      });

      window.localStorage.setItem(getParticipantStorageKey(digits), result.participantToken);
      await navigate({ to: "/poll/$code", params: { code: digits } });
    } catch (error) {
      setError(getSafeErrorMessage(error, "Gagal gabung Poll."));
    } finally {
      setJoining(false);
    }
  };

  return (
    <main
      className="min-h-[100dvh] overflow-hidden page-enter"
      style={{
        background:
          "radial-gradient(680px 420px at 50% -18%, rgba(32,80,114,0.10), transparent 68%), linear-gradient(180deg, #fbfaf6 0%, #f7f6f0 100%)",
        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full translate-y-0 opacity-100 blur-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="mb-10 flex items-center justify-center gap-3 text-stone-950">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[15px] font-semibold shadow-[inset_0_0_0_1px_rgba(28,25,23,0.08),0_18px_50px_rgba(28,25,23,0.08)]">
              IX
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Poll
            </span>
          </div>

          <div className="mb-7 text-center">
            <h1 className="text-[28px] font-semibold leading-none tracking-normal text-stone-950 sm:text-[36px]">
              Masukkan kode
            </h1>
            <p className="mt-3 text-[13px] font-medium leading-6 text-stone-500">
              6 digit dari pembimbing.
            </p>
          </div>

          <div className="rounded-[2rem] bg-stone-950/[0.035] p-1.5 shadow-[0_34px_90px_rgba(28,25,23,0.10)] ring-1 ring-stone-950/[0.06]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-5">
              <label className="sr-only" htmlFor="poll-code">
                Kode Poll
              </label>
              <div className="rounded-[1.35rem] bg-stone-950/[0.035] p-1.5 ring-1 ring-stone-950/[0.05]">
                <input
                  id="poll-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={digits}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError("");
                  }}
                  placeholder="000000"
                  maxLength={6}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleJoin();
                    }
                  }}
                  className="w-full rounded-[calc(1.35rem-0.375rem)] bg-[#fbfaf6] px-3 py-6 text-center text-[36px] font-semibold tracking-[0.20em] text-stone-950 caret-stone-950 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-stone-300 focus:bg-white focus:shadow-[inset_0_0_0_1px_rgba(28,25,23,0.72),0_0_0_6px_rgba(32,80,114,0.08)] sm:px-5 sm:py-7 sm:text-[48px]"
                />
              </div>

              <label className="sr-only" htmlFor="poll-name">
                Nama
              </label>
              <input
                id="poll-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError("");
                }}
                placeholder="Nama"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleJoin();
                  }
                }}
                className="mt-4 w-full rounded-2xl bg-stone-950/[0.035] px-5 py-4 text-[13px] font-medium text-stone-950 outline-none ring-1 ring-stone-950/[0.05] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-stone-400 focus:bg-white focus:ring-stone-950/70"
              />

              {error && (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-semibold text-coral-dark ring-1 ring-red-200/80">
                  {error}
                </div>
              )}

              <button
                className="group mt-5 inline-flex w-full items-center justify-between rounded-full bg-stone-950 py-2 pl-6 pr-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_50px_rgba(28,25,23,0.16)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-stone-800 active:scale-[0.98]"
                onClick={handleJoin}
                type="button"
              >
                <span>{joining ? "Menghubungkan" : "Gabung"}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                  <ArrowRightIcon />
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 12h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m13 7 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getParticipantStorageKey(code: string) {
  return `ilmorax:poll:${code}:participant-token`;
}

function getOrCreateParticipantToken(code: string) {
  const storedToken = getStoredParticipantToken(code);

  if (storedToken) return storedToken;

  return makeParticipantToken();
}

function getStoredParticipantToken(code: string) {
  if (typeof window === "undefined") return undefined;

  return window.localStorage.getItem(getParticipantStorageKey(code)) ?? undefined;
}

function makeParticipantToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

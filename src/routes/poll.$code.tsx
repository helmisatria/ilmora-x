import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

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

  return (
    <StateShell title="Live Poll belum tersedia" kicker="Backend belum siap" description={`Kode ${code} belum bisa dibaca karena tabel poll belum dibuat.`}>
      <Link to="/poll/join" className="btn btn-primary mt-6 w-full">Kembali</Link>
    </StateShell>
  );
}

function StateShell({ title, kicker, description, children }: { title: string; kicker: string; description: string; children: ReactNode }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center overflow-hidden px-5 py-12"
      style={{
        background:
          "radial-gradient(900px 340px at 8% -18%, rgba(32,80,114,0.22), transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 48%, #f7f3ea 100%)",
      }}
    >
      <div className="w-full max-w-[440px] rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary-soft bg-primary-tint text-primary">
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

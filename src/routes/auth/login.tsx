import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Masuk — IlmoraX" },
      { name: "description", content: "Masuk ke IlmoraX dengan Google. Mulai latihan UKAI, kumpulkan XP, dan naik level bersama ribuan calon apoteker lainnya." },
      { property: "og:title", content: "Masuk — IlmoraX" },
      { property: "og:description", content: "Masuk ke IlmoraX dengan Google. Mulai latihan UKAI dan kumpulkan XP." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 1000);
  };

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(900px 340px at 8% -18%, #14b8a638, transparent 62%), radial-gradient(720px 340px at 94% -12%, #f59e0b20, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 48%, #f7f3ea 100%)",
      }}
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1040px] items-center gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)] lg:px-8">
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            IlmoraX
          </div>
          <h1 className="mt-2 max-w-[18ch] text-[42px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[56px]">
            Belajar farmasi lebih terarah
          </h1>
          <p className="m-0 mt-4 max-w-[52ch] text-[15px] font-medium leading-relaxed text-stone-500">
            Masuk untuk lanjut tryout, pantau XP, kumpulkan lencana, dan ikut live poll kelas.
          </p>
        </section>

        <section className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-teal-100 bg-teal-50 text-primary">
            <ShieldIcon />
          </div>
          <h2 className="mx-auto mt-5 max-w-[18ch] text-2xl font-bold leading-tight tracking-tight text-stone-800">
            Masuk ke akun belajar
          </h2>
          <p className="mx-auto mt-2 max-w-[30ch] text-sm font-medium leading-relaxed text-stone-500">
            Gunakan Google agar progres latihan tetap tersimpan.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-white mt-6 w-full gap-3 py-4 text-base"
            type="button"
          >
            {loading ? <span className="inline-block h-5 w-5 rounded-full border-2 border-stone-300 border-t-primary animate-spin" /> : <GoogleIcon />}
            Masuk dengan Google
          </button>

          <p className="mx-auto mt-5 max-w-[34ch] text-xs font-medium leading-relaxed text-stone-400">
            Dengan masuk, kamu menyetujui Syarat dan Ketentuan IlmoraX.
          </p>
        </section>
      </div>
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.2c0 4.4-2.8 8.3-7 9.8-4.2-1.5-7-5.4-7-9.8V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

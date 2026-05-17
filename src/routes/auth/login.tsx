import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { signInWithGoogle } from "../../lib/auth-client";
import { getPostLoginRedirect } from "../../lib/auth-functions";
import { getLoginCallbackUrl, analyticsSearchSchema, productAnalyticsEvents } from "../../lib/product-analytics";
import { useProductAnalytics } from "../../lib/product-analytics-client";

export const Route = createFileRoute("/auth/login")({
  loader: async () => {
    const redirectTo = await getPostLoginRedirect();

    if (redirectTo !== "/auth/login") {
      throw redirect({ to: redirectTo });
    }

    return null;
  },
  head: () => ({
    meta: [
      { title: "Masuk — IlmoraX" },
      {
        name: "description",
        content:
          "Masuk ke IlmoraX dengan Google. Mulai latihan UKAI, kumpulkan XP, dan naik level bersama ribuan calon apoteker lainnya.",
      },
      { property: "og:title", content: "Masuk — IlmoraX" },
      {
        property: "og:description",
        content: "Masuk ke IlmoraX dengan Google. Mulai latihan UKAI dan kumpulkan XP.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: LoginComponent,
  validateSearch: analyticsSearchSchema,
});

const trustPills = [
  {
    label: "Streak 7",
    tone: "#f59e0b",
    bg: "#fff7ed",
    border: "#fde68a",
    icon: <FireIcon />,
  },
  {
    label: "4,280 XP",
    tone: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: <BoltIcon />,
  },
  {
    label: "Lv.12",
    tone: "#0b2135",
    bg: "#ecfeff",
    border: "#79b7d9",
    icon: <ShieldIconMini />,
  },
] as const;

function LoginComponent() {
  const { intent } = Route.useSearch();
  const analytics = useProductAnalytics();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    if (intent === "tryout_catalog_signup") {
      analytics.capture(productAnalyticsEvents.tryoutCatalogSignupStarted, {
        intent,
        source_path: "/auth/login",
        provider: "google",
      });
    }

    analytics.capture(productAnalyticsEvents.signupStarted, {
      intent,
      source_path: "/auth/login",
      provider: "google",
    });

    const result = await signInWithGoogle(getLoginCallbackUrl(intent));

    if (result.ok && result.redirectTo) {
      window.location.href = result.redirectTo;
      return;
    }

    if (result.ok) return;

    setLoading(false);
    setErrorMessage("Google login belum bisa dimulai. Cek konfigurasi OAuth lokal.");
  };

  return (
    <main
      className="min-h-screen overflow-hidden page-enter"
      style={{
        background:
          "radial-gradient(960px 360px at 8% -18%, rgba(32,80,114,0.20), transparent 62%), radial-gradient(720px 360px at 94% -12%, #0ea5e918, transparent 68%), radial-gradient(640px 320px at 82% 100%, #f59e0b14, transparent 62%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 48%, #f7f3ea 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(15,23,42,0.3) 0.7px, transparent 0.7px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1120px] flex-col px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#f5cf7f] bg-[linear-gradient(180deg,#fff9ea_0%,#eefbf8_100%)] text-[11px] font-semibold text-stone-700 shadow-sm">
              IX
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                IlmoraX
              </div>
            </div>
          </Link>

          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {trustPills.map((pill) => (
              <div
                key={pill.label}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold text-stone-700 shadow-sm"
                style={{ background: pill.bg, borderColor: pill.border }}
              >
                <span style={{ color: pill.tone }}>{pill.icon}</span>
                {pill.label}
              </div>
            ))}
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <section className="w-full max-w-[460px]">
            <div className="rounded-[32px] border border-white/70 bg-white/72 p-2 shadow-[0_28px_80px_rgba(20,184,166,0.10)] backdrop-blur-xl">
              <div className="rounded-[28px] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] px-6 py-7 text-center sm:px-8 sm:py-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border-2 border-primary-soft bg-primary-tint text-primary shadow-sm">
                  <ShieldIcon />
                </div>

                <div className="mt-5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                  Masuk ke IlmoraX
                </div>
                <h1 className="mx-auto mt-2 max-w-[14ch] text-[30px] font-semibold leading-tight tracking-tight text-stone-800 sm:text-[34px]">
                  Masuk ke akun belajar
                </h1>
                <p className="mx-auto mt-3 max-w-[26ch] text-[14px] font-normal leading-relaxed text-stone-500">
                  Simpan progres tryout dan lanjut belajarmu.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2 sm:hidden">
                  {trustPills.map((pill) => (
                    <div
                      key={pill.label}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold text-stone-700 shadow-sm"
                      style={{ background: pill.bg, borderColor: pill.border }}
                    >
                      <span style={{ color: pill.tone }}>{pill.icon}</span>
                      {pill.label}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="btn btn-white mt-6 w-full gap-3 py-4 text-base font-semibold"
                  type="button"
                >
                  {loading ? <LoadingIcon /> : <GoogleIcon />}
                  {loading ? "Menyiapkan akun..." : "Masuk dengan Google"}
                </button>

                {errorMessage && (
                  <p className="mx-auto mt-4 max-w-[32ch] text-center text-xs font-semibold leading-relaxed text-red-500">
                    {errorMessage}
                  </p>
                )}

                <p className="mx-auto mt-5 max-w-[30ch] text-center text-xs font-normal leading-relaxed text-stone-400">
                  Dengan masuk, kamu menyetujui Syarat dan Ketentuan IlmoraX.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function LoadingIcon() {
  return (
    <span
      className="inline-flex h-5 w-5 rounded-full border-2 border-stone-300 border-t-primary animate-spin"
      aria-hidden="true"
    />
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path
        d="M12 3 19 6v5.2c0 4.4-2.8 8.3-7 9.8-4.2-1.5-7-5.4-7-9.8V6l7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIconMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3 18.5 5.8v4.8c0 4-2.6 7.5-6.5 8.8-3.9-1.3-6.5-4.8-6.5-8.8V5.8L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12.2 3.5c.9 2.2.1 3.6-.8 4.8-.9 1.2-1.8 2.3-1.4 4.1.3 1.2 1.3 2.4 3 2.4 2.2 0 3.7-1.9 3.7-4.2 0-1.4-.6-2.6-1.4-3.8-.4 1-1.2 1.9-2.4 2.2.6-1.8.2-3.7-1.7-5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 13.6A5.4 5.4 0 0 0 6 17.2C6 20 8.2 22 11 22c3.6 0 6-2.5 6-5.9 0-1.8-.8-3.5-2.1-4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

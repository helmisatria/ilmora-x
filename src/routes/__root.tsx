import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppProvider } from "../data/provider";
import "../styles/app.css";

const SITE_URL = "https://ilmorax.id";
const SITE_NAME = "IlmoraX";
const DEFAULT_TITLE = "IlmoraX — Belajar Farmasi Jadi Seru!";
const DEFAULT_DESCRIPTION = "Platform latihan UKAI terbaik untuk calon apoteker. Kumpulkan XP, jaga streak harian, dan taklukkan tryout dengan cara yang menyenangkan. 500+ soal UKAI, leaderboard, dan materi lengkap.";
const OG_IMAGE = "/og-image.svg";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#205072" },
      { name: "color-scheme", content: "light" },
      
      // Primary SEO
      { title: DEFAULT_TITLE },
      { name: "description", content: DEFAULT_DESCRIPTION },
      { name: "author", content: SITE_NAME },
      { name: "robots", content: "index, follow" },
      
      // OpenGraph / Facebook
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: DEFAULT_TITLE },
      { property: "og:description", content: DEFAULT_DESCRIPTION },
      { property: "og:image", content: `${SITE_URL}${OG_IMAGE}` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "IlmoraX - Platform Latihan UKAI untuk Calon Apoteker" },
      { property: "og:locale", content: "id_ID" },
      
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: DEFAULT_TITLE },
      { name: "twitter:description", content: DEFAULT_DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}${OG_IMAGE}` },
      { name: "twitter:image:alt", content: "IlmoraX - Platform Latihan UKAI untuk Calon Apoteker" },
      
      // Additional SEO
      { name: "keywords", content: "UKAI, apoteker, farmasi, latihan UKAI, tryout farmasi, simulasi UKAI, belajar farmasi, calon apoteker" },
      { name: "application-name", content: SITE_NAME },
      { name: "apple-mobile-web-app-title", content: SITE_NAME },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" },
      
      // Favicon
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      
      // Canonical
      { rel: "canonical", href: SITE_URL },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef8f6_0%,#fbfaf7_48%,#f7f3ea_100%)]">
      <div
        className="relative flex min-h-screen items-center justify-center px-5 py-16"
        style={{
          background:
            "radial-gradient(900px 340px at 10% -16%, rgba(32,80,114,0.18), transparent 62%), radial-gradient(760px 360px at 92% 0%, rgba(121,183,217,0.2), transparent 66%)",
        }}
      >
        <div className="w-full max-w-[440px] rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary-soft bg-primary-tint text-primary">
            <NotFoundIcon />
          </div>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Tidak ditemukan
          </div>
          <h1 className="mx-auto mt-2 max-w-[16ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800">
            Halaman ini belum tersedia
          </h1>
          <p className="mx-auto mt-3 max-w-[32ch] text-[14px] font-medium leading-relaxed text-stone-500">
            Tautan mungkin berubah atau halaman sudah dipindahkan.
          </p>
          <a href="/dashboard" className="btn btn-primary mt-6 w-full">Kembali ke Dashboard</a>
        </div>
      </div>
    </div>
  ),
});

function RootComponent() {
  return (
    <html lang="id">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.dataset.js = "ready";',
          }}
        />
        <HeadContent />
      </head>
      <body className="antialiased">
        <AppProvider>
          <div id="app" className="view">
            <Outlet />
          </div>
        </AppProvider>
        <Scripts />
        <TanStackRouterDevtools position="bottom-right" />
      </body>
    </html>
  );
}

function NotFoundIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M10.5 10.5h.1M14.5 10.5h.1M9 16c1.8-1.4 4.2-1.4 6 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

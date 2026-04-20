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
      { name: "theme-color", content: "#14b8a6" },
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
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap" },
      
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
    <div className="view p-10 text-center">
      <h1 className="text-[48px] mb-5">🚫</h1>
      <h2 className="text-2xl font-bold mb-3">Halaman Tidak Ditemukan</h2>
      <p className="text-stone-400 mb-6">Maaf, halaman yang kamu cari tidak ada.</p>
      <a href="/" className="btn btn-primary">Kembali ke Beranda</a>
    </div>
  ),
});

function RootComponent() {
  return (
    <html lang="id">
      <head>
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
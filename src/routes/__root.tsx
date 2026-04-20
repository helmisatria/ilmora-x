import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppProvider } from "../data/provider";
import "../styles/app.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "IlmoraX — Belajar Farmasi Jadi Seru!" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap" },
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
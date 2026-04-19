import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingComponent,
});

function OwlMascot() {
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto mb-6 relative">
      <ellipse cx="100" cy="120" rx="65" ry="60" fill="#14b8a6" />
      <ellipse cx="100" cy="120" rx="65" ry="60" fill="rgba(0,0,0,0.1)" transform="translate(0, 4)" />
      <ellipse cx="100" cy="125" rx="45" ry="38" fill="#f0fdfa" />
      <circle cx="100" cy="82" r="48" fill="#f0fdfa" />
      <circle cx="70" cy="78" r="20" fill="#fff" stroke="#44403c" strokeWidth="4" />
      <circle cx="130" cy="78" r="20" fill="#fff" stroke="#44403c" strokeWidth="4" />
      <circle cx="74" cy="78" r="8" fill="#44403c" />
      <circle cx="134" cy="78" r="8" fill="#44403c" />
      <circle cx="76" cy="75" r="3" fill="#fff" />
      <circle cx="136" cy="75" r="3" fill="#fff" />
      <path d="M90 88 L100 100 L110 88 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
      <path d="M45 55 L100 30 L155 55 L100 40 Z" fill="#0ea5e9" />
      <rect x="95" y="20" width="10" height="15" fill="#0ea5e9" />
      <circle cx="100" cy="18" r="6" fill="#f59e0b" stroke="#0ea5e9" strokeWidth="2" />
      <ellipse cx="35" cy="115" rx="15" ry="35" fill="#0d9488" transform="rotate(15, 35, 115)" />
      <ellipse cx="165" cy="115" rx="15" ry="35" fill="#0d9488" transform="rotate(-15, 165, 115)" />
      <ellipse cx="75" cy="175" rx="12" ry="8" fill="#f59e0b" />
      <ellipse cx="125" cy="175" rx="12" ry="8" fill="#f59e0b" />
      <path d="M75 140 Q100 155 125 140" stroke="#ccfbf1" strokeWidth="3" fill="none" />
      <rect x="85" y="145" width="30" height="22" rx="6" fill="#fff" />
      <text x="100" y="162" textAnchor="middle" fontSize="16">💊</text>
    </svg>
  );
}

function LandingComponent() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="flex justify-between items-center py-5 px-6 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 font-black text-2xl text-primary-dark">
          <div className="w-10 h-10 bg-primary rounded-[var(--radius-md)] flex items-center justify-center text-xl border-b-[3px] border-primary-darker">
            🦉
          </div>
          IlmoraX
        </div>
        <Link to="/auth/login" className="btn btn-white btn-sm">
          Masuk
        </Link>
      </nav>

      <section className="max-w-[700px] mx-auto px-6 pt-12 pb-8 text-center">
        <OwlMascot />
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-tight font-black text-stone-800 mb-4 tracking-tight">
          Belajar Farmasi Jadi Seru!
        </h1>
        <p className="text-lg text-stone-500 max-w-[480px] mx-auto mb-8 leading-relaxed font-medium">
          Latihan UKAI dengan cara yang menyenangkan. Kumpulkan XP, jaga streak harianmu,
          dan taklukkan tryout tanpa bosan.
        </p>
        <div className="flex flex-col gap-3 max-w-[320px] mx-auto">
          <Link to="/auth/login" className="btn btn-primary btn-lg">
            🚀 Mulai Belajar
          </Link>
          <Link to="/auth/login" className="btn btn-white">
            Sudah punya akun
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-3.5 bg-white px-5 py-4 rounded-[var(--radius-lg)] shadow-md border-2 border-stone-100">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center text-2xl">
              🔥
            </div>
            <div className="text-left">
              <b className="block text-base font-extrabold text-stone-800">7 hari streak</b>
              <span className="text-[13px] text-stone-400 font-semibold">Jangan sampai putus hari ini!</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex justify-center gap-4 max-w-[600px] mx-auto mt-10 px-6 flex-wrap">
        <div className="bg-white rounded-[var(--radius-lg)] px-6 py-5 text-center shadow-md hover:-translate-y-1 transition-transform border-2 border-stone-100 min-w-[120px]">
          <b className="text-3xl block text-primary font-black">12.5k+</b>
          <span className="text-stone-400 font-bold text-[13px]">Apoteker aktif</span>
        </div>
        <div className="bg-white rounded-[var(--radius-lg)] px-6 py-5 text-center shadow-md hover:-translate-y-1 transition-transform border-2 border-stone-100 min-w-[120px]">
          <b className="text-3xl block text-primary font-black">500+</b>
          <span className="text-stone-400 font-bold text-[13px]">Soal UKAI</span>
        </div>
        <div className="bg-white rounded-[var(--radius-lg)] px-6 py-5 text-center shadow-md hover:-translate-y-1 transition-transform border-2 border-stone-100 min-w-[120px]">
          <b className="text-3xl block text-primary font-black">94%</b>
          <span className="text-stone-400 font-bold text-[13px]">Tingkat lulus</span>
        </div>
      </section>

      <section className="bg-stone-100 mt-14 py-16 px-6">
        <h2 className="text-center text-3xl font-black mb-10 text-stone-800">Pilih paket belajarmu</h2>
        <div className="grid gap-5 max-w-[900px] mx-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>

          <div className="bg-white rounded-[var(--radius-xl)] overflow-hidden text-center pb-7 shadow-md border-2 border-stone-200 hover:-translate-y-1 transition-transform">
            <div className="bg-stone-400 text-white py-4 font-black text-sm uppercase tracking-wider">Gratis</div>
            <div className="text-4xl font-black mt-6 mb-2 text-stone-800">Rp 0</div>
            <ul className="list-none p-0 m-0 mb-6 text-stone-500">
              <li className="py-2 text-sm font-medium">Try-out dasar</li>
              <li className="py-2 text-sm font-medium">Pembahasan singkat</li>
              <li className="py-2 text-sm font-medium">Leaderboard</li>
              <li className="py-2 text-sm font-medium">Lencana & streak</li>
            </ul>
            <Link to="/auth/login" className="btn btn-white">Pilih Gratis</Link>
          </div>

          <div className="bg-white rounded-[var(--radius-xl)] overflow-hidden text-center pb-7 shadow-md border-3 border-primary scale-[1.03] z-10 relative hover:-translate-y-1 transition-transform">
            <div className="bg-primary text-white py-4 font-black text-sm uppercase tracking-wider">Premium</div>
            <div className="text-4xl font-black mt-6 mb-2 text-stone-800">
              Rp49k<span className="text-sm text-stone-400 font-semibold">/bulan</span>
            </div>
            <ul className="list-none p-0 m-0 mb-6 text-stone-500">
              <li className="py-2 text-sm font-medium">Semua tryout premium</li>
              <li className="py-2 text-sm font-medium">Video pembahasan lengkap</li>
              <li className="py-2 text-sm font-medium">Evaluation Dashboard</li>
              <li className="py-2 text-sm font-medium">Materi lengkap</li>
            </ul>
            <Link to="/premium" className="btn btn-primary">Paling Populer</Link>
          </div>

          <div className="bg-white rounded-[var(--radius-xl)] overflow-hidden text-center pb-7 shadow-md border-2 border-stone-200 hover:-translate-y-1 transition-transform">
            <div className="bg-amber text-white py-4 font-black text-sm uppercase tracking-wider">6 Bulan</div>
            <div className="text-4xl font-black mt-6 mb-2 text-stone-800">
              Rp249k<span className="text-sm text-stone-400 font-semibold">/6 bln</span>
            </div>
            <ul className="list-none p-0 m-0 mb-6 text-stone-500">
              <li className="py-2 text-sm font-medium">Semua fitur Premium</li>
              <li className="py-2 text-sm font-medium">Hemat 15%</li>
              <li className="py-2 text-sm font-medium">Satu kali bayar</li>
              <li className="py-2 text-sm font-medium">Tidak auto-renew</li>
            </ul>
            <Link to="/premium" className="btn btn-white">Pilih 6 Bulan</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
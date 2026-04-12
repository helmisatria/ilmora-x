import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingComponent,
});

function LandingComponent() {
  return (
    <>
      <div className="landing-nav">
        <div className="logo">
          <span style={{ fontSize: "28px" }}>🦉</span> Genius Pharmacist
        </div>
        <Link to="/dashboard" className="btn btn-white">
          MASUK
        </Link>
      </div>
      <section className="hero">
        <div className="hero-owl">
          <svg viewBox="0 0 200 200">
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#14b8a6" />
                <stop offset="1" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="115" r="68" fill="url(#g)" />
            <circle cx="100" cy="85" r="52" fill="#f0fdfa" />
            <circle cx="72" cy="80" r="18" fill="#fff" stroke="#334155" strokeWidth="5" />
            <circle cx="128" cy="80" r="18" fill="#fff" stroke="#334155" strokeWidth="5" />
            <circle cx="72" cy="82" r="6" fill="#334155" />
            <circle cx="128" cy="82" r="6" fill="#334155" />
            <path d="M84 100 q16 14 32 0" stroke="#334155" strokeWidth="5" fill="none" strokeLinecap="round" />
            <rect x="62" y="38" width="76" height="18" rx="9" fill="#0ea5e9" />
            <rect x="95" y="20" width="10" height="22" fill="#0ea5e9" />
            <circle cx="100" cy="18" r="7" fill="#f59e0b" stroke="#0ea5e9" strokeWidth="3" />
            <rect x="76" y="142" width="48" height="26" rx="8" fill="#fff" />
            <text x="100" y="160" textAnchor="middle" fontSize="18">
              💊
            </text>
          </svg>
        </div>
        <h1>
          Belajar Farmasi
          <br />
          Jadi Seru!
        </h1>
        <p>Latihan UKAI ala Duolingo. Kumpulkan XP, jaga streak, taklukkan tryout tanpa bosan.</p>
        <div className="hero-ctas">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            MULAI GRATIS
          </Link>
          <Link to="/dashboard" className="btn btn-white">
            SAYA SUDAH PUNYA AKUN
          </Link>
        </div>
        <div className="streak-demo">
          <div className="streak-card">
            <div className="streak-flame">🔥</div>
            <div>
              <b>7 hari streak</b>
              <span>Jangan putus hari ini!</span>
            </div>
          </div>
        </div>
      </section>
      <section className="stats">
        <div className="stat-card">
          <b>12.5k+</b>
          <span>Apoteker</span>
        </div>
        <div className="stat-card">
          <b>500+</b>
          <span>Soal UKAI</span>
        </div>
        <div className="stat-card">
          <b>94%</b>
          <span>Lulus</span>
        </div>
      </section>
      <section className="pricing">
        <h2>Pilih paket belajarmu</h2>
        <div className="tiers">
          <div className="tier">
            <div className="tier-head" style={{ background: "#afafaf" }}>
              GRATIS
            </div>
            <div className="price">Rp 0</div>
            <ul>
              <li>3 hearts / hari</li>
              <li>Tryout terbatas</li>
              <li>Iklan ringan</li>
            </ul>
            <Link to="/dashboard" className="btn btn-white">
              Pilih Gratis
            </Link>
          </div>
          <div className="tier featured">
            <div className="tier-head" style={{ background: "var(--primary)" }}>
              SUPER
            </div>
            <div className="price">
              Rp 49k<span>/bln</span>
            </div>
            <ul>
              <li>Hearts tak terbatas</li>
              <li>Semua tryout</li>
              <li>Penjelasan premium</li>
            </ul>
            <Link to="/dashboard" className="btn btn-primary">
              Paling Populer
            </Link>
          </div>
          <div className="tier">
            <div className="tier-head" style={{ background: "var(--teal)" }}>
              KELUARGA
            </div>
            <div className="price">
              Rp 89k<span>/bln</span>
            </div>
            <ul>
              <li>6 akun</li>
              <li>Semua fitur Super</li>
              <li>Leaderboard keluarga</li>
            </ul>
            <button className="btn btn-white">Pilih Keluarga</button>
          </div>
        </div>
      </section>
    </>
  );
}

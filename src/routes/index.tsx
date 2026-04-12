import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingComponent,
});

// Playful Owl Mascot SVG Component
function OwlMascot() {
  return (
    <svg viewBox="0 0 200 200" className="hero-mascot">
      {/* Body */}
      <ellipse cx="100" cy="120" rx="65" ry="60" fill="#14b8a6" />
      <ellipse cx="100" cy="120" rx="65" ry="60" fill="rgba(0,0,0,0.1)" transform="translate(0, 4)" />
      
      {/* Belly */}
      <ellipse cx="100" cy="125" rx="45" ry="38" fill="#f0fdfa" />
      
      {/* Face area */}
      <circle cx="100" cy="82" r="48" fill="#f0fdfa" />
      
      {/* Eyes - big and playful */}
      <circle cx="70" cy="78" r="20" fill="#fff" stroke="#44403c" strokeWidth="4" />
      <circle cx="130" cy="78" r="20" fill="#fff" stroke="#44403c" strokeWidth="4" />
      
      {/* Pupils - slightly offset for curious look */}
      <circle cx="74" cy="78" r="8" fill="#44403c" />
      <circle cx="134" cy="78" r="8" fill="#44403c" />
      
      {/* Eye shine */}
      <circle cx="76" cy="75" r="3" fill="#fff" />
      <circle cx="136" cy="75" r="3" fill="#fff" />
      
      {/* Beak */}
      <path d="M90 88 L100 100 L110 88 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Graduation cap */}
      <path d="M45 55 L100 30 L155 55 L100 40 Z" fill="#0ea5e9" />
      <rect x="95" y="20" width="10" height="15" fill="#0ea5e9" />
      <circle cx="100" cy="18" r="6" fill="#f59e0b" stroke="#0ea5e9" strokeWidth="2" />
      
      {/* Wings */}
      <ellipse cx="35" cy="115" rx="15" ry="35" fill="#0d9488" transform="rotate(15, 35, 115)" />
      <ellipse cx="165" cy="115" rx="15" ry="35" fill="#0d9488" transform="rotate(-15, 165, 115)" />
      
      {/* Feet */}
      <ellipse cx="75" cy="175" rx="12" ry="8" fill="#f59e0b" />
      <ellipse cx="125" cy="175" rx="12" ry="8" fill="#f59e0b" />
      
      {/* Cute pocket with pill */}
      <path d="M75 140 Q100 155 125 140" stroke="#ccfbf1" strokeWidth="3" fill="none" />
      <rect x="85" y="145" width="30" height="22" rx="6" fill="#fff" />
      <text x="100" y="162" textAnchor="middle" fontSize="16">💊</text>
    </svg>
  );
}

function LandingComponent() {
  return (
    <>
      <div className="landing-nav">
        <div className="logo">
          <div className="logo-icon">🦉</div>
          Genius Pharmacist
        </div>
        <Link to="/dashboard" className="btn btn-white btn-sm">
          Masuk
        </Link>
      </div>
      
      <section className="hero">
        <OwlMascot />
        <h1>Belajar Farmasi Jadi Seru!</h1>
        <p>
          Latihan UKAI dengan cara yang menyenangkan. Kumpulkan XP, jaga streak harianmu, 
          dan taklukkan tryout tanpa bosan.
        </p>
        <div className="hero-ctas">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            🚀 Mulai Belajar
          </Link>
          <Link to="/dashboard" className="btn btn-white">
            Sudah punya akun
          </Link>
        </div>
        
        <div className="streak-demo">
          <div className="streak-card">
            <div className="streak-flame">🔥</div>
            <div>
              <b>7 hari streak</b>
              <span>Jangan sampai putus hari ini!</span>
            </div>
          </div>
        </div>
      </section>
      
      <section className="stats">
        <div className="stat-card">
          <b>12.5k+</b>
          <span>Apoteker aktif</span>
        </div>
        <div className="stat-card">
          <b>500+</b>
          <span>Soal UKAI</span>
        </div>
        <div className="stat-card">
          <b>94%</b>
          <span>Tingkat lulus</span>
        </div>
      </section>
      
      <section className="pricing">
        <h2>Pilih paket belajarmu</h2>
        <div className="tiers">
          <div className="tier">
            <div className="tier-head free">Gratis</div>
            <div className="price">Rp 0</div>
            <ul>
              <li>3 nyawa per hari</li>
              <li>Tryout dasar</li>
              <li>Pembahasan singkat</li>
            </ul>
            <Link to="/dashboard" className="btn btn-white">
              Pilih Gratis
            </Link>
          </div>
          
          <div className="tier featured">
            <div className="tier-head super">Super</div>
            <div className="price">
              Rp49k<span>/bulan</span>
            </div>
            <ul>
              <li>Nyawa tak terbatas</li>
              <li>Semua tryout premium</li>
              <li>Video pembahasan lengkap</li>
            </ul>
            <Link to="/dashboard" className="btn btn-primary">
              Paling Populer
            </Link>
          </div>
          
          <div className="tier">
            <div className="tier-head family">Keluarga</div>
            <div className="price">
              Rp89k<span>/bulan</span>
            </div>
            <ul>
              <li>6 akun anggota</li>
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

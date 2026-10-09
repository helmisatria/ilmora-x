import { Link } from "@tanstack/react-router";
import { businessDetails } from "./landing-content";
import { PublicNavigation } from "./public-navigation";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalDocument = {
  title: string;
  summary: string;
  updatedAt: string;
  sections: LegalSection[];
};

const contactLine = `Hubungi kami di ${businessDetails.email} atau WhatsApp ${businessDetails.contacts[0].phone}.`;

export const privacyPolicy: LegalDocument = {
  title: "Kebijakan Privasi",
  summary:
    "Kebijakan ini menjelaskan data apa yang dikumpulkan IlmoraX, untuk apa data itu dipakai, dan pilihan yang kamu miliki atas datamu.",
  updatedAt: "9 Oktober 2026",
  sections: [
    {
      title: "Siapa kami",
      paragraphs: [
        `IlmoraX adalah platform latihan UKAI yang dikelola oleh ${businessDetails.name}, ${businessDetails.address}. Dalam kebijakan ini, "kami" berarti ${businessDetails.name}, dan "kamu" berarti pengguna IlmoraX.`,
      ],
    },
    {
      title: "Data yang kami kumpulkan",
      items: [
        "Data akun dari Google saat kamu masuk: nama, alamat email, dan foto profil.",
        "Data profil yang kamu isi: nama tampilan, institusi, nomor telepon, dan avatar.",
        "Data belajar: jawaban try-out, nilai, waktu pengerjaan, XP, streak, lencana, peringkat, dan laporan soal yang kamu kirim.",
        "Data transaksi: produk yang dibeli, nominal, kode kupon, serta status dan nomor referensi pembayaran. Data kartu atau rekening diproses langsung oleh Midtrans dan tidak kami simpan.",
        "Data penggunaan: halaman yang dibuka, tombol yang diklik, jenis perangkat dan browser, perkiraan lokasi dari alamat IP, serta rekaman sesi penggunaan situs untuk memperbaiki tampilan dan menemukan error.",
      ],
    },
    {
      title: "Untuk apa data dipakai",
      items: [
        "Menyediakan akun, try-out, pembahasan, dan analisis hasil belajarmu.",
        "Memproses pembayaran dan memberikan akses Premium atau try-out yang kamu beli.",
        "Menampilkan nama tampilan, avatar, XP, dan lencana di leaderboard dan profil publik.",
        "Menjawab pertanyaan dan laporan yang kamu kirim.",
        "Memahami cara IlmoraX dipakai agar kami bisa memperbaiki soal, fitur, dan performa.",
      ],
      paragraphs: ["Kami tidak menjual data pribadimu."],
    },
    {
      title: "Pihak lain yang membantu kami",
      paragraphs: ["Kami hanya membagikan data yang diperlukan kepada penyedia layanan berikut:"],
      items: [
        "Google, untuk proses masuk akun.",
        "Midtrans, untuk memproses pembayaran.",
        "Railway, untuk menjalankan server dan database.",
        "Cloudflare, untuk jaringan dan keamanan situs.",
        "PostHog, untuk analitik penggunaan dan rekaman sesi.",
      ],
    },
    {
      title: "Cookie",
      paragraphs: [
        "Kami memakai cookie agar kamu tetap masuk ke akunmu dan untuk analitik penggunaan. Jika cookie dimatikan di browser, beberapa fitur, termasuk masuk akun, tidak akan berjalan.",
      ],
    },
    {
      title: "Penyimpanan dan keamanan",
      paragraphs: [
        "Data disimpan selama akunmu aktif atau selama dibutuhkan untuk keperluan transaksi dan kewajiban hukum. Kami membatasi akses data hanya untuk tim yang membutuhkannya dan memakai koneksi terenkripsi (HTTPS).",
      ],
    },
    {
      title: "Hak kamu",
      paragraphs: [
        `Sesuai Undang-Undang Pelindungan Data Pribadi, kamu berhak meminta salinan datamu, memperbaiki data yang salah, atau menghapus akunmu. ${contactLine} Kami akan merespons dalam 14 hari kerja.`,
      ],
    },
    {
      title: "Perubahan kebijakan",
      paragraphs: [
        "Jika kebijakan ini berubah, kami akan memperbarui tanggal di halaman ini. Untuk perubahan penting, kami akan memberi tahu lewat situs atau email.",
      ],
    },
  ],
};

export const termsOfService: LegalDocument = {
  title: "Syarat & Ketentuan",
  summary:
    "Dengan membuat akun atau membeli produk di IlmoraX, kamu menyetujui syarat berikut. Mohon dibaca sebelum melakukan pembelian.",
  updatedAt: "9 Oktober 2026",
  sections: [
    {
      title: "Tentang layanan",
      paragraphs: [
        `IlmoraX dikelola oleh ${businessDetails.name} dan menyediakan try-out, pembahasan, dan analisis hasil untuk persiapan UKAI. IlmoraX adalah sarana latihan dan tidak menjamin kelulusan ujian.`,
      ],
    },
    {
      title: "Akun",
      items: [
        "Kamu masuk menggunakan akun Google dan bertanggung jawab menjaga akses akun tersebut.",
        "Satu akun hanya untuk satu orang. Akun tidak boleh dipinjamkan atau dijual.",
        "Isi profil dengan data yang benar. Nama tampilan yang menyinggung atau menyesatkan dapat kami ubah.",
      ],
    },
    {
      title: "Produk dan pembayaran",
      items: [
        "Premium memberi akses ke semua try-out Premium, pembahasan lengkap, dan analisis hasil selama masa aktif paket (1 bulan, 6 bulan, atau 1 tahun).",
        "Paket tidak diperpanjang otomatis. Setelah masa aktif berakhir, kamu bisa membeli paket baru.",
        "Harga tercantum dalam Rupiah dan sudah final saat checkout. Pembayaran diproses oleh Midtrans.",
        "Akses diberikan otomatis setelah pembayaran berhasil dikonfirmasi oleh Midtrans.",
      ],
    },
    {
      title: "Pengembalian dana",
      paragraphs: [
        "Karena produk IlmoraX berupa konten digital yang langsung bisa diakses, pembayaran yang sudah berhasil pada dasarnya tidak dapat dikembalikan. Pengecualian berlaku jika:",
      ],
      items: [
        "kamu terkena tagihan ganda untuk produk yang sama;",
        "pembayaran berhasil tetapi akses tidak diberikan dalam 1×24 jam dan kami tidak dapat memperbaikinya; atau",
        "layanan tidak dapat diakses karena gangguan dari pihak kami dalam waktu lama.",
      ],
    },
    {
      title: "Cara mengajukan pengembalian dana",
      paragraphs: [
        `Ajukan paling lambat 7 hari setelah pembayaran dengan menyertakan email akun dan nomor pesanan. ${contactLine} Jika disetujui, dana dikembalikan melalui metode pembayaran awal atau transfer bank dalam 14 hari kerja.`,
      ],
    },
    {
      title: "Penggunaan konten",
      items: [
        "Soal, pembahasan, dan materi di IlmoraX hanya untuk belajar pribadi.",
        "Dilarang menyalin, merekam, menyebarkan, atau menjual ulang konten IlmoraX tanpa izin tertulis.",
        "Dilarang memakai bot atau cara otomatis lain untuk mengambil konten atau memanipulasi XP dan peringkat.",
      ],
      paragraphs: ["Pelanggaran dapat membuat akun dibatasi atau ditutup tanpa pengembalian dana."],
    },
    {
      title: "Batas tanggung jawab",
      paragraphs: [
        "Kami berusaha menjaga soal dan pembahasan tetap akurat. Jika menemukan kesalahan, laporkan lewat tombol lapor soal. Konten IlmoraX bukan pengganti referensi resmi atau saran profesional kesehatan.",
      ],
    },
    {
      title: "Perubahan dan kontak",
      paragraphs: [
        `Kami dapat memperbarui syarat ini, dan tanggal di halaman ini akan ikut berubah. Syarat ini diatur oleh hukum Republik Indonesia. ${contactLine}`,
      ],
    },
  ],
};

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <main
      className="landing-page min-h-[100dvh] overflow-x-hidden bg-[#f7faf9] text-[#202124]"
      style={{ fontFamily: "'Geist', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <PublicNavigation />
      <article className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-28 sm:px-6">
        <header className="border-b border-[#d8e5e1] pb-8">
          <h1 className="text-[34px] font-black tracking-tight text-stone-900 sm:text-[42px]">{document.title}</h1>
          <p className="mt-4 text-[16px] leading-[1.7] text-stone-600">{document.summary}</p>
          <p className="mt-4 text-[13px] font-semibold text-stone-500">Terakhir diperbarui: {document.updatedAt}</p>
        </header>

        {document.sections.map((section) => (
          <section key={section.title} className="mt-9">
            <h2 className="text-[20px] font-black tracking-tight text-stone-900">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-[15px] leading-[1.75] text-stone-700">{paragraph}</p>
            ))}
            {section.items ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.75] text-stone-700">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </section>
        ))}
      </article>
      <LegalFooter />
    </main>
  );
}

export function LegalLinks() {
  return (
    <>
      <Link to="/kebijakan-privasi" className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">
        Kebijakan privasi
      </Link>
      <Link to="/syarat-ketentuan" className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">
        Syarat & ketentuan
      </Link>
    </>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-[#d8e5e1] px-5 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 text-[13px] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>IlmoraX oleh {businessDetails.name}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/" className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">Beranda</Link>
          <Link to="/tentang-kami" className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">Tentang kami</Link>
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}

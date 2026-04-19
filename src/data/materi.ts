export interface Materi {
  id: number;
  title: string;
  categoryId: string;
  subCategoryId: string;
  isPremium: boolean;
  body: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export const mockMateri: Materi[] = [
  {
    id: 1,
    title: "Farmakologi Dasar",
    categoryId: "farmakologi",
    subCategoryId: "farmakologi-antibiotik",
    isPremium: false,
    body: `## Farmakologi Dasar\n\nFarmakologi adalah cabang ilmu farmasi yang mempelajari interaksi obat dengan organisme hidup. Memahami farmakologi dasar adalah fondasi penting bagi setiap calon apoteker.\n\n### Tujuan Pembelajaran\n- Memahami mekanisme kerja obat\n- Mengetahui interaksi obat\n- Mengenal istilah farmakokinetik\n\n### Konsep Kunci\n\n**Farmakokinetik** mempelajari perjalanan obat di dalam tubuh meliputi:\n1. **Absorpsi** — masuknya obat ke dalam sirkulasi darah\n2. **Distribusi** — penyebaran obat ke jaringan target\n3. **Metabolisme** — perubahan kimia obat di hati\n4. **Ekskresi** — pengeluaran obat dari tubuh\n\n**Farmakodinamik** mempelajari efek obat terhadap tubuh, termasuk reseptor, hubungan dosis-efek, dan terapi obat.`,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 2,
    title: "Kardiovaskular — Hipertensi",
    categoryId: "klinis",
    subCategoryId: "klinis-kardiovaskular-hipertensi",
    isPremium: true,
    body: `## Hipertensi: Diagnosis dan Penatalaksanaan\n\nHipertensi adalah kondisi medis yang ditandai dengan tekanan darah tinggi secara persisten. Merupakan salah satu faktor risiko utama penyakit kardiovaskular.\n\n### Klasifikasi Tekanan Darah\n| Kategori | Sistolik (mmHg) | Diastolik (mmHg) |\n|-----------|-----------------|-----------------|\n| Normal | < 120 | < 80 |\n| Pre-hipertensi | 120-139 | 80-89 |\n| Hipertensi Grade 1 | 140-159 | 90-99 |\n| Hipertensi Grade 2 | ≥ 160 | ≥ 100 |\n\n### Obat Hipertensi\n- **ACE Inhibitor** — Captopril, Enalapril\n- **ARB** — Valsartan, Candesartan\n- **CCB** — Amlodipin, Nifedipin\n- **Diuretik** — Furosemid, HCT\n- **Beta-blocker** — Propranolol, Metoprolol`,
    videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
    pdfUrl: "/files/hipertensi-guide.pdf",
  },
  {
    id: 3,
    title: "Antibiotik dan Resistensi",
    categoryId: "farmakologi",
    subCategoryId: "farmakologi-antibiotik",
    isPremium: false,
    body: `## Antibiotik dan Resistensi\n\nAntibiotik adalah obat yang digunakan untuk mencegah dan mengobati infeksi bakteri. Memahami penggunaan antibiotik yang tepat sangat penting untuk mencegah resistensi.\n\n### Klasifikasi Antibiotik\n\n**Bakterisidal** (membunuh bakteri):\n- Penisilin (Amoksisilin, Ampisilin)\n- Sefalosporin (Ceftriaxon, Cefotaxime)\n- Aminoglikosida (Gentamisin)\n\n**Bakteriostatik** (menghambat pertumbuhan):\n- Tetrasiklin\n- Makrolida (Eritromisin, Azitromisin)\n- Kloramfenikol\n\n### Resistensi Antibiotik\nResistensi terjadi ketika bakteri beradaptasi dan tidak lagi responsif terhadap antibiotik. Pencegahan meliputi:\n1. Gunakan antibiotik hanya jika perlu\n2. Ikuti dosis dan durasi yang ditentukan\n3. Jangan gunakan antibiotik untuk infeksi virus`,
  },
  {
    id: 4,
    title: "Perhitungan Dosis",
    categoryId: "farmasi-klinik",
    subCategoryId: "farmasi-klinik-perhitungan-dosis",
    isPremium: true,
    body: `## Perhitungan Dosis Obat\n\nPerhitungan dosis yang akurat adalah keterampilan fundamental bagi apoteker untuk memastikan keamanan pasien.\n\n### Rumus Dasar\n\n**Dosis berdasarkan berat badan:**\n\`Dosis = Berat badan (kg) × Dosis per kg\`\n\n**Dosis berdasarkan luas permukaan tubuh (BSA):**\n\`Dosis = BSA (m²) × Dosis per m²\`\n\n**BSA anak (rumus Mosteller):**\n\`BSA = √[(Tinggi cm × Berat kg) / 3600]\`\n\n### Contoh Soal\n\nSeorang anak dengan berat 15 kg membutuhkan Amoksisilin 25 mg/kg/hari dibagi dalam 3 dosis.\n\nTotal dosis harian = 15 × 25 = 375 mg\nDosis per kali = 375 / 3 = 125 mg per dosis`,
    videoUrl: "https://www.youtube.com/embed/8j9Sz-NrF3Q",
    pdfUrl: "/files/dosis-calculator.pdf",
  },
];
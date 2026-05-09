export interface Question {
  id: number;
  categoryId: string;
  subCategoryId: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  videoUrl?: string;
  accessLevel: "free" | "premium";
  published: boolean;
}

export interface WrongAnswer {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  explanationPreview?: string;
  videoUrl?: string;
  accessLevel: "free" | "premium";
  user: string;
}

export type TryoutAccessLevel = "free" | "premium" | "platinum";

export interface Tryout {
  id: number;
  title: string;
  icon: string;
  color: string;
  questionCount: number;
  categoryId: string;
  duration: number;
  accessLevel: TryoutAccessLevel;
  productId?: number;
  description: string;
}

export interface Attempt {
  id: number;
  userId: number;
  tryoutId: number;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "auto_submitted";
  startedAt: string;
  deadlineAt: string;
  score: number;
  correct: number;
  total: number;
  xpEarned: number;
  completedAt?: string;
  answers: { questionId: number; selected: number; correct: boolean }[];
  markedQuestionIds: number[];
}

export const tryouts: Tryout[] = [
  { id: 1, title: "UKAI Tryout 1", icon: "🧪", color: "#205072", questionCount: 20, categoryId: "klinis", duration: 30, accessLevel: "free", description: "Simulasi UKAI lengkap dengan soal terkini" },
  { id: 2, title: "Farmakologi Dasar", icon: "💊", color: "#58cc02", questionCount: 25, categoryId: "farmakologi", duration: 40, accessLevel: "free", description: "Soal farmakologi dasar dan khusus" },
  { id: 3, title: "Kardiovaskular", icon: "❤️", color: "#205072", questionCount: 20, categoryId: "klinis", duration: 30, accessLevel: "premium", description: "Soal khusus sistem kardiovaskular" },
  { id: 4, title: "Antibiotik & Antiinfeksi", icon: "🦠", color: "#58cc02", questionCount: 15, categoryId: "farmakologi", duration: 25, accessLevel: "free", description: "Soal antibiotik dan antiinfeksi" },
  { id: 5, title: "Farmasi Klinik Lanjut", icon: "🏥", color: "#0ea5e9", questionCount: 30, categoryId: "farmasi-klinik", duration: 45, accessLevel: "platinum", productId: 101, description: "Soal farmasi klinik tingkat lanjut" },
  { id: 6, title: "Perhitungan Dosis", icon: "🧮", color: "#0ea5e9", questionCount: 20, categoryId: "farmasi-klinik", duration: 35, accessLevel: "platinum", productId: 102, description: "Soal hitung dosis dan farmakokinetik" },
];

export const questionBank: Record<number, Question[]> = {
  1: [
    {
      id: 1, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Pilih obat golongan ACE Inhibitor yang tepat:",
      options: ["Amlodipin", "Captopril", "Propranolol", "Furosemid"],
      correct: 1,
      explanation: "Captopril adalah ACE Inhibitor yang menghambat konversi Angiotensin I menjadi II, menurunkan tekanan darah. Obat ini bekerja dengan menghambat enzim ACE (Angiotensin Converting Enzyme) sehingga mengurangi pembentukan angiotensin II, sebuah zat yang menyebabkan pembuluh darah menyempit.",
      videoUrl: "https://www.youtube.com/embed/6R4DtneE5IY",
      accessLevel: "free", published: true,
    },
    {
      id: 2, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Dosis loading digoxin untuk dewasa adalah:",
      options: ["0.25-0.5 mg", "0.75-1.5 mg", "2-3 mg", "5 mg"],
      correct: 1,
      explanation: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis selama 24 jam pertama, kemudian maintenance 0.125-0.25 mg/hari. Digoxin adalah glikosida jantung yang meningkatkan kontraktilitas miokard dan memperlambat konduksi AV.",
      videoUrl: "https://www.youtube.com/embed/vK1n2sN2lQc",
      accessLevel: "premium", published: true,
    },
    {
      id: 3, categoryId: "farmakologi", subCategoryId: "farmakologi-nsaid",
      question: "Antidotum untuk heparin adalah:",
      options: ["Vitamin K", "Protamin sulfat", "Naloxone", "Flumazenil"],
      correct: 1,
      explanation: "Protamin sulfat adalah antidot spesifik untuk heparin yang mengikat heparin membentuk kompleks inaktif. Setiap 1 mg protamin sulfat dapat menetralkan sekitar 100 unit heparin.",
      accessLevel: "free", published: true,
    },
    {
      id: 4, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Waktu paruh amoksisilin sekitar:",
      options: ["30 menit", "1-1.5 jam", "6-8 jam", "12 jam"],
      correct: 1,
      explanation: "Amoksisilin memiliki waktu paruh (t½) 1-1.5 jam, sehingga diberikan 3x sehari untuk menjaga konsentrasi terapeutik. Amoksisilin adalah antibiotik spektrum luas dari golongan penisilin.",
      accessLevel: "premium", published: true,
    },
    {
      id: 5, categoryId: "klinis", subCategoryId: "klinis-kardiovaskular-hipertensi",
      question: "Obat hipertensi kontraindikasi pada kehamilan:",
      options: ["Metildopa", "Nifedipin", "ACE Inhibitor", "Labetalol"],
      correct: 2,
      explanation: "ACE Inhibitor dan ARB bersifat teratogenik dan sangat kontraindikasi pada kehamilan. Alternatif yang aman adalah metildopa, nifedipin, atau labetalol.",
      videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
      accessLevel: "premium", published: true,
    },
  ],
  2: [
    {
      id: 11, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Mekanisme kerja penisilin adalah:",
      options: ["Menghambat sintesis protein", "Menghambat sintesis dinding sel", "Menghambat replikasi DNA", "Menghambat sintesis folat"],
      correct: 1,
      explanation: "Penisilin menghambat sintesis dinding sel bakteri dengan mengikat protein pengikat penisilin (PBP), sehingga menghambat transpeptidasi dinding sel.",
      accessLevel: "free", published: true,
    },
    {
      id: 12, categoryId: "farmakologi", subCategoryId: "farmakologi-nsaid",
      question: "NSAID yang paling selektif terhadap COX-2:",
      options: ["Ibuprofen", "Celecoxib", "Aspirin", "Diklofenak"],
      correct: 1,
      explanation: "Celecoxib adalah NSAID selektif COX-2 yang menurunkan risiko gangguan gastrointestinal dibandingkan NSAID non-selektif.",
      accessLevel: "free", published: true,
    },
  ],
  3: [
    {
      id: 21, categoryId: "klinis", subCategoryId: "klinis-kardiovaskular-hipertensi",
      question: "Terapi lini pertama hipertensi pada pasien diabetes tanpa kontraindikasi adalah:",
      options: ["ACE Inhibitor", "Antihistamin", "Antasida", "Mukolitik"],
      correct: 0,
      explanation: "ACE Inhibitor sering dipilih pada pasien hipertensi dengan diabetes karena memberi manfaat proteksi ginjal, selama tidak ada kontraindikasi seperti kehamilan atau riwayat angioedema.",
      videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
      accessLevel: "premium", published: true,
    },
    {
      id: 22, categoryId: "klinis", subCategoryId: "klinis-kardiovaskular-gagal-jantung",
      question: "Obat yang perlu dipantau kadar kaliumnya pada pasien gagal jantung adalah:",
      options: ["Spironolakton", "Paracetamol", "Cetirizine", "Omeprazole"],
      correct: 0,
      explanation: "Spironolakton adalah antagonis aldosteron yang dapat meningkatkan risiko hiperkalemia, sehingga kadar kalium dan fungsi ginjal perlu dipantau.",
      accessLevel: "premium", published: true,
    },
  ],
  4: [
    {
      id: 31, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Antibiotik beta-laktam bekerja terutama dengan cara:",
      options: ["Menghambat sintesis dinding sel", "Menghambat reseptor histamin", "Meningkatkan sekresi insulin", "Menghambat pompa proton"],
      correct: 0,
      explanation: "Antibiotik beta-laktam menghambat pembentukan dinding sel bakteri melalui ikatan pada protein pengikat penisilin.",
      accessLevel: "free", published: true,
    },
    {
      id: 32, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Efek samping penting aminoglikosida yang perlu dimonitor adalah:",
      options: ["Ototoksisitas", "Hipoglikemia berat", "Batuk kering", "Retensi cairan"],
      correct: 0,
      explanation: "Aminoglikosida berisiko menyebabkan ototoksisitas dan nefrotoksisitas, sehingga pemantauan fungsi ginjal dan gejala pendengaran penting.",
      accessLevel: "free", published: true,
    },
  ],
  5: [
    {
      id: 41, categoryId: "farmasi-klinik", subCategoryId: "farmasi-klinik-interaksi-obat",
      question: "Kombinasi warfarin dengan NSAID terutama meningkatkan risiko:",
      options: ["Perdarahan", "Hiperglikemia", "Bronkospasme", "Konstipasi"],
      correct: 0,
      explanation: "Warfarin dan NSAID sama-sama dapat meningkatkan risiko perdarahan melalui efek pada koagulasi dan mukosa gastrointestinal.",
      accessLevel: "premium", published: true,
    },
    {
      id: 42, categoryId: "farmasi-klinik", subCategoryId: "farmasi-klinik-perhitungan-dosis",
      question: "Jika dosis 10 mg/kg diberikan pada pasien 50 kg, dosis totalnya adalah:",
      options: ["50 mg", "100 mg", "500 mg", "1000 mg"],
      correct: 2,
      explanation: "Dosis total dihitung dengan mengalikan dosis per kilogram dengan berat badan: 10 mg/kg x 50 kg = 500 mg.",
      accessLevel: "premium", published: true,
    },
  ],
  6: [
    {
      id: 51, categoryId: "farmasi-klinik", subCategoryId: "farmasi-klinik-perhitungan-dosis",
      question: "Pasien membutuhkan 750 mg obat, tersedia tablet 250 mg. Jumlah tablet yang diberikan adalah:",
      options: ["1 tablet", "2 tablet", "3 tablet", "4 tablet"],
      correct: 2,
      explanation: "Jumlah tablet = 750 mg / 250 mg = 3 tablet.",
      accessLevel: "premium", published: true,
    },
    {
      id: 52, categoryId: "farmasi-klinik", subCategoryId: "farmasi-klinik-perhitungan-dosis",
      question: "Larutan 2% b/v berarti terdapat zat aktif sebanyak:",
      options: ["2 g dalam 100 mL", "2 mg dalam 100 mL", "2 g dalam 1 mL", "2 mg dalam 1 L"],
      correct: 0,
      explanation: "Konsentrasi 2% b/v berarti 2 gram zat aktif dalam setiap 100 mL larutan.",
      accessLevel: "premium", published: true,
    },
  ],
};

export const mockAttempts: Attempt[] = [
  {
    id: 1, userId: 1, tryoutId: 1, attemptNumber: 1,
    status: "submitted", startedAt: "2026-04-15T10:00:00+07:00", deadlineAt: "2026-04-15T10:30:00+07:00",
    score: 80, correct: 4, total: 5, xpEarned: 130,
    completedAt: "2026-04-15T10:25:00+07:00",
    answers: [
      { questionId: 1, selected: 1, correct: true },
      { questionId: 2, selected: 0, correct: false },
      { questionId: 3, selected: 1, correct: true },
      { questionId: 4, selected: 1, correct: true },
      { questionId: 5, selected: 2, correct: true },
    ],
    markedQuestionIds: [2],
  },
  {
    id: 2, userId: 1, tryoutId: 2, attemptNumber: 1,
    status: "submitted", startedAt: "2026-04-16T14:00:00+07:00", deadlineAt: "2026-04-16T14:40:00+07:00",
    score: 50, correct: 1, total: 2, xpEarned: 70,
    completedAt: "2026-04-16T14:35:00+07:00",
    answers: [
      { questionId: 11, selected: 1, correct: true },
      { questionId: 12, selected: 0, correct: false },
    ],
    markedQuestionIds: [],
  },
];

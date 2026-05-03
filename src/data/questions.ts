export interface Question {
  id: number;
  categoryId: string;
  subCategoryId: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  videoUrl?: string;
  isPremium: boolean;
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
  isPremium: boolean;
  user: string;
}

export interface Tryout {
  id: number;
  title: string;
  icon: string;
  color: string;
  questionCount: number;
  categoryId: string;
  duration: number;
  isPremium: boolean;
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
  { id: 1, title: "UKAI Tryout 1", icon: "🧪", color: "#205072", questionCount: 20, categoryId: "klinis", duration: 30, isPremium: false, description: "Simulasi UKAI lengkap dengan soal terkini" },
  { id: 2, title: "Farmakologi Dasar", icon: "💊", color: "#58cc02", questionCount: 25, categoryId: "farmakologi", duration: 40, isPremium: false, description: "Soal farmakologi dasar dan khusus" },
  { id: 3, title: "Kardiovaskular", icon: "❤️", color: "#205072", questionCount: 20, categoryId: "klinis", duration: 30, isPremium: false, description: "Soal khusus sistem kardiovaskular" },
  { id: 4, title: "Antibiotik & Antiinfeksi", icon: "🦠", color: "#58cc02", questionCount: 15, categoryId: "farmakologi", duration: 25, isPremium: false, description: "Soal antibiotik dan antiinfeksi" },
  { id: 5, title: "Farmasi Klinik Lanjut", icon: "🏥", color: "#0ea5e9", questionCount: 30, categoryId: "farmasi-klinik", duration: 45, isPremium: true, description: "Soal farmasi klinik tingkat lanjut" },
  { id: 6, title: "Perhitungan Dosis", icon: "🧮", color: "#0ea5e9", questionCount: 20, categoryId: "farmasi-klinik", duration: 35, isPremium: true, description: "Soalhitung dosis dan farmakokinetik" },
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
      isPremium: false, published: true,
    },
    {
      id: 2, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Dosis loading digoxin untuk dewasa adalah:",
      options: ["0.25-0.5 mg", "0.75-1.5 mg", "2-3 mg", "5 mg"],
      correct: 1,
      explanation: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis selama 24 jam pertama, kemudian maintenance 0.125-0.25 mg/hari. Digoxin adalah glikosida jantung yang meningkatkan kontraktilitas miokard dan memperlambat konduksi AV.",
      videoUrl: "https://www.youtube.com/embed/vK1n2sN2lQc",
      isPremium: true, published: true,
    },
    {
      id: 3, categoryId: "farmakologi", subCategoryId: "farmakologi-nsaid",
      question: "Antidotum untuk heparin adalah:",
      options: ["Vitamin K", "Protamin sulfat", "Naloxone", "Flumazenil"],
      correct: 1,
      explanation: "Protamin sulfat adalah antidot spesifik untuk heparin yang mengikat heparin membentuk kompleks inaktif. Setiap 1 mg protamin sulfat dapat menetralkan sekitar 100 unit heparin.",
      isPremium: false, published: true,
    },
    {
      id: 4, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Waktu paruh amoksisilin sekitar:",
      options: ["30 menit", "1-1.5 jam", "6-8 jam", "12 jam"],
      correct: 1,
      explanation: "Amoksisilin memiliki waktu paruh (t½) 1-1.5 jam, sehingga diberikan 3x sehari untuk menjaga konsentrasi terapeutik. Amoksisilin adalah antibiotik spektrum luas dari golongan penisilin.",
      isPremium: true, published: true,
    },
    {
      id: 5, categoryId: "klinis", subCategoryId: "klinis-kardiovaskular-hipertensi",
      question: "Obat hipertensi kontraindikasi pada kehamilan:",
      options: ["Metildopa", "Nifedipin", "ACE Inhibitor", "Labetalol"],
      correct: 2,
      explanation: "ACE Inhibitor dan ARB bersifat teratogenik dan sangat kontraindikasi pada kehamilan. Alternatif yang aman adalah metildopa, nifedipin, atau labetalol.",
      videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
      isPremium: true, published: true,
    },
  ],
  2: [
    {
      id: 11, categoryId: "farmakologi", subCategoryId: "farmakologi-antibiotik",
      question: "Mekanisme kerja penisilin adalah:",
      options: ["Menghambat sintesis protein", "Menghambat sintesis dinding sel", "Menghambat replikasi DNA", "Menghambat sintesis folat"],
      correct: 1,
      explanation: "Penisilin menghambat sintesis dinding sel bakteri dengan mengikat protein pengikat penisilin (PBP), sehingga menghambat transpeptidasi dinding sel.",
      isPremium: false, published: true,
    },
    {
      id: 12, categoryId: "farmakologi", subCategoryId: "farmakologi-nsaid",
      question: "NSAID yang paling selektif terhadap COX-2:",
      options: ["Ibuprofen", "Celecoxib", "Aspirin", "Diklofenak"],
      correct: 1,
      explanation: "Celecoxib adalah NSAID selektif COX-2 yang menurunkan risiko gangguan gastrointestinal dibandingkan NSAID non-selektif.",
      isPremium: false, published: true,
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

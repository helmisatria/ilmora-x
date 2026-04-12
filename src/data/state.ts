// Global app state
export const state = {
  hearts: 5,
  streak: 7,
  gems: 1250,
  xp: 4280,
  level: 12,
  username: "ApotekerMuda",
  test: null as {
    id: number;
    qIndex: number;
    selected: number | null;
    flagged: number[];
    questions: Question[];
    answers: (number | undefined)[];
  } | null,
  lastResults: null as {
    score: number;
    correct: number;
    total: number;
    xpEarn: number;
    wrongs: WrongAnswer[];
  } | null,
  badges: [
    { id: 1, name: "Streak 7 Hari", icon: "🔥", progress: 1, total: 1, unlocked: true },
    { id: 2, name: "Ahli Jantung", icon: "❤️", progress: 3, total: 5, unlocked: false },
    { id: 3, name: "Master Dosis", icon: "🧮", progress: 2, total: 5, unlocked: false },
    { id: 4, name: "Perfect Score", icon: "🎯", progress: 0, total: 1, unlocked: false },
    { id: 5, name: "Night Owl", icon: "🦉", progress: 4, total: 5, unlocked: false },
    { id: 6, name: "Kolektor XP", icon: "⚡", progress: 1, total: 1, unlocked: true },
  ],
};

export interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  videoUrl?: string;
  isPremium?: boolean;
}

export interface WrongAnswer extends Question {
  user: string;
  explanationPreview?: string;
}

export const tryouts = [
  { id: 1, title: "UKAI Tryout 1", icon: "🧪", color: "#1cb0f6", stars: 3, quota: 12, locked: false },
  { id: 2, title: "Farmakologi", icon: "💊", color: "#58cc02", stars: 2, quota: 8, locked: false },
  { id: 3, title: "Kardiovaskular", icon: "❤️", color: "#ff4b4b", stars: 2, quota: 5, locked: false },
  { id: 4, title: "Antibiotik", icon: "🦠", color: "#ce82ff", stars: 0, quota: 3, locked: false },
  { id: 5, title: "Farmasi Klinik", icon: "🏥", color: "#ffc800", stars: 0, quota: 0, locked: true },
  { id: 6, title: "Hitung Dosis", icon: "🧮", color: "#ff9600", stars: 0, quota: 0, locked: true },
];

export const questionBank: Record<number, Question[]> = {
  1: [
    {
      id: 1,
      subject: "FARMAKOLOGI",
      question: "Pilih obat golongan ACE Inhibitor yang tepat:",
      options: ["Amlodipin", "Captopril", "Propranolol", "Furosemid"],
      correct: 1,
      explanation: "Captopril adalah ACE Inhibitor yang menghambat konversi Angiotensin I menjadi II, menurunkan tekanan darah. Obat ini bekerja dengan menghambat enzim ACE (Angiotensin Converting Enzyme) sehingga mengurangi pembentukan angiotensin II, sebuah zat yang menyebabkan pembuluh darah menyempit. Dengan berkurangnya angiotensin II, pembuluh darah akan melebar dan tekanan darah menurun. ACE inhibitor juga mengurangi pengeluaran aldosteron yang dapat menurunkan retensi sodium dan air.",
      videoUrl: "https://www.youtube.com/embed/6R4DtneE5IY",
      isPremium: false,
    },
    {
      id: 2,
      subject: "FARMAKOLOGI",
      question: "Dosis loading digoxin untuk dewasa adalah:",
      options: ["0.25-0.5 mg", "0.75-1.5 mg", "2-3 mg", "5 mg"],
      correct: 1,
      explanation: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis selama 24 jam pertama, kemudian maintenance 0.125-0.25 mg/hari. Digoxin adalah glikosida jantung yang meningkatkan kontraktilitas miokard dan memperlambat konduksi AV. Monitoring level digoxin dalam darah penting untuk menghindari toksisitas.",
      videoUrl: "https://www.youtube.com/embed/vK1n2sN2lQc",
      isPremium: true,
    },
    {
      id: 3,
      subject: "FARMAKOLOGI",
      question: "Antidotum untuk heparin adalah:",
      options: ["Vitamin K", "Protamin sulfat", "Naloxone", "Flumazenil"],
      correct: 1,
      explanation: "Protamin sulfat adalah antidot spesifik untuk heparin yang mengikat heparin membentuk kompleks inaktif. Dosis yang diberikan tergantung pada dosis heparin yang diterima pasien. Setiap 1 mg protamin sulfat dapat menetralkan sekitar 100 unit heparin. Penting untuk tidak melebihi dosis karena protamin juga memiliki efek antikoagulan dalam dosis tinggi.",
      videoUrl: "https://www.youtube.com/embed/6I5h6-cenJo",
      isPremium: false,
    },
    {
      id: 4,
      subject: "FARMAKOLOGI",
      question: "Waktu paruh amoksisilin sekitar:",
      options: ["30 menit", "1-1.5 jam", "6-8 jam", "12 jam"],
      correct: 1,
      explanation: "Amoksisilin memiliki waktu paruh (t½) 1-1.5 jam, sehingga diberikan 3x sehari untuk menjaga konsentrasi terapeutik. Amoksisilin adalah antibiotik spektrum luas dari golongan penisilin yang bekerja dengan menghambat sintesis dinding sel bakteri. Obat ini efektif terhadap bakteri Gram positif dan beberapa Gram negatif, serta tersebar baik ke jaringan dan cairan tubuh.",
      videoUrl: "https://www.youtube.com/embed/8j9Sz-NrF3Q",
      isPremium: true,
    },
    {
      id: 5,
      subject: "KEHAMILAN",
      question: "Obat hipertensi kontraindikasi pada kehamilan:",
      options: ["Metildopa", "Nifedipin", "ACE Inhibitor", "Labetalol"],
      correct: 2,
      explanation: "ACE Inhibitor dan ARB (Angiotensin Receptor Blocker) bersifat teratogenik dan sangat kontraindikasi pada kehamilan. Obat ini dapat menyebabkan gangguan ginjal janin, oligohidramnios, hipoplasia tengkorak, dan kematian janin. Pada trimester kedua dan ketiga, risiko kerusakan ginjal janin meningkat signifikan. Alternatif yang aman adalah metildopa, nifedipin, atau labetalol.",
      videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
      isPremium: true,
    },
  ],
};

export const modules = [
  { title: "Farmakologi Dasar", icon: "💊", color: "var(--primary)", progress: 85, total: 24, done: 20, tag: "Aktif" },
  { title: "Kardiovaskular", icon: "❤️", color: "var(--rose)", progress: 60, total: 18, done: 11, tag: "Lanjut" },
  { title: "Antibiotik & Antiinfeksi", icon: "🦠", color: "var(--violet)", progress: 35, total: 22, done: 8, tag: "Baru" },
  { title: "Farmasi Klinik", icon: "🏥", color: "var(--teal)", progress: 15, total: 30, done: 4, tag: "Mulai" },
  { title: "Perhitungan Dosis", icon: "🧮", color: "var(--amber)", progress: 0, total: 15, done: 0, tag: "Premium", lock: true },
  { title: "Steril & Onkologi", icon: "🔬", color: "var(--slate)", progress: 0, total: 12, done: 0, tag: "Premium", lock: true },
];

export const shopItems = [
  { id: "freeze", name: "Streak Freeze", icon: "❄️", cost: 200, desc: "Amankan streak 1 hari" },
  { id: "heart", name: "Isi Hearts", icon: "❤️", cost: 120, desc: "Penuhkan hearts" },
  { id: "boost", name: "XP Boost", icon: "⚡", cost: 150, desc: "2x XP 30 menit" },
];

export const leaderboardUsers = [
  { r: 1, n: "Dewi Rahayu", xp: 5420, a: "👩‍⚕️", ch: "up" },
  { r: 2, n: "Budi Santoso", xp: 5180, a: "👨‍⚕️", ch: "down" },
  { r: 3, n: "Rani Susanti", xp: 4960, a: "👩", ch: "up" },
  { r: 4, n: "ApotekerMuda", xp: state.xp, a: "🦉", ch: "up", me: true },
  { r: 5, n: "Joko Pratama", xp: 4100, a: "🧑‍🔬", ch: "down" },
  { r: 6, n: "Siti Aminah", xp: 3890, a: "👩‍🎓", ch: "up" },
  { r: 7, n: "Andi Wijaya", xp: 3650, a: "👨", ch: "down" },
];

export interface Poll {
  id: number;
  title: string;
  code: string;
  status: "draft" | "open" | "closed";
  options: string[];
  votes: Record<string, number>;
  totalVotes: number;
  timerMinutes: number | null;
  accessMode: "open_guest" | "login_required";
  createdBy: number;
  createdAt: string;
  closedAt?: string;
}

export const mockPolls: Poll[] = [
  {
    id: 1,
    title: "Quiz Farmakologi",
    code: "123456",
    status: "open",
    options: ["Inhibisi enzim ACE", "Blokade reseptor beta", "Vasodilatasi langsung", "Inhibisi kanal kalsium", "Diuresis osmotik"],
    votes: { "A": 12, "B": 8, "C": 5, "D": 15, "E": 3 },
    totalVotes: 43,
    timerMinutes: 5,
    accessMode: "open_guest",
    createdBy: 99,
    createdAt: "2026-04-20T10:00:00+07:00",
  },
  {
    id: 2,
    title: "Review Klinis",
    code: "789012",
    status: "closed",
    options: ["Hipertensi esensial", "Hipertensi sekunder", "Hipertensi maligna", "Pre-eklamsia", "Krisis hipertensi"],
    votes: { "A": 25, "B": 18, "C": 7, "D": 12, "E": 5 },
    totalVotes: 67,
    timerMinutes: null,
    accessMode: "login_required",
    createdBy: 99,
    createdAt: "2026-04-18T14:00:00+07:00",
    closedAt: "2026-04-18T14:30:00+07:00",
  },
];
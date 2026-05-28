export const pollPlanSheetHeaders = [
  "label",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_option",
  "timer_seconds",
] as const;

type PollOption = "A" | "B" | "C" | "D" | "E";

type PollRoundWithOptions = {
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
};

type PollPlanWorkbookRow = {
  label?: string;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_option?: string;
  timer_seconds?: string | number;
};

export type PollRoundPlanImportItem = {
  label: string | undefined;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string | undefined;
  correctOption: PollOption;
  timerSeconds: number | null;
};

export function makeDefaultPollSessionTitle(): string {
  return `Kelas ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date())}`;
}

export function getStudentPollUrl(code: string): string {
  if (typeof window === "undefined") return `/poll/${code}`;

  return `${window.location.origin}/poll/${code}`;
}

export function formatPollDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function formatPollCountdown(totalSeconds: number): string {
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getPollRoundOptionText(round: PollRoundWithOptions, option: PollOption): string | null {
  if (option === "A") return round.optionA;
  if (option === "B") return round.optionB;
  if (option === "C") return round.optionC;
  if (option === "D") return round.optionD;
  return round.optionE;
}

export function makeSamplePollPlanRows(): Array<Record<string, string | number>> {
  return [
    {
      label: "Review Farmakologi 1",
      question_text: "Obat antihipertensi yang bekerja menghambat ACE adalah...",
      option_a: "Captopril",
      option_b: "Amlodipine",
      option_c: "Furosemide",
      option_d: "Propranolol",
      option_e: "",
      correct_option: "A",
      timer_seconds: 60,
    },
    {
      label: "Review Farmakologi 2",
      question_text: "Efek samping khas aminoglikosida yang perlu dimonitor adalah...",
      option_a: "Hipoglikemia",
      option_b: "Ototoksisitas",
      option_c: "Batuk kering",
      option_d: "Hiperpigmentasi",
      option_e: "",
      correct_option: "B",
      timer_seconds: "",
    },
  ];
}

export function makePollPlanSheet(
  XLSX: typeof import("xlsx"),
  headers: readonly string[],
  rows: Array<Record<string, string | number | null | undefined>>,
): import("xlsx").WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(headers)]);

  if (rows.length === 0) return sheet;

  XLSX.utils.sheet_add_json(sheet, rows, {
    header: Array.from(headers),
    skipHeader: true,
    origin: "A2",
  });

  return sheet;
}

export function savePollPlanWorkbook(
  XLSX: typeof import("xlsx"),
  workbook: import("xlsx").WorkBook,
  fileName: string,
): void {
  const workbookBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readPollPlanWorkbook(file: File): Promise<PollRoundPlanImportItem[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets.rounds ?? workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error("Workbook must include a rounds sheet.");
  }

  const rows = XLSX.utils.sheet_to_json<PollPlanWorkbookRow>(sheet, { defval: "" });

  if (rows.length === 0) {
    throw new Error("The rounds sheet must include at least one row.");
  }

  return rows.map((row, index) => toPollPlanImportItem(row, index + 2));
}

export function formatPollPlanTimestamp(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}

function toPollPlanImportItem(row: PollPlanWorkbookRow, rowNumber: number): PollRoundPlanImportItem {
  const item = {
    label: optionalTextValue(row.label),
    questionText: textValue(row.question_text),
    optionA: textValue(row.option_a),
    optionB: textValue(row.option_b),
    optionC: textValue(row.option_c),
    optionD: textValue(row.option_d),
    optionE: optionalTextValue(row.option_e),
    correctOption: normalizePollOption(row.correct_option, rowNumber),
    timerSeconds: optionalNumberValue(row.timer_seconds, rowNumber),
  };

  if (!item.questionText) throw new Error(`Row ${rowNumber}: question_text is required.`);
  if (!item.optionA) throw new Error(`Row ${rowNumber}: option_a is required.`);
  if (!item.optionB) throw new Error(`Row ${rowNumber}: option_b is required.`);
  if (!item.optionC) throw new Error(`Row ${rowNumber}: option_c is required.`);
  if (!item.optionD) throw new Error(`Row ${rowNumber}: option_d is required.`);
  if (item.correctOption === "E" && !item.optionE) {
    throw new Error(`Row ${rowNumber}: option_e is required when correct_option is E.`);
  }

  return item;
}

function textValue(value: unknown): string {
  return String(value ?? "").trim();
}

function optionalTextValue(value: unknown): string | undefined {
  const text = textValue(value);
  if (!text) return undefined;
  return text;
}

function optionalNumberValue(value: unknown, rowNumber: number): number | null {
  const text = textValue(value);
  if (!text) return null;

  const number = Number(text);
  if (!Number.isInteger(number) || number < 5 || number > 600) {
    throw new Error(`Row ${rowNumber}: timer_seconds must be blank or an integer from 5 to 600.`);
  }

  return number;
}

function normalizePollOption(value: unknown, rowNumber: number): PollOption {
  const option = textValue(value).toUpperCase();

  if (option === "A" || option === "B" || option === "C" || option === "D" || option === "E") {
    return option;
  }

  throw new Error(`Row ${rowNumber}: correct_option must be A, B, C, D, or E.`);
}

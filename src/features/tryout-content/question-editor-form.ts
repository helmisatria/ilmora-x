export type AccessLevel = "free" | "premium";
export type ContentStatus = "draft" | "published" | "unpublished";
export type CorrectOption = "A" | "B" | "C" | "D" | "E";
export type OptionField = `option${CorrectOption}`;

export const correctOptions: CorrectOption[] = ["A", "B", "C", "D", "E"];

// Shared by the try-out question editor and the bank soal editor.
// sortOrder and status only exist where the page lets the admin set them.
export type QuestionEditorValues = {
  categoryId: string;
  subCategoryId: string;
  topicId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: CorrectOption;
  explanation: string;
  videoUrl: string;
  pictureUrl: string;
  accessLevel: AccessLevel;
  sortOrder?: string;
  status?: ContentStatus;
};

export type QuestionField = keyof QuestionEditorValues;
export type QuestionFieldErrors = Partial<Record<QuestionField, string>>;

// Visual order in the editor, used to focus the first invalid field.
export const questionFieldOrder: QuestionField[] = [
  "questionText",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "optionE",
  "explanation",
  "categoryId",
  "subCategoryId",
  "topicId",
  "sortOrder",
];

export type QuestionValidation = {
  errors: QuestionFieldErrors;
  // One sentence for the single alert in the save bar.
  summary: string;
  firstInvalidField: QuestionField | null;
};

export function validateQuestion(values: QuestionEditorValues): QuestionValidation {
  const errors: QuestionFieldErrors = {};

  if (values.sortOrder !== undefined && !isValidSortOrder(values.sortOrder)) {
    errors.sortOrder = "Isi angka 1 sampai 1000.";
  }

  if (!values.categoryId) errors.categoryId = "Pilih kategori.";
  if (!values.subCategoryId) errors.subCategoryId = "Pilih subkategori.";
  if (!values.topicId) errors.topicId = "Pilih topik.";
  if (!values.questionText.trim()) errors.questionText = "Teks soal wajib diisi.";
  if (!values.explanation.trim()) errors.explanation = "Pembahasan wajib diisi.";

  for (const option of ["A", "B", "C", "D"] as const) {
    if (!values[`option${option}`].trim()) errors[`option${option}`] = `Pilihan ${option} wajib diisi.`;
  }

  if (values.correctOption === "E" && !values.optionE.trim()) {
    errors.optionE = "Isi pilihan E atau ganti kunci jawaban.";
  }

  return {
    errors,
    summary: getSummary(errors),
    firstInvalidField: questionFieldOrder.find((field) => errors[field]) ?? null,
  };
}

// Keeps the wording admins already know, from the most to the least blocking problem.
function getSummary(errors: QuestionFieldErrors) {
  if (errors.sortOrder) return "Isi nomor urut dengan angka 1 sampai 1000.";
  if (errors.categoryId || errors.subCategoryId || errors.topicId) return "Pilih kategori, subkategori, dan topik.";
  if (errors.questionText || errors.explanation) return "Isi teks soal dan pembahasan.";
  if (errors.optionA || errors.optionB || errors.optionC || errors.optionD) return "Isi pilihan jawaban A, B, C, dan D.";
  if (errors.optionE) return "Isi pilihan E karena kunci jawaban adalah E.";

  return "";
}

function isValidSortOrder(value: string) {
  if (!/^\d+$/.test(value.trim())) return false;

  const sortOrder = Number(value);
  return sortOrder >= 1 && sortOrder <= 1000;
}

// Server errors that point at one field are shown next to that field too.
export function getServerFieldError(message: string): QuestionFieldErrors {
  if (/nomor urut/i.test(message)) return { sortOrder: "Nomor ini sudah dipakai soal lain." };

  return {};
}

export function isSameQuestion(left: QuestionEditorValues, right: QuestionEditorValues) {
  const fields = new Set([...Object.keys(left), ...Object.keys(right)]) as Set<QuestionField>;

  for (const field of fields) {
    if ((left[field] ?? "") !== (right[field] ?? "")) return false;
  }

  return true;
}

// Values for the next question after "Simpan & tambah lagi": keep where the
// question belongs and how it is published, clear what the admin types.
export function makeNextQuestion(saved: QuestionEditorValues, nextSortOrder?: number): QuestionEditorValues {
  return {
    ...saved,
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    optionE: "",
    correctOption: "A",
    explanation: "",
    videoUrl: "",
    pictureUrl: "",
    sortOrder: nextSortOrder === undefined ? saved.sortOrder : String(nextSortOrder),
  };
}

export function getNextSortOrder(sortOrders: number[]) {
  return Math.max(0, ...sortOrders) + 1;
}

export type PastedQuestion = {
  questionText?: string;
  options: Partial<Record<OptionField, string>>;
  correctOption?: CorrectOption;
};

const optionLinePattern = /^\(?([A-Ea-e])[.)]\s*(.*)$/;
const answerLinePattern = /^(?:kunci(?:\s+jawaban)?|jawaban(?:\s+benar)?|answer)\s*[:=]\s*\(?([A-Ea-e])\)?\.?\s*$/i;

// Reads a question copied from a document, for example:
//   Obat pilihan untuk ...?
//   A. Amoksisilin
//   B. Penisilin
//   Kunci: B
// Returns null when the text does not contain at least options A to D.
export function parsePastedQuestion(text: string): PastedQuestion | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const questionLines: string[] = [];
  const options: Partial<Record<OptionField, string>> = {};
  let correctOption: CorrectOption | undefined;
  let currentOption: OptionField | null = null;

  for (const line of lines) {
    const answerMatch = line.match(answerLinePattern);
    if (answerMatch) {
      correctOption = answerMatch[1].toUpperCase() as CorrectOption;
      currentOption = null;
      continue;
    }

    const optionMatch = line.match(optionLinePattern);
    if (optionMatch && optionMatch[2]) {
      currentOption = `option${optionMatch[1].toUpperCase() as CorrectOption}`;
      options[currentOption] = optionMatch[2].trim();
      continue;
    }

    // A wrapped option line continues the option above it.
    if (currentOption) {
      options[currentOption] = `${options[currentOption]} ${line}`;
      continue;
    }

    questionLines.push(line);
  }

  if (!options.optionA || !options.optionB || !options.optionC || !options.optionD) return null;

  return {
    questionText: questionLines.length > 0 ? questionLines.join("\n") : undefined,
    options,
    correctOption,
  };
}

// Reads several answer options pasted into one option field, one per line.
// Labels such as "A." are optional. Filling starts at the field pasted into.
export function parsePastedOptions(text: string, startAt: CorrectOption): Partial<Record<OptionField, string>> | null {
  const labelled = parsePastedQuestion(text);
  if (labelled && !labelled.questionText) return labelled.options;

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const startIndex = correctOptions.indexOf(startAt);
  const available = correctOptions.slice(startIndex);
  if (lines.length > available.length) return null;

  const options: Partial<Record<OptionField, string>> = {};
  lines.forEach((line, index) => {
    const match = line.match(optionLinePattern);
    options[`option${available[index]}`] = match?.[2] ? match[2].trim() : line;
  });

  return options;
}

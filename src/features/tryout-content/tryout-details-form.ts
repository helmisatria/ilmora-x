import type { AccessLevel } from "./question-editor-form";

export type TryoutDetailsValues = {
  title: string;
  description: string;
  icon: string;
  categoryId: string;
  durationMinutes: string;
  accessLevel: AccessLevel;
};

export type TryoutDetailsField = keyof TryoutDetailsValues;
export type TryoutDetailsErrors = Partial<Record<TryoutDetailsField, string>>;

// Same limits as the server schema in admin-tryout-functions.ts.
export const tryoutTitleMaxLength = 160;
export const tryoutDescriptionMaxLength = 500;

const fieldOrder: TryoutDetailsField[] = ["title", "description", "categoryId", "durationMinutes"];

export function validateTryoutDetails(values: TryoutDetailsValues) {
  const errors: TryoutDetailsErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (!title) errors.title = "Judul wajib diisi.";
  if (title.length > tryoutTitleMaxLength) errors.title = `Judul maksimal ${tryoutTitleMaxLength} karakter.`;
  if (!description) errors.description = "Deskripsi wajib diisi.";
  if (description.length > tryoutDescriptionMaxLength) errors.description = `Deskripsi maksimal ${tryoutDescriptionMaxLength} karakter.`;
  if (!values.categoryId) errors.categoryId = "Pilih kategori.";
  if (!isValidDuration(values.durationMinutes)) errors.durationMinutes = "Isi angka 1 sampai 300.";

  return {
    errors,
    summary: getSummary(errors),
    firstInvalidField: fieldOrder.find((field) => errors[field]) ?? null,
  };
}

function getSummary(errors: TryoutDetailsErrors) {
  if (errors.title || errors.description || errors.categoryId) return "Isi judul, deskripsi, dan kategori.";
  if (errors.durationMinutes) return "Isi durasi dengan angka bulat 1 sampai 300 menit.";

  return "";
}

function isValidDuration(value: string) {
  if (!/^\d+$/.test(value.trim())) return false;

  const minutes = Number(value);
  return minutes >= 1 && minutes <= 300;
}

export function getTryoutServerFieldError(message: string): TryoutDetailsErrors {
  if (/judul.*sudah dipakai/i.test(message)) return { title: "Judul ini sudah dipakai try-out lain." };

  return {};
}

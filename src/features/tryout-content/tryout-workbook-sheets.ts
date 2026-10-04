import type {
  CategoryOption,
  TryoutWorkbookQuestion,
  TryoutWorkbookTryout,
} from "./tryout-content-types";

type TryoutWorkbookSheetData = {
  tryout: TryoutWorkbookTryout & { id: string; updatedAt: string };
  questions: Array<TryoutWorkbookQuestion & { questionId?: string }>;
};

const tryoutSheetHeaders = [
  "title",
  "description",
  "category_id",
  "category_name",
  "duration_minutes",
  "access_level",
  "status",
] as const;

export const questionSheetHeaders = [
  "question_id",
  "sort_order",
  "category_id",
  "category_name",
  "sub_category_id",
  "sub_category_name",
  "topic_id",
  "topic_name",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_option",
  "explanation",
  "video_url",
  "picture_url",
  "access_level",
  "status",
] as const;

const guidelineSheetHeaders = [
  "sheet",
  "column",
  "required",
  "possible_values",
  "notes",
] as const;

function makeSampleTryoutRow() {
  return {
    title: "Contoh try-out UKAI",
    description: "Latihan soal UKAI. Ganti deskripsi ini dengan penjelasan untuk peserta.",
    category_id: "",
    category_name: "Farmakologi",
    duration_minutes: 30,
    access_level: "free",
    status: "draft",
  };
}

function makeSampleQuestionRows() {
  return [
    {
      question_id: "",
      sort_order: 1,
      category_id: "",
      category_name: "Farmakologi",
      sub_category_id: "",
      sub_category_name: "Antibiotik",
      topic_id: "",
      topic_name: "Antibiotik",
      question_text: "Mekanisme kerja penisilin adalah:",
      option_a: "Menghambat sintesis protein",
      option_b: "Menghambat sintesis dinding sel",
      option_c: "Menghambat replikasi DNA",
      option_d: "Menghambat sintesis folat",
      option_e: "",
      correct_option: "B",
      explanation: "Penisilin menghambat sintesis dinding sel bakteri dengan mengikat protein pengikat penisilin.",
      video_url: "",
      access_level: "free",
      status: "draft",
    },
    {
      question_id: "",
      sort_order: 2,
      category_id: "",
      category_name: "Farmakologi",
      sub_category_id: "",
      sub_category_name: "NSAID",
      topic_id: "",
      topic_name: "NSAID",
      question_text: "NSAID yang paling selektif terhadap COX-2:",
      option_a: "Ibuprofen",
      option_b: "Celecoxib",
      option_c: "Aspirin",
      option_d: "Diklofenak",
      option_e: "",
      correct_option: "B",
      explanation: "Celecoxib adalah NSAID selektif COX-2 yang menurunkan risiko gangguan gastrointestinal.",
      video_url: "",
      access_level: "free",
      status: "draft",
    },
  ];
}

function makeGuidelineRows(categories: CategoryOption[]) {
  return [
    ...makeTryoutGuidelineRows(categories),
    ...makeQuestionGuidelineRows(categories),
    ...makeCategoryGuidelineRows(categories),
  ];
}

export function makeSampleWorkbook(XLSX: typeof import("xlsx"), categories: CategoryOption[]) {
  return makeWorkbookFromRows(XLSX, {
    tryoutRows: [makeSampleTryoutRow()],
    questionRows: makeSampleQuestionRows(),
    categories,
  });
}

export function makeTryoutWorkbook(
  XLSX: typeof import("xlsx"),
  data: TryoutWorkbookSheetData,
  categories: CategoryOption[],
) {
  const workbook = makeWorkbookFromRows(XLSX, {
    tryoutRows: [toTryoutSheetRow({ ...data.tryout, categoryName: categories.find((item) => item.id === data.tryout.categoryId)?.name ?? data.tryout.categoryName })],
    questionRows: data.questions.map((question) => {
      const category = categories.find((item) => item.id === question.categoryId);
      const subCategory = category?.subCategories?.find((item) => item.id === question.subCategoryId);
      return toQuestionSheetRow({ ...question, categoryName: category?.name ?? question.categoryName, subCategoryName: subCategory?.name ?? question.subCategoryName,
        topicName: subCategory?.topics?.find((item) => item.id === question.topicId)?.name ?? question.topicName });
    }),
    categories,
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    version: 1, tryoutId: data.tryout.id, updatedAt: data.tryout.updatedAt,
  }]), "_ilmorax");
  // Keep the export's source revision away from the editable content sheets.
  workbook.Workbook = { Sheets: workbook.SheetNames.map((name) => ({ name, Hidden: name === "_ilmorax" ? 1 : 0 })) };
  return workbook;
}

export function makeSampleWorkbookFileName(date: Date) {
  return `ilmorax-tryout-sample-${formatTimestamp(date)}.xlsx`;
}

export function makeTryoutWorkbookFileName(slug: string | null | undefined, date: Date) {
  return `${slug || "tryout"}-workbook-${formatTimestamp(date)}.xlsx`;
}

function makeSheet(
  XLSX: typeof import("xlsx"),
  headers: readonly string[],
  rows: Record<string, string | number | null | undefined>[],
) {
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(headers)]);

  if (rows.length === 0) {
    return sheet;
  }

  XLSX.utils.sheet_add_json(sheet, rows, {
    header: Array.from(headers),
    skipHeader: true,
    origin: "A2",
  });

  sheet["!cols"] = headers.map((header) => ({
    wch: getColumnWidth(header, rows),
  }));

  return sheet;
}

export function saveWorkbook(XLSX: typeof import("xlsx"), workbook: import("xlsx").WorkBook, fileName: string) {
  const workbookBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveWorkbookBlob(blob, fileName);
}

export function saveWorkbookBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toTryoutSheetRow(tryout: TryoutWorkbookTryout) {
  return {
    title: tryout.title,
    description: tryout.description,
    category_id: tryout.categoryId,
    category_name: tryout.categoryName ?? "",
    duration_minutes: tryout.durationMinutes,
    access_level: tryout.accessLevel,
    status: tryout.status,
  };
}

function toQuestionSheetRow(question: TryoutWorkbookQuestion & { questionId?: string }) {
  return {
    question_id: question.questionId ?? "",
    sort_order: question.sortOrder,
    category_id: question.categoryId,
    category_name: question.categoryName ?? "",
    sub_category_id: question.subCategoryId,
    sub_category_name: question.subCategoryName ?? "",
    topic_id: question.topicId,
    topic_name: question.topicName ?? "",
    question_text: question.questionText,
    option_a: question.optionA,
    option_b: question.optionB,
    option_c: question.optionC,
    option_d: question.optionD,
    option_e: question.optionE ?? "",
    correct_option: question.correctOption,
    explanation: question.explanation,
    video_url: question.videoUrl ?? "",
    picture_url: question.pictureUrl ?? "",
    access_level: question.accessLevel,
    status: question.status,
  };
}

function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}

function makeWorkbookFromRows(
  XLSX: typeof import("xlsx"),
  {
    tryoutRows,
    questionRows,
    categories,
  }: {
    tryoutRows: Record<string, string | number | null | undefined>[];
    questionRows: Record<string, string | number | null | undefined>[];
    categories: CategoryOption[];
  },
) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, makeSheet(XLSX, ["langkah", "petunjuk"], [
    { langkah: "1. Isi try-out", petunjuk: "Buka lembar tryout. Ganti baris 2 dengan judul, deskripsi, kategori, dan durasi. Isi hanya satu baris." },
    { langkah: "2. Isi soal", petunjuk: "Buka lembar questions. Ganti seluruh soal contoh. Satu baris untuk satu soal. Nomor urut tidak boleh sama. Maksimal 500 soal." },
    { langkah: "3. Isi nama", petunjuk: "Untuk soal baru, kosongkan kolom ID dan isi category_name, sub_category_name, serta topic_name. Nama baru akan ditambahkan saat Anda menyimpan Excel." },
    { langkah: "4. Isi jawaban", petunjuk: "Isi pilihan A sampai D. Pilihan E boleh kosong. Isi correct_option dengan huruf jawaban benar, lalu isi explanation dengan pembahasan." },
    { langkah: "5. Atur akses", petunjuk: "Isi access_level dengan free untuk gratis atau premium untuk berbayar. Pada soal, akses ini mengatur pembahasan dan video." },
    { langkah: "6. Simpan draf", petunjuk: "Isi status dengan draft saat menyiapkan isi. published berarti tayang. unpublished berarti disembunyikan. Peserta hanya mengerjakan soal published." },
    { langkah: "7. Periksa unggahan", petunjuk: "Simpan sebagai .xlsx, unggah ke admin, lalu periksa pratinjau. Jika ada kesalahan, perbaiki baris yang disebutkan dan unggah ulang. Belum ada perubahan sebelum Anda menekan Simpan." },
    { langkah: "Mengubah try-out", petunjuk: "Unduh Excel terbaru dari try-out yang ingin diubah. Pertahankan question_id untuk soal lama. Simpan isi Excel mengganti seluruh daftar soal try-out. Soal yang barisnya dihapus akan keluar dari try-out." },
    { langkah: "Gambar dan video", petunjuk: "Tautan video_url dan picture_url boleh kosong. Gunakan tautan lengkap https://. Pertahankan tautan gambar pada hasil unduhan agar gambar tetap ada." },
    { langkah: "Sebelum tayang", petunjuk: "Periksa kunci jawaban, pembahasan, urutan, akses, dan jumlah soal published. Try-out published wajib punya minimal satu soal published." },
    { langkah: "Nama kolom", petunjuk: "Jangan mengubah nama lembar tryout atau questions dan nama kolom pada baris 1. Lihat lembar guideline untuk arti setiap kolom." },
  ]), "panduan");

  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, tryoutSheetHeaders, tryoutRows),
    "tryout",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, questionSheetHeaders, questionRows),
    "questions",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, guidelineSheetHeaders, makeGuidelineRows(categories)),
    "guideline",
  );

  return workbook;
}

function makeTryoutGuidelineRows(categories: CategoryOption[]) {
  return [
    makeGuidelineRow("tryout", "title", "Wajib", "Teks", "Judul try-out yang dibaca peserta dan admin. Maksimal 160 karakter."),
    makeGuidelineRow("tryout", "description", "Wajib", "Teks", "Deskripsi singkat untuk peserta. Maksimal 500 karakter."),
    makeGuidelineRow("tryout", "category_id", "Isi nama atau ID kategori", getCategoryIdsText(categories), "Untuk isian baru, boleh kosong. Isi category_name dengan nama kategori."),
    makeGuidelineRow("tryout", "category_name", "Isi nama atau ID kategori", getCategoryNamesText(categories), "Isi nama kategori. Periksa ejaan. Nama baru akan ditambahkan saat menyimpan."),
    makeGuidelineRow("tryout", "duration_minutes", "Wajib", "1-300", "Durasi dalam menit, angka bulat 1 sampai 300."),
    makeGuidelineRow("tryout", "access_level", "Wajib", "free, premium", "free berarti gratis. premium berarti perlu akses berbayar."),
    makeGuidelineRow("tryout", "status", "Wajib", "draft, published, unpublished", "draft untuk draf, published untuk tayang, unpublished untuk disembunyikan."),
  ];
}

function makeQuestionGuidelineRows(categories: CategoryOption[]) {
  return [
    makeGuidelineRow("questions", "question_id", "Opsional", "ID dari hasil unduhan", "Kosongkan untuk soal baru. Pertahankan ID dari unduhan untuk mengubah soal lama."),
    makeGuidelineRow("questions", "sort_order", "Wajib", "1-1000", "Nomor urut dalam try-out, angka bulat 1 sampai 1000. Setiap soal harus berbeda."),
    makeGuidelineRow("questions", "category_id", "Isi nama atau ID kategori", getCategoryIdsText(categories), "Untuk isian baru, boleh kosong. Isi category_name dengan nama kategori."),
    makeGuidelineRow("questions", "category_name", "Isi nama atau ID kategori", getCategoryNamesText(categories), "Isi nama kategori. Periksa ejaan. Nama baru akan ditambahkan saat menyimpan."),
    makeGuidelineRow("questions", "sub_category_id", "Isi nama atau ID subkategori", getSubCategoryIdsText(categories), "Boleh kosong jika sub_category_name diisi. Subkategori harus sesuai dengan kategori."),
    makeGuidelineRow("questions", "sub_category_name", "Isi nama atau ID subkategori", getSubCategoryNamesText(categories), "Isi nama subkategori di bawah kategori yang dipilih. Nama baru akan ditambahkan."),
    makeGuidelineRow("questions", "topic_id", "Isi nama atau ID topik", getTopicIdsText(categories), "Boleh kosong jika topic_name diisi. Topik harus sesuai dengan subkategori."),
    makeGuidelineRow("questions", "topic_name", "Isi nama atau ID topik", getTopicNamesText(categories), "Isi nama topik di bawah subkategori yang dipilih. Nama baru akan ditambahkan."),
    makeGuidelineRow("questions", "question_text", "Wajib", "Teks", "Teks soal yang dibaca peserta."),
    makeGuidelineRow("questions", "option_a", "Wajib", "Teks", "Pilihan jawaban A."),
    makeGuidelineRow("questions", "option_b", "Wajib", "Teks", "Pilihan jawaban B."),
    makeGuidelineRow("questions", "option_c", "Wajib", "Teks", "Pilihan jawaban C."),
    makeGuidelineRow("questions", "option_d", "Wajib", "Teks", "Pilihan jawaban D."),
    makeGuidelineRow("questions", "option_e", "Wajib jika kunci jawaban E", "Teks atau kosong", "Boleh kosong jika soal hanya punya pilihan A sampai D."),
    makeGuidelineRow("questions", "correct_option", "Wajib", "A, B, C, D, E", "Huruf pilihan jawaban benar. Pilihan tersebut harus terisi."),
    makeGuidelineRow("questions", "explanation", "Wajib", "Teks", "Pembahasan yang dibaca peserta setelah mengerjakan soal."),
    makeGuidelineRow("questions", "video_url", "Opsional", "Tautan https:// atau kosong", "Tautan video pembahasan, opsional."),
    makeGuidelineRow("questions", "picture_url", "Opsional", "Tautan https:// atau kosong", "Tautan gambar soal. Pertahankan saat mengubah hasil unduhan agar gambar tetap ada."),
    makeGuidelineRow("questions", "access_level", "Wajib", "free, premium", "free untuk pembahasan gratis, premium untuk pembahasan berbayar."),
    makeGuidelineRow("questions", "status", "Wajib", "draft, published, unpublished", "Peserta hanya mengerjakan soal published. Try-out published wajib punya minimal satu soal published."),
  ];
}

function makeCategoryGuidelineRows(categories: CategoryOption[]) {
  if (categories.length === 0) {
    return [
      makeGuidelineRow("reference", "category_id", "Referensi", "Belum ada kategori", "Isi category_name untuk menambahkan kategori saat menyimpan Excel."),
    ];
  }

  return categories.flatMap((category) => {
    const categoryRow = makeGuidelineRow("reference", "category_id", "Referensi", category.id, category.name);
    const subCategoryRows = (category.subCategories ?? []).flatMap((subCategory) => {
      const subCategoryRow = makeGuidelineRow("reference", "sub_category_id", "Referensi", subCategory.id, `${subCategory.name} dalam kategori ${category.id}`);
      const topicRows = (subCategory.topics ?? []).map((topic) => (
        makeGuidelineRow("reference", "topic_id", "Referensi", topic.id, `${topic.name} dalam subkategori ${subCategory.id}`)
      ));

      return [subCategoryRow, ...topicRows];
    });

    return [categoryRow, ...subCategoryRows];
  });
}

function makeGuidelineRow(
  sheet: string,
  column: string,
  required: string,
  possibleValues: string,
  notes: string,
) {
  return {
    sheet,
    column,
    required,
    possible_values: possibleValues,
    notes,
  };
}

function getCategoryIdsText(categories: CategoryOption[]) {
  if (categories.length === 0) return "Isi category_name";

  return categories.map((category) => category.id).join(", ");
}

function getCategoryNamesText(categories: CategoryOption[]) {
  if (categories.length === 0) return "Nama kategori baru";

  return `${categories.map((category) => category.name).join(", ")} atau nama kategori baru`;
}

function getSubCategoryIdsText(categories: CategoryOption[]) {
  const subCategoryIds = categories.flatMap((category) => (
    (category.subCategories ?? []).map((subCategory) => subCategory.id)
  ));

  if (subCategoryIds.length === 0) return "Isi sub_category_name";

  return subCategoryIds.join(", ");
}

function getSubCategoryNamesText(categories: CategoryOption[]) {
  const subCategoryNames = categories.flatMap((category) => (
    (category.subCategories ?? []).map((subCategory) => subCategory.name)
  ));

  if (subCategoryNames.length === 0) return "Nama subkategori baru";

  return `${subCategoryNames.join(", ")} atau nama subkategori baru`;
}

function getTopicIdsText(categories: CategoryOption[]) {
  const topicIds = categories.flatMap((category) => (
    (category.subCategories ?? []).flatMap((subCategory) => (
      (subCategory.topics ?? []).map((topic) => topic.id)
    ))
  ));

  if (topicIds.length === 0) return "Isi topic_name";

  return topicIds.join(", ");
}

function getTopicNamesText(categories: CategoryOption[]) {
  const topicNames = categories.flatMap((category) => (
    (category.subCategories ?? []).flatMap((subCategory) => (
      (subCategory.topics ?? []).map((topic) => topic.name)
    ))
  ));

  if (topicNames.length === 0) return "Nama topik baru";

  return `${topicNames.join(", ")} atau nama topik baru`;
}

function getColumnWidth(
  header: string,
  rows: Record<string, string | number | null | undefined>[],
) {
  const longestValueLength = rows.reduce((longestLength, row) => {
    const valueLength = String(row[header] ?? "").length;

    return Math.max(longestLength, valueLength);
  }, header.length);

  return Math.min(Math.max(longestValueLength + 2, 12), 72);
}

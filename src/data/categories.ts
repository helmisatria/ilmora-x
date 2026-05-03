export interface Category {
  id: string;
  name: string;
  color: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

export const categories: Category[] = [
  {
    id: "klinis",
    name: "Klinis",
    color: "#205072",
    subcategories: [
      { id: "klinis-kardiovaskular-hipertensi", name: "Kardiovaskular - Hipertensi", categoryId: "klinis" },
      { id: "klinis-kardiovaskular-gagal-jantung", name: "Kardiovaskular - Gagal Jantung", categoryId: "klinis" },
      { id: "klinis-respiratori-asma", name: "Respiratori - Asma", categoryId: "klinis" },
    ],
  },
  {
    id: "farmakologi",
    name: "Farmakologi",
    color: "#58cc02",
    subcategories: [
      { id: "farmakologi-antibiotik", name: "Antibiotik", categoryId: "farmakologi" },
      { id: "farmakologi-nsaid", name: "NSAID", categoryId: "farmakologi" },
    ],
  },
  {
    id: "farmasi-klinik",
    name: "Farmasi Klinik",
    color: "#0ea5e9",
    subcategories: [
      { id: "farmasi-klinik-perhitungan-dosis", name: "Perhitungan Dosis", categoryId: "farmasi-klinik" },
      { id: "farmasi-klinik-interaksi-obat", name: "Interaksi Obat", categoryId: "farmasi-klinik" },
    ],
  },
];

export function getSubCategories(categoryId: string): SubCategory[] {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? cat.subcategories : [];
}

export function getCategoryName(categoryId: string): string {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

export function getCategoryColor(categoryId: string): string {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? cat.color : "#78716c";
}

export function getSubCategoryName(subCategoryId: string): string {
  for (const cat of categories) {
    const sub = cat.subcategories.find((s) => s.id === subCategoryId);
    if (sub) return sub.name;
  }
  return subCategoryId;
}
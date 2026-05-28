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
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  subCategoryId: string;
}

export const categories: Category[] = [
  {
    id: "klinis",
    name: "Klinis",
    color: "#205072",
    subcategories: [
      {
        id: "klinis-kardiovaskular",
        name: "Kardiovaskular",
        categoryId: "klinis",
        topics: [
          { id: "klinis-kardiovaskular-hipertensi", name: "Hipertensi", subCategoryId: "klinis-kardiovaskular" },
          { id: "klinis-kardiovaskular-gagal-jantung", name: "Gagal Jantung", subCategoryId: "klinis-kardiovaskular" },
        ],
      },
      {
        id: "klinis-respiratori",
        name: "Respiratori",
        categoryId: "klinis",
        topics: [
          { id: "klinis-respiratori-asma", name: "Asma", subCategoryId: "klinis-respiratori" },
        ],
      },
    ],
  },
  {
    id: "farmakologi",
    name: "Farmakologi",
    color: "#58cc02",
    subcategories: [
      {
        id: "farmakologi-antibiotik",
        name: "Antibiotik",
        categoryId: "farmakologi",
        topics: [
          { id: "farmakologi-antibiotik-antibiotik", name: "Antibiotik", subCategoryId: "farmakologi-antibiotik" },
        ],
      },
      {
        id: "farmakologi-nsaid",
        name: "NSAID",
        categoryId: "farmakologi",
        topics: [
          { id: "farmakologi-nsaid-nsaid", name: "NSAID", subCategoryId: "farmakologi-nsaid" },
        ],
      },
    ],
  },
  {
    id: "farmasi-klinik",
    name: "Farmasi Klinik",
    color: "#0ea5e9",
    subcategories: [
      {
        id: "farmasi-klinik-perhitungan-dosis",
        name: "Perhitungan Dosis",
        categoryId: "farmasi-klinik",
        topics: [
          { id: "farmasi-klinik-perhitungan-dosis-perhitungan-dosis", name: "Perhitungan Dosis", subCategoryId: "farmasi-klinik-perhitungan-dosis" },
        ],
      },
      {
        id: "farmasi-klinik-interaksi-obat",
        name: "Interaksi Obat",
        categoryId: "farmasi-klinik",
        topics: [
          { id: "farmasi-klinik-interaksi-obat-interaksi-obat", name: "Interaksi Obat", subCategoryId: "farmasi-klinik-interaksi-obat" },
        ],
      },
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

export function getTopics(subCategoryId: string): Topic[] {
  for (const category of categories) {
    const subCategory = category.subcategories.find((item) => item.id === subCategoryId);

    if (subCategory) return subCategory.topics;
  }

  return [];
}

export function getTopicName(topicId: string): string {
  for (const category of categories) {
    for (const subCategory of category.subcategories) {
      const topic = subCategory.topics.find((item) => item.id === topicId);

      if (topic) return topic.name;
    }
  }

  return topicId;
}

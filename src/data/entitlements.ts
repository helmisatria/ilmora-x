export type ProductType = "premium_membership" | "platinum_tryout" | "material";
export type ContentType = "tryout" | "material";

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  price: number;
  description: string;
  active: boolean;
  durationDays?: number;
  contentType?: ContentType;
  contentId?: number;
}

export interface Entitlement {
  id: number;
  userId: number;
  source: "purchase" | "admin_grant";
  productId?: number;
  startsAt: string;
  endsAt: string | null;
  contentType?: ContentType;
  contentId?: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Premium 1 Bulan",
    type: "premium_membership",
    durationDays: 30,
    price: 49000,
    description: "Akses penuh selama 1 bulan",
    active: true,
  },
  {
    id: 2,
    name: "Premium 6 Bulan",
    type: "premium_membership",
    durationDays: 180,
    price: 249000,
    description: "Akses penuh selama 6 bulan - hemat 15%",
    active: true,
  },
  {
    id: 3,
    name: "Premium 1 Tahun",
    type: "premium_membership",
    durationDays: 365,
    price: 399000,
    description: "Akses penuh selama 1 tahun - hemat 32%",
    active: true,
  },
  {
    id: 101,
    name: "Platinum Try-out Farmasi Klinik Lanjut",
    type: "platinum_tryout",
    price: 19000,
    description: "Akses lifetime untuk Try-out Farmasi Klinik Lanjut",
    active: true,
    contentType: "tryout",
    contentId: 5,
  },
  {
    id: 102,
    name: "Platinum Try-out Perhitungan Dosis",
    type: "platinum_tryout",
    price: 19000,
    description: "Akses lifetime untuk Try-out Perhitungan Dosis",
    active: true,
    contentType: "tryout",
    contentId: 6,
  },
];

export const membershipProducts = products.filter((product) => product.type === "premium_membership");
export const platinumTryoutProducts = products.filter((product) => product.type === "platinum_tryout");


export function getProductById(productId: number | undefined) {
  if (!productId) return products[0];
  return products.find((product) => product.id === productId) ?? products[0];
}

export function getPlatinumProductForTryout(tryoutId: number) {
  return platinumTryoutProducts.find((product) => product.contentType === "tryout" && product.contentId === tryoutId);
}

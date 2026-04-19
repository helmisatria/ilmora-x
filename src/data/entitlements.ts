export interface Entitlement {
  id: number;
  userId: number;
  source: "purchase" | "admin_grant";
  startsAt: string;
  endsAt: string;
  packageId?: number;
}

export interface Package {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  description: string;
  active: boolean;
}

export const packages: Package[] = [
  { id: 1, name: "Premium 1 Bulan", durationDays: 30, price: 49000, description: "Akses penuh selama 1 bulan", active: true },
  { id: 2, name: "Premium 6 Bulan", durationDays: 180, price: 249000, description: "Akses penuh selama 6 bulan — hemat 15%", active: true },
  { id: 3, name: "Premium 1 Tahun", durationDays: 365, price: 399000, description: "Akses penuh selama 1 tahun — hemat 32%", active: true },
];

export const mockEntitlements: Entitlement[] = [
  { id: 1, userId: 2, source: "purchase", startsAt: "2026-04-01", endsAt: "2026-06-15", packageId: 2 },
  { id: 2, userId: 4, source: "purchase", startsAt: "2026-03-01", endsAt: "2026-08-01", packageId: 2 },
  { id: 3, userId: 6, source: "purchase", startsAt: "2026-04-10", endsAt: "2026-07-01", packageId: 1 },
  { id: 4, userId: 9, source: "purchase", startsAt: "2026-03-15", endsAt: "2026-09-01", packageId: 3 },
  { id: 5, userId: 99, source: "admin_grant", startsAt: "2026-01-01", endsAt: "2099-12-31" },
];
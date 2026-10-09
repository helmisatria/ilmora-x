import { createFileRoute } from "@tanstack/react-router";
import { getLandingAnnouncement } from "../features/announcement/announcement-functions";
import { LandingPage } from "../features/landing/landing-page";
import { listMembershipProducts } from "../features/premium-access/checkout-functions";
import { listPublicPublishedTryouts } from "../features/tryout-content/student-tryout-catalog-functions";

type MembershipProduct = Awaited<ReturnType<typeof listMembershipProducts>>[number];
type PublicTryout = Awaited<ReturnType<typeof listPublicPublishedTryouts>>[number];

const fallbackProducts = [
  {
    id: "premium-30-days",
    name: "Premium 1 Bulan",
    type: "premium_membership",
    description: "Akses penuh selama 1 bulan",
    price: 49000,
    active: true,
    durationDays: 30,
    contentType: null,
    contentId: null,
  },
  {
    id: "premium-180-days",
    name: "Premium 6 Bulan",
    type: "premium_membership",
    description: "Akses penuh selama 6 bulan",
    price: 249000,
    active: true,
    durationDays: 180,
    contentType: null,
    contentId: null,
  },
  {
    id: "premium-365-days",
    name: "Premium 1 Tahun",
    type: "premium_membership",
    description: "Akses penuh selama 1 tahun",
    price: 399000,
    active: true,
    durationDays: 365,
    contentType: null,
    contentId: null,
  },
] satisfies MembershipProduct[];

const LANDING_SHARE_TITLE = "IlmoraX | Cari tahu topik UKAI yang masih lemah";
const LANDING_DESCRIPTION =
  "Kerjakan try-out UKAI bertimer, lalu cek akurasi per topik dan pembahasan jawabanmu. Mulai gratis.";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, tryouts, announcement] = await Promise.all([
      listMembershipProducts().catch(() => fallbackProducts),
      listPublicPublishedTryouts().catch(() => [] as PublicTryout[]),
      getLandingAnnouncement().catch(() => null),
    ]);

    return {
      products: products.length > 0 ? products : fallbackProducts,
      tryouts,
      announcement,
    };
  },
  head: () => ({
    meta: [
      { title: "IlmoraX | Try-out UKAI untuk calon apoteker" },
      { name: "description", content: LANDING_DESCRIPTION },
      { property: "og:title", content: LANDING_SHARE_TITLE },
      { property: "og:description", content: LANDING_DESCRIPTION },
      { name: "twitter:title", content: LANDING_SHARE_TITLE },
      { name: "twitter:description", content: LANDING_DESCRIPTION },
    ],
  }),
  component: LandingRoute,
});

function LandingRoute() {
  const { products, tryouts, announcement } = Route.useLoaderData();

  return <LandingPage products={products} tryouts={tryouts} announcement={announcement} />;
}

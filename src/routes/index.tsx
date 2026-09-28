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
      { title: "IlmoraX - Simulasi UKAI yang Terasa Seperti Ujian Asli" },
      {
        name: "description",
        content:
          "IlmoraX membantu calon apoteker mulai dari try-out, tahu kekurangan, lalu belajar dari pembahasan yang paling relevan.",
      },
      {
        property: "og:title",
        content: "IlmoraX - Simulasi UKAI yang Terasa Seperti Ujian Asli",
      },
      {
        property: "og:description",
        content:
          "Mulai dari try-out, ketahui bagian yang masih lemah, lalu isi kekurangannya lewat pembahasan yang tepat.",
      },
    ],
  }),
  component: LandingRoute,
});

function LandingRoute() {
  const { products, tryouts, announcement } = Route.useLoaderData();

  return <LandingPage products={products} tryouts={tryouts} announcement={announcement} />;
}

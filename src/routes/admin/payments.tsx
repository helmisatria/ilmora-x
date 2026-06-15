import { createFileRoute } from "@tanstack/react-router";
import { AdminPaymentsPage } from "../../features/premium-access/admin-payments-page";
import { getPaymentAdminData } from "../../features/premium-access/admin-payment-functions";

export const Route = createFileRoute("/admin/payments")({
  loader: async () => {
    const data = await getPaymentAdminData();

    return { data };
  },
  head: () => ({
    meta: [
      { title: "Payments — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPaymentsRoute,
});

function AdminPaymentsRoute() {
  const { data } = Route.useLoaderData();

  return <AdminPaymentsPage data={data} />;
}

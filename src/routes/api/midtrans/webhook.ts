import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/midtrans/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { observeServerRoute } = await import("../../../lib/observability");
        const {
          isValidMidtransNotification,
          processMidtransWebhook,
        } = await import("../../../features/premium-access/midtrans-webhook.server");

        return observeServerRoute("midtrans.webhook", request, async (logger) => {
          const payload = await request.json().catch(() => null);

          if (!payload || typeof payload !== "object") {
            logger.warn("midtrans webhook rejected: invalid payload");
            return Response.json({ message: "Invalid webhook payload." }, { status: 400 });
          }

          if (!isValidMidtransNotification(payload)) {
            logger.warn("midtrans webhook rejected: invalid signature");
            return Response.json({ message: "Invalid webhook signature." }, { status: 401 });
          }

          const result = await processMidtransWebhook(payload, logger);

          return Response.json(result);
        });
      },
    },
  },
});

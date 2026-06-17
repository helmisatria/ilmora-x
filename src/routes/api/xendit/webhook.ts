import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/xendit/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { observeServerRoute } = await import("../../../lib/observability");
        const {
          isValidXenditCallbackToken,
          processXenditInvoiceWebhook,
        } = await import("../../../features/premium-access/xendit-webhook.server");

        return observeServerRoute("xendit.webhook", request, async (logger) => {
          if (!isValidXenditCallbackToken(request.headers)) {
            logger.warn("xendit webhook rejected: invalid callback token");
            return Response.json({ message: "Invalid callback token." }, { status: 401 });
          }

          const payload = await request.json().catch(() => null);

          if (!payload || typeof payload !== "object") {
            logger.warn("xendit webhook rejected: invalid payload");
            return Response.json({ message: "Invalid webhook payload." }, { status: 400 });
          }

          const result = await processXenditInvoiceWebhook(payload as never, logger);

          return Response.json(result);
        });
      },
    },
  },
});

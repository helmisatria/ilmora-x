ALTER TABLE "checkouts" RENAME COLUMN "xendit_external_id" TO "provider_order_id";
--> statement-breakpoint
ALTER TABLE "checkouts" RENAME COLUMN "xendit_invoice_id" TO "provider_transaction_id";
--> statement-breakpoint
ALTER TABLE "checkouts" RENAME COLUMN "xendit_invoice_url" TO "provider_checkout_url";
--> statement-breakpoint
ALTER TABLE "checkouts" RENAME COLUMN "xendit_status" TO "provider_status";
--> statement-breakpoint
ALTER TABLE "checkouts" RENAME CONSTRAINT "checkouts_xendit_external_id_unique" TO "checkouts_provider_order_id_unique";
--> statement-breakpoint
ALTER TABLE "checkouts" RENAME CONSTRAINT "checkouts_xendit_invoice_id_unique" TO "checkouts_provider_transaction_id_unique";
--> statement-breakpoint
ALTER TABLE "checkouts" DROP CONSTRAINT "checkouts_provider_check";
--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_provider_check" CHECK ("checkouts"."payment_provider" in ('xendit', 'midtrans', 'manual_zero_amount'));
--> statement-breakpoint
ALTER TABLE "xendit_webhook_events" RENAME TO "payment_webhook_events";
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD COLUMN "payment_provider" text DEFAULT 'xendit' NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ALTER COLUMN "payment_provider" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" RENAME COLUMN "xendit_external_id" TO "provider_order_id";
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" RENAME COLUMN "xendit_payment_id" TO "provider_transaction_id";
--> statement-breakpoint
UPDATE "payment_webhook_events"
SET "provider_transaction_id" = COALESCE("provider_transaction_id", "xendit_invoice_id");
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" DROP COLUMN "xendit_invoice_id";
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" RENAME COLUMN "xendit_status" TO "provider_status";
--> statement-breakpoint
ALTER INDEX "xendit_webhook_events_checkout_idx" RENAME TO "payment_webhook_events_checkout_idx";
--> statement-breakpoint
ALTER INDEX "xendit_webhook_events_payment_idx" RENAME TO "payment_webhook_events_transaction_idx";
--> statement-breakpoint
CREATE INDEX "payment_webhook_events_order_idx" ON "payment_webhook_events" USING btree ("provider_order_id");

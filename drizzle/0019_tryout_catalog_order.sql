ALTER TABLE "tryouts" ADD COLUMN "catalog_order" integer;--> statement-breakpoint
ALTER TABLE "tryouts" ADD CONSTRAINT "tryouts_catalog_order_check" CHECK ("tryouts"."catalog_order" >= 1);

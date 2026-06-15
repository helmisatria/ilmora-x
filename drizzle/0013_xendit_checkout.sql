CREATE TABLE "products" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"duration_days" integer,
	"content_type" text,
	"content_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_type_check" CHECK ("products"."type" in ('premium_membership', 'lifetime_tryout', 'material')),
	CONSTRAINT "products_price_check" CHECK ("products"."price" >= 0),
	CONSTRAINT "products_duration_days_check" CHECK ("products"."duration_days" is null or "products"."duration_days" >= 1),
	CONSTRAINT "products_content_type_check" CHECK ("products"."content_type" is null or "products"."content_type" in ('tryout', 'material')),
	CONSTRAINT "products_membership_shape_check" CHECK (("products"."type" <> 'premium_membership') or ("products"."duration_days" is not null and "products"."content_type" is null and "products"."content_id" is null)),
	CONSTRAINT "products_lifetime_tryout_shape_check" CHECK (("products"."type" <> 'lifetime_tryout') or ("products"."duration_days" is null and "products"."content_type" = 'tryout' and "products"."content_id" is not null))
);
--> statement-breakpoint
CREATE INDEX "products_type_active_idx" ON "products" USING btree ("type","active");
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"product_scope" text DEFAULT 'all' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"max_total_uses" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code"),
	CONSTRAINT "coupons_code_upper_check" CHECK ("coupons"."code" = upper("coupons"."code")),
	CONSTRAINT "coupons_discount_type_check" CHECK ("coupons"."discount_type" in ('percentage', 'fixed')),
	CONSTRAINT "coupons_discount_value_check" CHECK ("coupons"."discount_value" > 0),
	CONSTRAINT "coupons_percentage_value_check" CHECK ("coupons"."discount_type" <> 'percentage' or "coupons"."discount_value" between 1 and 100),
	CONSTRAINT "coupons_product_scope_check" CHECK ("coupons"."product_scope" in ('all', 'premium_membership', 'lifetime_tryout', 'material')),
	CONSTRAINT "coupons_max_total_uses_check" CHECK ("coupons"."max_total_uses" is null or "coupons"."max_total_uses" >= 1),
	CONSTRAINT "coupons_window_check" CHECK ("coupons"."ends_at" > "coupons"."starts_at")
);
--> statement-breakpoint
CREATE INDEX "coupons_active_window_idx" ON "coupons" USING btree ("active","starts_at","ends_at");
--> statement-breakpoint
CREATE TABLE "checkouts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"product_id" text,
	"coupon_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"product_name" text NOT NULL,
	"product_type" text NOT NULL,
	"product_description" text DEFAULT '' NOT NULL,
	"duration_days" integer,
	"content_type" text,
	"content_id" text,
	"coupon_code" text,
	"base_amount" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"final_amount" integer NOT NULL,
	"payment_provider" text NOT NULL,
	"xendit_external_id" text,
	"xendit_invoice_id" text,
	"xendit_invoice_url" text,
	"xendit_status" text,
	"provider_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"amount_mismatch_payload" jsonb,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkouts_xendit_external_id_unique" UNIQUE("xendit_external_id"),
	CONSTRAINT "checkouts_xendit_invoice_id_unique" UNIQUE("xendit_invoice_id"),
	CONSTRAINT "checkouts_status_check" CHECK ("checkouts"."status" in ('pending', 'paid', 'expired', 'cancelled', 'review_required')),
	CONSTRAINT "checkouts_product_type_check" CHECK ("checkouts"."product_type" in ('premium_membership', 'lifetime_tryout', 'material')),
	CONSTRAINT "checkouts_content_type_check" CHECK ("checkouts"."content_type" is null or "checkouts"."content_type" in ('tryout', 'material')),
	CONSTRAINT "checkouts_amounts_check" CHECK ("checkouts"."base_amount" >= 0 and "checkouts"."discount_amount" >= 0 and "checkouts"."final_amount" >= 0),
	CONSTRAINT "checkouts_provider_check" CHECK ("checkouts"."payment_provider" in ('xendit', 'manual_zero_amount'))
);
--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "checkouts_student_status_idx" ON "checkouts" USING btree ("student_user_id","status");
--> statement-breakpoint
CREATE INDEX "checkouts_product_pending_idx" ON "checkouts" USING btree ("student_user_id","product_id","coupon_id","status");
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" text NOT NULL,
	"student_user_id" text NOT NULL,
	"checkout_id" text NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"discount_amount" integer NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_redemptions_checkout_unique" UNIQUE("checkout_id"),
	CONSTRAINT "coupon_redemptions_status_check" CHECK ("coupon_redemptions"."status" in ('reserved', 'finalized', 'released')),
	CONSTRAINT "coupon_redemptions_discount_check" CHECK ("coupon_redemptions"."discount_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_checkout_id_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."checkouts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "coupon_redemptions_student_coupon_idx" ON "coupon_redemptions" USING btree ("student_user_id","coupon_id");
--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_status_idx" ON "coupon_redemptions" USING btree ("coupon_id","status");
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"product_id" text,
	"product_type" text NOT NULL,
	"content_type" text,
	"content_id" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"granted_by_admin_user_id" text,
	"grant_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_source_unique" UNIQUE("source","source_id"),
	CONSTRAINT "entitlements_source_check" CHECK ("entitlements"."source" in ('checkout', 'admin_grant')),
	CONSTRAINT "entitlements_product_type_check" CHECK ("entitlements"."product_type" in ('premium_membership', 'lifetime_tryout', 'material')),
	CONSTRAINT "entitlements_content_type_check" CHECK ("entitlements"."content_type" is null or "entitlements"."content_type" in ('tryout', 'material')),
	CONSTRAINT "entitlements_window_check" CHECK ("entitlements"."ends_at" is null or "entitlements"."ends_at" > "entitlements"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_granted_by_admin_user_id_user_id_fk" FOREIGN KEY ("granted_by_admin_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "entitlements_student_type_idx" ON "entitlements" USING btree ("student_user_id","product_type","ends_at");
--> statement-breakpoint
CREATE INDEX "entitlements_student_content_idx" ON "entitlements" USING btree ("student_user_id","content_type","content_id");
--> statement-breakpoint
CREATE TABLE "xendit_webhook_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkout_id" text,
	"xendit_invoice_id" text,
	"xendit_external_id" text,
	"xendit_payment_id" text,
	"xendit_status" text,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_result" text DEFAULT 'stored' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "xendit_webhook_events" ADD CONSTRAINT "xendit_webhook_events_checkout_id_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."checkouts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "xendit_webhook_events_checkout_idx" ON "xendit_webhook_events" USING btree ("checkout_id");
--> statement-breakpoint
CREATE INDEX "xendit_webhook_events_invoice_idx" ON "xendit_webhook_events" USING btree ("xendit_invoice_id");
--> statement-breakpoint
CREATE INDEX "xendit_webhook_events_payment_idx" ON "xendit_webhook_events" USING btree ("xendit_payment_id");
--> statement-breakpoint
INSERT INTO "products" ("id", "name", "type", "description", "price", "duration_days", "active")
VALUES
	('premium-30-days', 'Premium 1 Bulan', 'premium_membership', 'Akses penuh selama 1 bulan', 49000, 30, true),
	('premium-180-days', 'Premium 6 Bulan', 'premium_membership', 'Akses penuh selama 6 bulan', 249000, 180, true),
	('premium-365-days', 'Premium 1 Tahun', 'premium_membership', 'Akses penuh selama 1 tahun', 399000, 365, true);
--> statement-breakpoint
INSERT INTO "products" ("id", "name", "type", "description", "price", "content_type", "content_id", "active")
SELECT
	'lifetime-tryout-' || "tryouts"."id",
	'Try-out ' || "tryouts"."title",
	'lifetime_tryout',
	'Akses lifetime untuk ' || "tryouts"."title",
	19000,
	'tryout',
	"tryouts"."id",
	true
FROM "tryouts"
WHERE "tryouts"."access_level" = 'premium';

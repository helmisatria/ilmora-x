CREATE TABLE "dashboard_announcements" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"image_url" text,
	"cta_label" text,
	"cta_url" text,
	"placement" text DEFAULT 'all' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_announcements_placement_check" CHECK ("dashboard_announcements"."placement" in ('all', 'landing', 'app')),
	CONSTRAINT "dashboard_announcements_window_check" CHECK ("dashboard_announcements"."ends_at" > "dashboard_announcements"."starts_at"),
	CONSTRAINT "dashboard_announcements_cta_check" CHECK (("dashboard_announcements"."cta_label" is null) = ("dashboard_announcements"."cta_url" is null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_announcements_single_active_unique" ON "dashboard_announcements" USING btree ("active") WHERE "dashboard_announcements"."active" = true;--> statement-breakpoint
CREATE TABLE "dashboard_announcement_dismissals" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" text NOT NULL,
	"student_user_id" text NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_announcement_dismissals_student_unique" UNIQUE("announcement_id","student_user_id")
);
--> statement-breakpoint
ALTER TABLE "dashboard_announcement_dismissals" ADD CONSTRAINT "dashboard_announcement_dismissals_announcement_id_dashboard_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."dashboard_announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_announcement_dismissals" ADD CONSTRAINT "dashboard_announcement_dismissals_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "poll_rounds" ADD COLUMN "question_text" text;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD COLUMN "option_a" text;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD COLUMN "option_b" text;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD COLUMN "option_c" text;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD COLUMN "option_d" text;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD COLUMN "option_e" text;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD CONSTRAINT "poll_rounds_option_e_check" CHECK ("poll_rounds"."question_text" is null or "poll_rounds"."correct_option" <> 'E' or nullif(trim("poll_rounds"."option_e"), '') is not null);--> statement-breakpoint
CREATE TABLE "poll_round_plan_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"label" text,
	"question_text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"option_e" text,
	"correct_option" text NOT NULL,
	"timer_seconds" integer,
	"started_round_id" text,
	"started_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_round_plan_items_session_order_unique" UNIQUE("session_id","sort_order"),
	CONSTRAINT "poll_round_plan_items_sort_order_check" CHECK ("poll_round_plan_items"."sort_order" >= 1),
	CONSTRAINT "poll_round_plan_items_status_check" CHECK ("poll_round_plan_items"."status" in ('planned', 'started', 'skipped')),
	CONSTRAINT "poll_round_plan_items_correct_option_check" CHECK ("poll_round_plan_items"."correct_option" in ('A', 'B', 'C', 'D', 'E')),
	CONSTRAINT "poll_round_plan_items_option_e_check" CHECK ("poll_round_plan_items"."correct_option" <> 'E' or nullif(trim("poll_round_plan_items"."option_e"), '') is not null),
	CONSTRAINT "poll_round_plan_items_timer_seconds_check" CHECK ("poll_round_plan_items"."timer_seconds" is null or "poll_round_plan_items"."timer_seconds" between 5 and 600)
);
--> statement-breakpoint
ALTER TABLE "poll_round_plan_items" ADD CONSTRAINT "poll_round_plan_items_session_id_poll_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."poll_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_round_plan_items" ADD CONSTRAINT "poll_round_plan_items_started_round_id_poll_rounds_id_fk" FOREIGN KEY ("started_round_id") REFERENCES "public"."poll_rounds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poll_round_plan_items_session_status_idx" ON "poll_round_plan_items" USING btree ("session_id","status");

CREATE TABLE "poll_answers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"selected_option" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"response_ms" integer DEFAULT 0 NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_answers_round_participant_unique" UNIQUE("round_id","participant_id"),
	CONSTRAINT "poll_answers_selected_option_check" CHECK ("poll_answers"."selected_option" in ('A', 'B', 'C', 'D', 'E')),
	CONSTRAINT "poll_answers_points_check" CHECK ("poll_answers"."points" >= 0),
	CONSTRAINT "poll_answers_response_ms_check" CHECK ("poll_answers"."response_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "poll_participants" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"student_user_id" text,
	"display_name" text NOT NULL,
	"guest_token" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_participants_session_guest_token_unique" UNIQUE("session_id","guest_token"),
	CONSTRAINT "poll_participants_session_student_unique" UNIQUE("session_id","student_user_id")
);
--> statement-breakpoint
CREATE TABLE "poll_rounds" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"round_number" integer NOT NULL,
	"label" text NOT NULL,
	"correct_option" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"timer_seconds" integer,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"corrected_at" timestamp with time zone,
	"corrected_by_admin_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_rounds_session_number_unique" UNIQUE("session_id","round_number"),
	CONSTRAINT "poll_rounds_correct_option_check" CHECK ("poll_rounds"."correct_option" in ('A', 'B', 'C', 'D', 'E')),
	CONSTRAINT "poll_rounds_status_check" CHECK ("poll_rounds"."status" in ('open', 'closed')),
	CONSTRAINT "poll_rounds_timer_seconds_check" CHECK ("poll_rounds"."timer_seconds" is null or "poll_rounds"."timer_seconds" between 5 and 600)
);
--> statement-breakpoint
CREATE TABLE "poll_sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"access_mode" text DEFAULT 'open_guest' NOT NULL,
	"created_by_admin_user_id" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_sessions_status_check" CHECK ("poll_sessions"."status" in ('draft', 'open', 'closed')),
	CONSTRAINT "poll_sessions_access_mode_check" CHECK ("poll_sessions"."access_mode" in ('open_guest', 'login_required')),
	CONSTRAINT "poll_sessions_code_check" CHECK ("poll_sessions"."code" ~ '^[0-9]{6}$')
);
--> statement-breakpoint
ALTER TABLE "poll_answers" ADD CONSTRAINT "poll_answers_round_id_poll_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."poll_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_answers" ADD CONSTRAINT "poll_answers_participant_id_poll_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."poll_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_participants" ADD CONSTRAINT "poll_participants_session_id_poll_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."poll_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_participants" ADD CONSTRAINT "poll_participants_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD CONSTRAINT "poll_rounds_session_id_poll_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."poll_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_rounds" ADD CONSTRAINT "poll_rounds_corrected_by_admin_user_id_user_id_fk" FOREIGN KEY ("corrected_by_admin_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_sessions" ADD CONSTRAINT "poll_sessions_created_by_admin_user_id_user_id_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poll_answers_round_idx" ON "poll_answers" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "poll_answers_participant_idx" ON "poll_answers" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "poll_participants_session_idx" ON "poll_participants" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "poll_rounds_session_status_idx" ON "poll_rounds" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "poll_sessions_code_idx" ON "poll_sessions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "poll_sessions_status_idx" ON "poll_sessions" USING btree ("status");
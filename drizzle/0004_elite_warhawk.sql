CREATE TABLE "student_badges" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"badge_code" text NOT NULL,
	"award_source" text NOT NULL,
	"source_week_key" text,
	"reward_xp" integer DEFAULT 0 NOT NULL,
	"seen_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_badges_student_badge_unique" UNIQUE("student_user_id","badge_code"),
	CONSTRAINT "student_badges_award_source_check" CHECK ("student_badges"."award_source" in ('weekly_leaderboard', 'daily_evaluation', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "student_exp_ledger" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"xp_amount" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "student_exp_ledger_source_unique" UNIQUE("source_type","source_id"),
	CONSTRAINT "student_exp_ledger_source_type_check" CHECK ("student_exp_ledger"."source_type" in ('badge_reward')),
	CONSTRAINT "student_exp_ledger_xp_amount_check" CHECK ("student_exp_ledger"."xp_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "weekly_leaderboard_entries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" text NOT NULL,
	"week_start_date" text NOT NULL,
	"student_user_id" text NOT NULL,
	"rank" integer NOT NULL,
	"xp" integer NOT NULL,
	"last_xp_attempt_submitted_at" timestamp with time zone NOT NULL,
	"badges_awarded" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_leaderboard_entries_snapshot_student_unique" UNIQUE("snapshot_id","student_user_id"),
	CONSTRAINT "weekly_leaderboard_entries_snapshot_rank_unique" UNIQUE("snapshot_id","rank"),
	CONSTRAINT "weekly_leaderboard_entries_rank_check" CHECK ("weekly_leaderboard_entries"."rank" >= 1),
	CONSTRAINT "weekly_leaderboard_entries_xp_check" CHECK ("weekly_leaderboard_entries"."xp" >= 1)
);
--> statement-breakpoint
CREATE TABLE "weekly_leaderboard_snapshots" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start_date" text NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"participant_threshold" integer NOT NULL,
	"ranked_student_count" integer NOT NULL,
	"threshold_met" boolean NOT NULL,
	"status" text DEFAULT 'finalized' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_leaderboard_snapshots_week_start_date_unique" UNIQUE("week_start_date"),
	CONSTRAINT "weekly_leaderboard_snapshots_status_check" CHECK ("weekly_leaderboard_snapshots"."status" in ('finalized')),
	CONSTRAINT "weekly_leaderboard_snapshots_threshold_check" CHECK ("weekly_leaderboard_snapshots"."participant_threshold" >= 1),
	CONSTRAINT "weekly_leaderboard_snapshots_ranked_count_check" CHECK ("weekly_leaderboard_snapshots"."ranked_student_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "activity_events" DROP CONSTRAINT "activity_events_type_check";--> statement-breakpoint
ALTER TABLE "question_reports" DROP CONSTRAINT "question_reports_status_check";--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "submitted_by_admin_user_id" text;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "is_impersonated_submission" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_exp_ledger" ADD CONSTRAINT "student_exp_ledger_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_leaderboard_entries" ADD CONSTRAINT "weekly_leaderboard_entries_snapshot_id_weekly_leaderboard_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."weekly_leaderboard_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_leaderboard_entries" ADD CONSTRAINT "weekly_leaderboard_entries_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_badges_student_seen_idx" ON "student_badges" USING btree ("student_user_id","seen_at");--> statement-breakpoint
CREATE INDEX "student_exp_ledger_student_idx" ON "student_exp_ledger" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX "weekly_leaderboard_entries_week_idx" ON "weekly_leaderboard_entries" USING btree ("week_start_date");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_submitted_by_admin_user_id_user_id_fk" FOREIGN KEY ("submitted_by_admin_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_type_check" CHECK ("activity_events"."event_type" in ('login', 'profile_completed', 'tryout_started', 'tryout_submitted', 'question_reported', 'materi_viewed', 'admin_impersonation_started', 'admin_impersonation_stopped'));--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_status_check" CHECK ("question_reports"."status" in ('open', 'reviewed', 'dismissed', 'resolved'));

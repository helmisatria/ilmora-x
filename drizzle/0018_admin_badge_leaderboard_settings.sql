CREATE TABLE "leaderboard_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"participant_threshold" integer NOT NULL,
	"updated_by_admin_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_settings_single_row_check" CHECK ("leaderboard_settings"."id" = 'default'),
	CONSTRAINT "leaderboard_settings_threshold_check" CHECK ("leaderboard_settings"."participant_threshold" >= 1)
);
--> statement-breakpoint
CREATE TABLE "badge_settings" (
	"badge_code" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"requirement_text" text,
	"xp_reward" integer,
	"active" boolean DEFAULT true NOT NULL,
	"updated_by_admin_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_settings_xp_reward_check" CHECK ("badge_settings"."xp_reward" is null or "badge_settings"."xp_reward" >= 0)
);
--> statement-breakpoint
ALTER TABLE "activity_events" DROP CONSTRAINT "activity_events_type_check";
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_type_check" CHECK ("activity_events"."event_type" in ('login', 'profile_completed', 'tryout_started', 'tryout_submitted', 'question_reported', 'materi_viewed', 'admin_impersonation_started', 'admin_impersonation_stopped', 'admin_leaderboard_settings_updated', 'admin_badge_settings_updated'));

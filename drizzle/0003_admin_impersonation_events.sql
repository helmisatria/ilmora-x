ALTER TABLE "activity_events" DROP CONSTRAINT "activity_events_type_check";
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_type_check" CHECK ("activity_events"."event_type" in ('login', 'profile_completed', 'tryout_started', 'tryout_submitted', 'question_reported', 'materi_viewed', 'admin_impersonation_started', 'admin_impersonation_stopped'));

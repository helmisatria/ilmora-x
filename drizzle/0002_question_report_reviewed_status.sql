ALTER TABLE "question_reports" DROP CONSTRAINT "question_reports_status_check";
--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_status_check" CHECK ("question_reports"."status" in ('open', 'reviewed', 'dismissed', 'resolved'));

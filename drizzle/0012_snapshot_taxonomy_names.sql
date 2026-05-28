ALTER TABLE "attempt_question_snapshots" ADD COLUMN "category_name" text;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD COLUMN "sub_category_name" text;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD COLUMN "topic_name" text;
--> statement-breakpoint
UPDATE "attempt_question_snapshots"
SET
  "category_name" = "categories"."name",
  "sub_category_name" = "sub_categories"."name",
  "topic_name" = "topics"."name"
FROM "categories", "sub_categories", "topics"
WHERE "attempt_question_snapshots"."category_id" = "categories"."id"
  AND "attempt_question_snapshots"."sub_category_id" = "sub_categories"."id"
  AND "attempt_question_snapshots"."topic_id" = "topics"."id";
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "category_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "sub_category_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "topic_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" DROP CONSTRAINT IF EXISTS "attempt_question_snapshots_sub_category_id_sub_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" DROP CONSTRAINT IF EXISTS "attempt_question_snapshots_topic_id_topics_id_fk";

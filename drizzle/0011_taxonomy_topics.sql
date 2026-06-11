CREATE TABLE "topics" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_category_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_sub_category_slug_unique" UNIQUE("sub_category_id","slug")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "topic_id" text;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD COLUMN "topic_id" text;
--> statement-breakpoint
ALTER TABLE "materi" ADD COLUMN "topic_id" text;
--> statement-breakpoint
CREATE TEMP TABLE taxonomy_topic_migration AS
WITH parsed AS (
	SELECT
		id AS old_sub_category_id,
		category_id,
		sort_order,
		created_at,
		updated_at,
		CASE
			WHEN position(' - ' IN name) > 0 THEN trim(left(name, position(' - ' IN name) - 1))
			ELSE trim(name)
		END AS new_sub_category_name,
		CASE
			WHEN position(' - ' IN name) > 0 THEN trim(substr(name, position(' - ' IN name) + 3))
			ELSE trim(name)
		END AS topic_name
	FROM "sub_categories"
),
slugged AS (
	SELECT
		*,
		category_id || '-' || coalesce(nullif(trim(both '-' FROM regexp_replace(lower(new_sub_category_name), '[^a-z0-9]+', '-', 'g')), ''), 'sub-category') AS canonical_sub_category_id,
		coalesce(nullif(trim(both '-' FROM regexp_replace(lower(topic_name), '[^a-z0-9]+', '-', 'g')), ''), 'topic') AS topic_slug_name
	FROM parsed
)
SELECT
	old_sub_category_id,
	canonical_sub_category_id,
	category_id,
	new_sub_category_name,
	topic_name,
	canonical_sub_category_id || '-' || topic_slug_name AS topic_id,
	canonical_sub_category_id || '-' || topic_slug_name AS topic_slug,
	sort_order,
	created_at,
	updated_at
FROM slugged;
--> statement-breakpoint
INSERT INTO "sub_categories" ("id", "category_id", "slug", "name", "sort_order", "created_at", "updated_at")
SELECT DISTINCT ON (canonical_sub_category_id)
	canonical_sub_category_id,
	category_id,
	canonical_sub_category_id,
	new_sub_category_name,
	sort_order,
	created_at,
	updated_at
FROM taxonomy_topic_migration
ORDER BY canonical_sub_category_id, sort_order, new_sub_category_name
ON CONFLICT ("id") DO UPDATE SET
	"name" = excluded."name",
	"slug" = excluded."slug",
	"sort_order" = excluded."sort_order",
	"updated_at" = now();
--> statement-breakpoint
INSERT INTO "topics" ("id", "sub_category_id", "slug", "name", "sort_order", "created_at", "updated_at")
SELECT
	topic_id,
	canonical_sub_category_id,
	topic_slug,
	topic_name,
	sort_order,
	created_at,
	updated_at
FROM taxonomy_topic_migration;
--> statement-breakpoint
UPDATE "questions"
SET
	"sub_category_id" = taxonomy_topic_migration.canonical_sub_category_id,
	"topic_id" = taxonomy_topic_migration.topic_id
FROM taxonomy_topic_migration
WHERE "questions"."sub_category_id" = taxonomy_topic_migration.old_sub_category_id;
--> statement-breakpoint
UPDATE "attempt_question_snapshots"
SET
	"sub_category_id" = taxonomy_topic_migration.canonical_sub_category_id,
	"topic_id" = taxonomy_topic_migration.topic_id
FROM taxonomy_topic_migration
WHERE "attempt_question_snapshots"."sub_category_id" = taxonomy_topic_migration.old_sub_category_id;
--> statement-breakpoint
UPDATE "materi"
SET
	"sub_category_id" = taxonomy_topic_migration.canonical_sub_category_id,
	"topic_id" = taxonomy_topic_migration.topic_id
FROM taxonomy_topic_migration
WHERE "materi"."sub_category_id" = taxonomy_topic_migration.old_sub_category_id;
--> statement-breakpoint
DELETE FROM "sub_categories"
WHERE "id" NOT IN (
	SELECT DISTINCT canonical_sub_category_id
	FROM taxonomy_topic_migration
);
--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "topic_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "topic_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "materi" ALTER COLUMN "topic_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD CONSTRAINT "attempt_question_snapshots_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materi" ADD CONSTRAINT "materi_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;

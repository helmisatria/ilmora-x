UPDATE "tryouts"
SET "access_level" = 'premium'
WHERE "access_level" = 'platinum';
--> statement-breakpoint
ALTER TABLE "tryouts" DROP CONSTRAINT "tryouts_access_level_check";
--> statement-breakpoint
ALTER TABLE "tryouts" ADD CONSTRAINT "tryouts_access_level_check" CHECK ("tryouts"."access_level" in ('free', 'premium'));

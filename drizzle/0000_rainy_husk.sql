CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text,
	"event_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_events_type_check" CHECK ("activity_events"."event_type" in ('login', 'profile_completed', 'tryout_started', 'tryout_submitted', 'question_reported', 'materi_viewed'))
);
--> statement-breakpoint
CREATE TABLE "admin_members" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "admin_members_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_members_role_check" CHECK ("admin_members"."role" in ('admin', 'super_admin'))
);
--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"selected_option" text,
	"is_correct" boolean,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_answers_attempt_snapshot_unique" UNIQUE("attempt_id","snapshot_id"),
	CONSTRAINT "attempt_answers_selected_option_check" CHECK ("attempt_answers"."selected_option" is null or "attempt_answers"."selected_option" in ('A', 'B', 'C', 'D', 'E'))
);
--> statement-breakpoint
CREATE TABLE "attempt_marked_questions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_marked_attempt_snapshot_unique" UNIQUE("attempt_id","snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "attempt_question_snapshots" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"category_id" text NOT NULL,
	"sub_category_id" text NOT NULL,
	"question_text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"option_e" text,
	"correct_option" text NOT NULL,
	"explanation" text NOT NULL,
	"video_url" text,
	"access_level" text NOT NULL,
	CONSTRAINT "attempt_snapshots_attempt_question_unique" UNIQUE("attempt_id","question_id"),
	CONSTRAINT "attempt_snapshots_attempt_order_unique" UNIQUE("attempt_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"tryout_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"last_server_saved_at" timestamp with time zone,
	"last_question_index" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"correct_count" integer,
	"wrong_count" integer,
	"total_questions" integer NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"active_session_id" text,
	"auto_submit_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempts_student_tryout_number_unique" UNIQUE("student_user_id","tryout_id","attempt_number"),
	CONSTRAINT "attempts_status_check" CHECK ("attempts"."status" in ('in_progress', 'submitted', 'auto_submitted'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "materi" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category_id" text NOT NULL,
	"sub_category_id" text NOT NULL,
	"body_markdown" text NOT NULL,
	"youtube_url" text,
	"pdf_file_key" text,
	"access_level" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materi_access_level_check" CHECK ("materi"."access_level" in ('free', 'premium')),
	CONSTRAINT "materi_status_check" CHECK ("materi"."status" in ('draft', 'published', 'unpublished'))
);
--> statement-breakpoint
CREATE TABLE "materi_views" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"materi_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_reports" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" text NOT NULL,
	"question_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by_user_id" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_reports_reason_check" CHECK ("question_reports"."reason" in ('answer_key_wrong', 'explanation_wrong', 'question_unclear', 'typo', 'other')),
	CONSTRAINT "question_reports_status_check" CHECK ("question_reports"."status" in ('open', 'dismissed', 'resolved'))
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" text NOT NULL,
	"sub_category_id" text NOT NULL,
	"question_text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"option_e" text,
	"correct_option" text NOT NULL,
	"explanation" text NOT NULL,
	"video_url" text,
	"access_level" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_correct_option_check" CHECK ("questions"."correct_option" in ('A', 'B', 'C', 'D', 'E')),
	CONSTRAINT "questions_option_e_check" CHECK ("questions"."correct_option" <> 'E' or nullif(trim("questions"."option_e"), '') is not null),
	CONSTRAINT "questions_access_level_check" CHECK ("questions"."access_level" in ('free', 'premium')),
	CONSTRAINT "questions_status_check" CHECK ("questions"."status" in ('draft', 'published', 'unpublished'))
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"institution" text,
	"phone" text,
	"avatar" text,
	"photo_url" text,
	"profile_completed_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "student_profiles_status_check" CHECK ("student_profiles"."status" in ('active', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "sub_categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sub_categories_category_slug_unique" UNIQUE("category_id","slug")
);
--> statement-breakpoint
CREATE TABLE "tryout_questions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tryout_id" text NOT NULL,
	"question_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "tryout_questions_tryout_question_unique" UNIQUE("tryout_id","question_id"),
	CONSTRAINT "tryout_questions_tryout_order_unique" UNIQUE("tryout_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "tryouts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category_id" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"access_level" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tryouts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tryouts_access_level_check" CHECK ("tryouts"."access_level" in ('free', 'premium', 'platinum')),
	CONSTRAINT "tryouts_status_check" CHECK ("tryouts"."status" in ('draft', 'published', 'unpublished')),
	CONSTRAINT "tryouts_duration_check" CHECK ("tryouts"."duration_minutes" between 1 and 300)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_snapshot_id_attempt_question_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."attempt_question_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_marked_questions" ADD CONSTRAINT "attempt_marked_questions_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_marked_questions" ADD CONSTRAINT "attempt_marked_questions_snapshot_id_attempt_question_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."attempt_question_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD CONSTRAINT "attempt_question_snapshots_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD CONSTRAINT "attempt_question_snapshots_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD CONSTRAINT "attempt_question_snapshots_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD CONSTRAINT "attempt_question_snapshots_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_tryout_id_tryouts_id_fk" FOREIGN KEY ("tryout_id") REFERENCES "public"."tryouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi" ADD CONSTRAINT "materi_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi" ADD CONSTRAINT "materi_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi_views" ADD CONSTRAINT "materi_views_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi_views" ADD CONSTRAINT "materi_views_materi_id_materi_id_fk" FOREIGN KEY ("materi_id") REFERENCES "public"."materi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_student_user_id_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_snapshot_id_attempt_question_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."attempt_question_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_questions" ADD CONSTRAINT "tryout_questions_tryout_id_tryouts_id_fk" FOREIGN KEY ("tryout_id") REFERENCES "public"."tryouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryout_questions" ADD CONSTRAINT "tryout_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryouts" ADD CONSTRAINT "tryouts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");

-- Badges awarded before the return-session celebration shipped were never shown as new.
-- Mark them seen so Students are not greeted by their whole history on the first visit.
UPDATE "student_badges" SET "seen_at" = "awarded_at" WHERE "seen_at" IS NULL;

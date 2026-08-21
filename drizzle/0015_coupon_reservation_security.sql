CREATE UNIQUE INDEX "coupon_redemptions_student_coupon_active_unique"
ON "coupon_redemptions" USING btree ("student_user_id", "coupon_id")
WHERE "status" in ('reserved', 'finalized');

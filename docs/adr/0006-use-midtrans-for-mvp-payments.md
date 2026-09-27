# 0006: Use Midtrans for MVP payments

Helmi confirmed Midtrans as the MVP payment provider during the milestone review. The April proposal allowed Xendit or Midtrans. The earlier payment rules in `CONTEXT.md` named Xendit, but the implemented checkout, notifications, status sync, and operational guide use Midtrans Snap. This decision aligns the rules with that implementation.

Students use Midtrans-hosted checkout. The server grants access only after a verified notification or trusted status sync confirms payment and amount. A zero-total Coupon checkout grants access without calling Midtrans. Referral discounts remain deferred.

The dated proposals and completed plans keep their original payment examples as historical records. `CONTEXT.md`, `README.md`, and [Milestone closeout](../MILESTONE_CLOSEOUT.md) describe the current choice.

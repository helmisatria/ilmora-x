import assert from "node:assert/strict";
import test from "node:test";
import { Buffer } from "node:buffer";
import { createMidtransSnapTransaction, getMidtransTransaction } from "./midtrans-client.server";

test("creates a sandbox Snap transaction with server-side authentication", async () => {
  const originalFetch = globalThis.fetch;
  const originalServerKey = process.env.MIDTRANS_SERVER_KEY;
  const originalProductionMode = process.env.MIDTRANS_IS_PRODUCTION;

  process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-server-key";
  process.env.MIDTRANS_IS_PRODUCTION = "false";
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "https://app.sandbox.midtrans.com/snap/v1/transactions");
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      `Basic ${Buffer.from("SB-Mid-server-server-key:").toString("base64")}`,
    );

    const body = JSON.parse(String(init?.body));

    assert.deepEqual(body.transaction_details, {
      order_id: "checkout_123",
      gross_amount: 49_000,
    });
    assert.equal(body.item_details[0].price, 49_000);
    assert.equal(body.customer_details.email, "student@example.com");
    assert.equal(body.callbacks.finish, "https://ilmorax.test/checkout/123/status");
    assert.equal(body.expiry.duration, 1_440);
    assert.equal(body.expiry.unit, "minutes");
    assert.match(body.expiry.start_time, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0700$/);

    return Response.json({ token: "snap-token", redirect_url: "https://snap.test/pay" }, { status: 201 });
  };

  try {
    const transaction = await createMidtransSnapTransaction({
      orderId: "checkout_123",
      amount: 49_000,
      paymentDuration: 86_400,
      customer: {
        firstName: "Student",
        email: "student@example.com",
      },
      finishRedirectUrl: "https://ilmorax.test/checkout/123/status",
      errorRedirectUrl: "https://ilmorax.test/checkout/123/status",
      items: [{
        id: "premium-30-days",
        name: "Premium 1 Bulan",
        quantity: 1,
        price: 49_000,
        category: "premium_membership",
      }],
    });

    assert.equal(transaction.token, "snap-token");
    assert.equal(transaction.redirect_url, "https://snap.test/pay");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment("MIDTRANS_SERVER_KEY", originalServerKey);
    restoreEnvironment("MIDTRANS_IS_PRODUCTION", originalProductionMode);
  }
});

test("gets transaction status from the production API when enabled", async () => {
  const originalFetch = globalThis.fetch;
  const originalServerKey = process.env.MIDTRANS_SERVER_KEY;
  const originalProductionMode = process.env.MIDTRANS_IS_PRODUCTION;

  process.env.MIDTRANS_SERVER_KEY = "Mid-server-production-key";
  process.env.MIDTRANS_IS_PRODUCTION = "true";
  globalThis.fetch = async (input) => {
    assert.equal(input, "https://api.midtrans.com/v2/checkout_123/status");

    return Response.json({
      order_id: "checkout_123",
      gross_amount: "49000.00",
      transaction_status: "settlement",
      status_code: "200",
    });
  };

  try {
    const transaction = await getMidtransTransaction("checkout_123");

    assert.equal(transaction.transaction_status, "settlement");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment("MIDTRANS_SERVER_KEY", originalServerKey);
    restoreEnvironment("MIDTRANS_IS_PRODUCTION", originalProductionMode);
  }
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

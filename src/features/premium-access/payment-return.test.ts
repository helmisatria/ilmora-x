import assert from "node:assert/strict";
import test from "node:test";
import {
  getCheckoutIdFromPaymentReturn,
  makePaymentReturnUrl,
} from "./payment-return";

test("resolves an IlmoraX checkout from a Midtrans order id", () => {
  assert.equal(getCheckoutIdFromPaymentReturn("checkout_123"), "123");
  assert.equal(getCheckoutIdFromPaymentReturn("other_123"), null);
  assert.equal(getCheckoutIdFromPaymentReturn("checkout_"), null);
  assert.equal(getCheckoutIdFromPaymentReturn(undefined), null);
});

test("builds stable Midtrans dashboard return URLs", () => {
  const originalAppUrl = process.env.APP_URL;
  process.env.APP_URL = "https://ilmorax.test/";

  try {
    assert.equal(makePaymentReturnUrl("finish"), "https://ilmorax.test/payment/finish");
    assert.equal(makePaymentReturnUrl("error"), "https://ilmorax.test/payment/error");
  } finally {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
  }
});

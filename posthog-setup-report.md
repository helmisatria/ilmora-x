<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into IlmoraX (TanStack Start). Here's what was set up:

- **Client-side SDK** (`@posthog/react`): `ProductAnalyticsProvider` added to `src/routes/__root.tsx`, wrapping the app with a small analytics adapter.
- **Server-side SDK** (`posthog-node`): Singleton client created at `src/lib/product-analytics-server.ts` for server-side event capture.
- **Reverse proxy**: Vite dev server configured to proxy `/ingest/*` → `us.i.posthog.com` and `/ingest/static` + `/ingest/array` → `us-assets.i.posthog.com`.
- **Environment variables**: `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` set in `.env`.
- **User identification**: `posthog.identify()` called with user ID, name, and institution on profile completion.
- **14 custom events** instrumented across 6 key files covering the login, onboarding, tryout, premium, checkout, and poll flows.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `login_with_google_clicked` | User clicks "Masuk dengan Google" on the login page | `src/routes/auth/login.tsx` |
| `profile_step_advanced` | User advances from step 1 (name) to step 2 (institution) during onboarding | `src/routes/auth/complete-profile.tsx` |
| `profile_completed` | User successfully completes their profile and is redirected to dashboard | `src/routes/auth/complete-profile.tsx` |
| `tryout_started` | User starts or resumes a tryout attempt | `src/routes/tryout.$id.tsx` |
| `tryout_submitted` | User manually submits a tryout, including answered count | `src/routes/tryout.$id.tsx` |
| `tryout_question_reported` | User reports a question during a tryout attempt | `src/routes/tryout.$id.tsx` |
| `tryout_review_opened` | User clicks "Review Pembahasan" after seeing their results | `src/routes/results.$attemptId.tsx` |
| `premium_unlock_banner_clicked` | User clicks "Unlock" on the locked answers banner on the results page | `src/routes/results.$attemptId.tsx` |
| `premium_package_selected` | User selects a premium package on the /premium page | `src/routes/premium.tsx` |
| `premium_checkout_clicked` | User clicks "Lanjut bayar" to proceed to checkout | `src/routes/premium.tsx` |
| `coupon_applied` | User submits a coupon code on the checkout page | `src/routes/checkout.tsx` |
| `payment_method_selected` | User selects a payment method (Xendit, Midtrans, or Transfer Bank) | `src/routes/checkout.tsx` |
| `checkout_pay_clicked` | User clicks "Bayar sekarang" on the checkout page | `src/routes/checkout.tsx` |
| `poll_joined` | User successfully joins a live poll session | `src/routes/poll.join.tsx` |

## Next steps

We've built a dashboard and 5 insights to monitor key user behavior:

- [Analytics basics dashboard](/dashboard/1589258)
- [Onboarding conversion funnel](/insights/lLhPvct2) — login click → profile completed
- [Premium purchase funnel](/insights/fGYNraNF) — checkout clicked → pay button clicked
- [Tryout completion rate](/insights/OdNx6LwC) — tryouts started vs submitted over time
- [Poll join activity](/insights/NhSooQB8) — users joining live poll sessions over time
- [Premium upsell clicks](/insights/a2bMzvMJ) — unlock banner clicks vs checkout clicks

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

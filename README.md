# Kiya Clean Co.

Residential cleaning website and prelaunch customer operations platform.

## Current release status

**NO-GO for public commercial launch, online bookings, and payments.** The source in [draft PR #1](https://github.com/ebyron357/kiya-clean-co-/pull/1) includes quote intake, customer accounts, owner read-only request review, booking/estimate domain contracts, and newly developed **Stripe test-only payment foundations**. The current public deployment is not a verified release of these changes.

The approved customer payment choices are: **pay the complete owner-approved price upfront**, or **pay an owner-approved deposit and the remaining balance later**. The deposit amount, policy, tax, and pricing are **not** configured. The Stripe endpoints return 503 until approved storage/auth/security integration is connected. Do not try to charge real customers.

## Development

Use the package manager version pinned in `package.json`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Browser tests use a local server and synthetic environment placeholders. They intercept successful quote submission and do not need live Supabase credentials:

```bash
corepack pnpm exec playwright install chromium
corepack pnpm test:browser
```

## Main code paths

- `app/page.tsx` and `components/home-sections.tsx` — public marketing pages and UI.
- `components/quote-wizard.tsx`, `app/api/quotes/route.ts` — cleaning requests, not confirmed appointments.
- `lib/pricing.ts`, `lib/estimate-operations.ts`, `lib/availability.ts`, `lib/booking-operations.ts` — deterministic calculations and reservation domain contracts.
- `lib/payments/payment-plan.ts` — approved full/deposit/balance amounts and hold expiry.
- `lib/payments/stripe-test.ts` — restricted test-key Stripe Checkout and signed webhook verification.
- `lib/payments/payment-workflow.ts` — atomic payment store contract, fail-closed checkout coordination, and verified webhook events.
- `components/payment-choice.tsx` — approved-payment choice UI, **not activated in public pages**.
- `app/api/payments/checkout/route.ts`, `app/api/payments/webhook/route.ts` — server endpoints deliberately blocked until real persistence is approved and connected.
- `app/payment/return/page.tsx` — never treats a redirect as proof of payment.
- `lib/supabase/` — existing Supabase auth and quote persistence.

## Secrets and safety

Keep all credentials in the intended provider environment settings, never in repository files or chat. The Stripe implementation requires an explicit `KIYA_STRIPE_TEST_ENABLED=true`, `sk_test_` secret key, matching `whsec_` webhook secret, and a trusted HTTPS `KIYA_CHECKOUT_ORIGIN`; **even with those values**, payment remains unconfigured until the authorized atomic store is implemented. A `sk_live_` key is rejected.

## Canonical launch source of truth

Read [LAUNCH_READINESS.md](LAUNCH_READINESS.md) for verified tests, missing prerequisites, approved decisions, owner actions, release restrictions, and the next engineering step. Keep that document complete and updated rather than appending scattered contradictory launch claims.

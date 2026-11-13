# Kiya Clean Co. — canonical launch-readiness record

**Updated:** November 13, 2026
**Release decision:** **NO-GO** for public commercial launch, bookings, and payments.
**Current candidate source branch:** `improve/kiya-consolidated-readiness`, based on recovery draft PR #1. Earlier PRs remain open and unmerged. See [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md) for the reconciliation and activation checklist.
**Deployment:** An earlier website is deployed; the latest source changes are not merged, promoted, or verified on a public live deployment. A Vercel READY state is not end-to-end launch evidence.

This document supersedes earlier launch-readiness counts and status summaries while preserving their verified historical evidence. The product is intended to support paid residential cleaning with **two owner-approved choices: pay in full or pay a deposit, with the remaining balance paid later**. Approval of these two options does not approve a particular price, deposit amount, cancellation policy, or provider credential.

## November 13 improvement verification

- 162 unit/contract tests passed; TypeScript and optimized Next.js build passed.
- 22 local desktop/mobile browser checks passed with inert database config; successful quote writes were intercepted. Includes review/edit preservation, focus on success, signed-out access boundaries, no invented contacts, and numeric-only funnel payloads.
- Owner inbox now has requested/withdrawn filters, stable 25-row pagination, authorized detail review, draft-email and call links. It remains read-only.
- Quote inserts record contact-consent evidence and privacy version. Sandbox-only email adapter schedules only after a new insert and never sends to submitted customer addresses. No live mail delivery or durable outbox is implemented/verified.
- Strict approved-business-profile publishing, direct privacy contact slot, more specific hero copy, and privacy-safe public analytics are implemented. Real approved business values, authentic assets and legal/retention decisions are still missing.
- Web Analytics is enabled at project level; the instrumentation flag is Preview only. No production deployment or production environment variable changed. Deployed event ingestion and authenticated owner/customer operations remain unverified at this source checkpoint.
- No live schema/RLS inspection, database write, real email, booking, Stripe session, charge, refund, production promotion or PR merge occurred. Payment endpoints remain deliberately disabled pending the pre-existing transaction/isolation gates below.

The November 7 evidence below is historical; it does not supersede these boundaries or prove the current external services.

## 1. Product and brand baseline

- Preserve the Kiya Clean Co. identity, plum/ivory styling, existing project records, ownership boundaries, service catalog, and routes. The November 7 cleanup replaced AI-template marketing copy, removed unused starter imagery and the `v0.app` metadata tag, corrected misleading coverage wording, and removed inactive rewards promotions from primary navigation.
- Current imagery includes generated residential interiors; authentic owner-approved photography, logo/icon review, final design approval, and mobile visual acceptance remain open.
- Public marketing pages: home, services and four service details, about, contact and FAQ, ZIP-based service-area request, quote wizard, preliminary policy pages, and truthful inactive rewards/referrals pages. Search indexing remains disabled pending approved launch.
- No invented phone number, operating hours, staff credentials, ratings, insurance claims, service ZIP codes, business rates, or customer testimonials.

## 2. Existing working application foundations

- Six-step quote intake validates ZIP, service, home size, extras, frequency, contact, consent, and optional date. Quotes are requests, not bookings or price commitments.
- Supabase quote persistence adapter, duplicate-submission checks, same-origin JSON validation, payload limits, honeypot, rate limiter, and trusted customer identity checks exist in source.
- Customer email/password auth and account views; server-gated customer request details and preferences; pending quote withdrawal; read-only owner request list using trusted `app_metadata`.
- Pricing arithmetic supports owner-supplied rules in integer cents; no approved live rate configuration exists.
- Estimate lifecycle, availability candidates, and booking/staff transition contracts have isolated tests but are not connected to reviewed live storage, scheduling resources, or paid-job operations.
- Existing Supabase foundation tables have been reported previously; exact current DDL, grants, RLS predicates, constraints, and migration state have **not been independently inspected** in this latest work. Do not assume a table's presence or a named RLS policy proves data isolation.

## 3. Approved Stripe test-mode payment implementation

Source additions under `lib/payments/`, `app/api/payments/`, `components/payment-choice.tsx`, and `app/payment/return/`:

- Payment choices `full` and `deposit`; stages `initial` and `balance`.
- Full payment uses the exact approved total. Deposit payment uses an explicitly approved amount, retains the outstanding balance, and permits a balance checkout only after the deposit-paid state is durably verified.
- Unknown, negative, fractional, expired, under-minimum, unapproved, and customer-supplied price variants fail closed. Approved offer/terms, authenticated ownership, and a reservation hold must be present.
- Stripe Checkout adapter is **test-only**, accepts `sk_test_` credentials and explicit opt-in, uses card payments and USD, pins Stripe API version `2026-10-28.endive`, and verifies returned amount, session test-mode identity, and hosted Checkout URL.
- Raw-body Stripe webhook HMAC verification checks signatures and event timestamps before parsing payment events. Signed results require an atomic event ledger, exact session/booking/amount reconciliation, and reservation authority before any paid/confirmed status is written.
- Checkout sessions cannot outlive the approved booking hold; saved sessions must match actor, booking, payment choice, and payment stage; orphan sessions are expired on local attach failure when possible. Stripe redirect landing page makes **no** payment or booking confirmation claim.
- Reusable payment-choice UI is implemented but deliberately not attached to a public booking page until a durable authorized booking is supplied.
- Both public endpoints deliberately return **503** without correct test-mode configuration and a verified durable payment adapter. **The repository still uses an intentionally unconfigured payment store**. There is currently no executable, backed reservation-to-payment transaction.

**Not completed:** no connected Stripe account, no active webhook destination, no test Checkout Session with a real `sk_test_` key, no live payment authorization, no database payment ledger or atomic reservation adapter, no deposit-balance invoice or receipt, no refund/reconciliation operations, and no production payment capability.

## 4. Historical source-level verification (November 7, 2026)

Verified in an isolated Vercel sandbox, with synthetic data and no live customer mutations:

| Check | Result | Boundary |
| --- | --- | --- |
| TypeScript | PASS | Source compilation |
| Next.js optimized production build | PASS | Builds routes but does not verify external services |
| Unit and contract tests | **150 passed, 0 failed** | Synthetic/mocked database and payment providers |
| Desktop/mobile Playwright | **16 passed, 0 failed** | Local browser, quote success mocked |
| Local HTTP smoke tests | **11 passed, 0 failed** | Invalid quote attempts, baseline security, disabled payment endpoints |
| Live Supabase schema/RLS inspection | **UNVERIFIED** | Connected Supabase inspection returned permission denied |
| Actual Stripe test payment + webhook processing | **UNVERIFIED** | No test credentials or atomic persistence; endpoints disabled |
| Authenticated customer A/B isolation | **UNVERIFIED** | Controlled identities and verified test database not available |
| Deployment of current branch | **NOT DONE** | Draft PR remains unmerged |

Historical evidence: earlier phases exercised a mobile six-step quote flow and a synthetic QA request and reported foundational RLS and table names. These earlier reports do not replace current authorized database inspection or a live paid-booking test.

## 5. Release-critical engineering work

1. **Inspect the actual database** through authorized read-only schema, migration, RLS, grant, index, constraint, and database-backup evidence. Confirm a **data-isolated non-production environment**; do not reuse production customer records for tests.
2. Implement owner-only configuration for verified service ZIPs, cleaning scope, exclusions, working windows, team/resource availability, service durations/buffers, timezone, approved rates, taxes/fees, and deposit amount/terms. The browser must never choose amounts or approval status.
3. Implement **atomic reservation and payment storage** against a reviewed migration: authenticated customer/order ownership; exclusion/locking to prevent double booking; hold expiry; unique checkout claim/session/event IDs; pricing snapshot; versioned terms; deposit and outstanding balance; durable event replay and refund reconciliation; auditable outbox. No read-then-insert outside a transaction.
4. Connect `PaymentStore` to the reviewed storage and replace `unconfiguredPaymentStore` only after isolation/security evidence. Keep `KIYA_STRIPE_TEST_ENABLED` limited to test keys; do not add live keys or create real charges.
5. Connect owner-approved availability and appointment management to the booking state machine. Handle expired holds, late webhook delivery, conflicting reservations, canceled/failed payments, duplicate events, and overdue balances without false confirmations.
6. Wire authenticated booking detail and payment-choice UI only to verified approved offers; add secure balance-payment initiation, customer receipts, owner payment and refund views, notifications, and cancellation/rescheduling handling.
7. Integrate a sandbox email sender and test account recovery and customer/owner notifications. Do not send production mail during development.
8. Complete legal/owner review: public contact details, service scope, availability ZIPs, taxes/fees, deposit/refund/cancellation terms, policies, and business identifiers; replace or explicitly approve photography and final design.

## 6. Test-only configuration

Do not put secrets into source, chat, `NEXT_PUBLIC_` variables, or committed local files.

- `KIYA_STRIPE_TEST_ENABLED=true` — explicit feature switch; must remain off until durable persistence is ready.
- `STRIPE_SECRET_KEY=sk_test_...` — secret, test-mode only; live keys are rejected in code.
- `STRIPE_WEBHOOK_SECRET=whsec_...` — secret for the exact test webhook destination.
- `KIYA_CHECKOUT_ORIGIN=https://<verified-preview-origin>` — trusted HTTPS host; never derived from request headers.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — maintain existing separated browser/server access; never expose the service-role key to clients.
- `AUTH_RECOVERY_ENABLED` remains off until a verified mail and recovery flow exists.

The test webhook path is `/api/payments/webhook`; the checkout POST path is `/api/payments/checkout`. Do not register the webhook for real customer activity while it responds 503. Stripe sessions and events must never be acknowledged as paid before durable, authenticated, exact-amount reconciliation.

## 7. Owner decisions still needed

- Approved actual cleaning rates, minimum charges, extras, taxes/fees and service scope.
- **Deposit amount or rule**, whether refundable, when the balance is due, and what happens when a customer cancels or does not pay.
- Accepted service ZIPs, real available staff/resources and work times, booking lead time and company timezone.
- Verified business contact details, customer policies, and authority to use photography/logos.
- A test-only Stripe account/key/webhook setup entered directly into the secret manager when engineering preconditions are met; controlled test accounts and a separate safe test database.

These are genuine missing inputs. The code work above has been completed independently of them; they do not justify making up values.

## 8. Launch gates and decision

**NO-GO remains mandatory** until all of these have fresh evidence:

- Owner configuration is reviewed and persisted; actual service area and rates are correct.
- Authenticated reservation availability, locking, expiry, cancellation, and rescheduling pass concurrency tests.
- Test full-payment and deposit-plus-balance flows succeed end to end, including Stripe signature validation, duplicate/replayed/out-of-order webhooks, failures, refunds, real receipts and reconciliation.
- Customer A/B and admin/staff authorization tests pass against isolated real Supabase RLS.
- All required policies and notifications are approved and tested, monitoring/backup/restore are in place, and production rollout/rollback is rehearsed.
- No unresolved high-risk defects, exposed secrets, fabricated public claims, or unauthorized payment/production changes.

**Next engineering action:** gain authorized, read-only schema/RLS evidence and isolated staging storage; then implement and test the atomic `PaymentStore` and reservation adapter. No production release, PR merge, live payment, new paid account, or database mutation is authorized or claimed by this record.

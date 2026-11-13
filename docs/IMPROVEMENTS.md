# Consolidated improvement work — November 13, 2026

## Source reconciliation

The recovery implementation is the consolidation base, not the smaller homepage replacement. It preserves the existing plum/ivory identity, customer account/auth routes, full six-step quote contract, owner-only request details, service pages, security checks, and disabled Stripe test-mode foundations. The homepage proposal's review/edit and consent-evidence ideas are incorporated without replacing the larger application or its quote schema.

This is a new reviewable draft against `main`, which currently contains no application source. PR #1 and PR #2 are **not merged or closed**. Review the consolidated draft before choosing a single release source; do not merge the smaller homepage replacement afterward over these routes. Nothing here promotes a production deployment.

## Ten requested improvements

| Improvement | Implemented or retained | Still required |
| --- | --- | --- |
| 1. Unified source | Recovery app plus selected homepage improvements in one draft | Owner/reviewer acceptance and one controlled merge; production remains unchanged |
| 2. Quote notifications | Insertion-only scheduling, sandbox Resend adapter, separate customer/owner templates, per-request/audience keys, timeouts and generic failures | Verified sender, test inbox and provider key; durable transactional outbox, retries, bounce/delivery handling, isolation tests, and approved live recipients before customer delivery |
| 3. Owner inbox | Trusted server-role gate, status filter, stable pagination, detail review, draft-email/call links | Actual owner-account verification; schema-reviewed follow-up/estimate/status transactions and audit history |
| 4. Business details | Strict explicitly approved profile publishes contact, privacy email, area label, ZIP list and response time when supplied | Real owner-approved values and final service checklist/exclusions; no invented details |
| 5. Headline | Benefit-led copy, no-payment/account reassurance, optional approved location | Owner approval of geographic content |
| 6. Trust signals | No fabricated ratings, insurance claims or testimonials added | Authentic photos, permission to use them, genuine review text and attribution; existing generated interiors are not evidence of completed jobs |
| 7. Accessibility | Retained unrestricted zoom, focus styles and mobile navigation; added quote-review edits and focus on success | Human assistive-technology review and authenticated operator-flow check |
| 8. Privacy | Versioned contact-consent evidence, validated direct privacy-email slot, explicit disclosure of missing retention/contact gates | Approved retention duration, deletion/access workflow and legal review; no automatic deletion added without approval |
| 9. Booking/payments | Retained tested full/deposit/balance calculations and test-only Stripe guards; endpoints remain disabled | Reviewed schema/RLS, isolated staging, atomic no-double-booking/payment ledger, approved prices/ZIPs/timezone/staff/terms, real test-mode E2E; no live charges |
| 10. Funnel measurement | Public-path allowlist, query/fragment removal, start/step/validation/success/failure/abandon events containing numeric step only; DNT/GPC respected; production tracking off | Confirm actual event ingestion; abandonment is best-effort on pagehide/unmount, not guaranteed delivery |

## Nonsecret content configuration

`KIYA_BUSINESS_PROFILE` is server-only JSON. Only a profile with `approved: true` and valid fields is displayed. Supported optional fields: `email`, `privacyEmail`, `phone`, `areaLabel`, `serviceZips` (five-digit strings), `responseTime`. Do not mark it approved until the owner approves the actual values. It does not set prices or authorize booking. Missing/invalid profiles publish no invented contacts or coverage promises. Public/static marketing pages need a new build after profile changes.

No customer data, credentials, prices, or fake testimonials belong in this document.

## Analytics configuration

`NEXT_PUBLIC_KIYA_ANALYTICS_ENABLED=true` is set for Preview only. Web Analytics is enabled at project level; Pro usage charges may apply. The current production deployment and its environment variables were not changed. Future production tracking still needs an explicit production flag and a reviewed deployment.

Only `step` (1–6) is attached to quote events. No email, ZIP, service, notes, quote ID, auth state, amount, raw error, query string or fragment is attached. Private paths and unknown routes are dropped before transmission. Metrics failure never blocks quote submission.

## Email sandbox setup and limits

Set these through provider/project secret configuration, never chat or committed files:

- `RESEND_API_KEY` — secret, for the verified sender.
- `KIYA_EMAIL_MODE=sandbox` — the only accepted mode; live is rejected.
- `KIYA_EMAIL_FROM` — verified sender email.
- `KIYA_EMAIL_TEST_RECIPIENT` — controlled test inbox.

Neither template sends to the customer's submitted address. Templates contain only a request reference and neutral instructions. No customer names, notes, phone numbers or home details are included. Notifications run only after a newly inserted quote; exact retries do not send another notification. Quotes stay saved if scheduling or email fails.

This is **not** durable mail delivery. A crash after insert can lose a notification; failures require operator review and no automatic retry is provided. Provider idempotency keys expire after 24 hours. Do not enable live customer delivery without a reviewed transactional outbox and durable delivery/retry state. Provider acceptance is not inbox delivery proof. No real email was sent in this work.

## Inputs needed before completing activation

1. Approved public email, phone, privacy contact, service ZIPs/area label and response-time promise.
2. Genuine team/job photos and reviews with usage permission.
3. Approved service scope/exclusions, prices/extras/taxes, deposit amount, balance timing, cancellation/refund terms, operating timezone/hours/staff and retention/deletion policy.
4. Controlled staging database with schema/migration/RLS/grant/constraint evidence and two customer test identities plus an owner identity. The connected Supabase resource is listed for production, preview and development; resource availability alone is not isolation proof. Do not test with production customer records.
5. Verified email sender/test inbox and provider key entered directly in secret configuration. Stripe sandbox access exists at integration level, but payment ledger/booking storage is still unconfigured and must be completed before using it.

The owner inbox requires a Supabase user whose trusted **app_metadata.role** is `admin`; customer-editable metadata never grants access. No preview account or authorization bypass was added. Authenticated owner/customer operations remain unverified without controlled identities.

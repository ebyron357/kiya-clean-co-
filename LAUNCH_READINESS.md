# Kiya Clean Co. — launch readiness

Status: PARTIALLY COMPLETE. Pre-launch/staging foundation, not production ready. No live domain deployment or payment activation performed.

## Implemented
- Plum/ivory responsive public website with original generated interior photography; home, services, four service-detail pages, about, service areas, rewards, referrals, seasonal page, contact/FAQ, and preliminary legal notices.
- Mobile navigation, sticky quote CTA, ZIP entry, six-step quote wizard with Zod validation and React Hook Form. No invented rates, coverage, reviews, credentials, or availability.
- Real Supabase quote persistence with duplicate submission IDs, database-backed throttling, same-origin checking, honeypot, consent fields, and server-validated content. Prices submitted by the browser are not used.
- Deterministic integer-cent pricing engine and eight example-only unit tests. Live pricing remains intentionally unconfigured; the engine records an unconfigured price status rather than a fake quote.
- Supabase email/password signup, confirmation callback, sign-in, sign-out, session refresh, server-gated customer dashboard, own quote list, pending-request withdrawal, preferences storage, and own reward-ledger readout.
- Server-gated read-only admin request list. Admin role uses trusted app_metadata, never user_metadata. No public role assignment.
- Database foundations: kiya_quotes, kiya_preferences, kiya_reward_ledger, kiya_referrals, kiya_settings, kiya_audit, kiya_rate_limits. RLS enabled on every table. Ledger and referrals are not client-writable.
- Booking/payment interfaces with explicit unconfigured implementations; no fabricated confirmation or checkout.
- Metadata, manifest, baseline security response headers, reduced-motion support, visible focus styles, form labels, and error recovery screen.

## Verified
- TypeScript check passed before final verification.
- Production build passed after correcting BigInt target compatibility.
- Final pnpm test: 15 tests passed (eight pricing and seven request-validation tests). Final pnpm build passed, including TypeScript.
- Pricing coverage: unconfigured pricing, integer-cent breakdown, duplicate/unknown extras, negative/fractional rates, excessive discounts, and zero-floor credit. Request coverage: valid input, invalid ZIP, missing consent, honeypot, oversized notes, unknown extras, and stripping browser totals.
- Final mobile homepage: document width 375 matches viewport 375; zero broken images.
- Browser at 375 x 812: mobile menu, invalid ZIP validation, all six quote steps, extra selection, biweekly preference, review, and successful database-backed request response.
- One labeled QA request was saved: name Automated QA Test, email kiya-qa@example.com, notes explicitly stating no service is required. Do not treat it as a customer lead.
- Anonymous /admin navigation redirects to /auth/login.
- Final homepage screenshots captured at 375 x 812 and 1440 x 1000.

## Unverified / unfinished
- Full authenticated signup/login lifecycle requires a controlled mailbox and configured email delivery; no test identity was fabricated. Customer-to-customer RLS isolation has not been independently exercised.
- A standalone database verification command could not run because application credentials are not exposed to the Bash runtime. This does not imply missing application configuration: browser quote submission succeeded. No credentials were printed.
- Live pricing configuration/editor, ZIP coverage enforcement, tax jurisdiction rules, promotions, and credit-eligibility lookup are not implemented. Pricing engine values must be sourced only from trusted server configuration; never accept eligibility values from customers.
- Real scheduling adapter, availability, booking state machine, cancellations/rescheduling, payments/deposits/refunds/receipts, verified webhooks, and reconciliation are not implemented.
- Loyalty earning/redemption, referral links/attribution/qualification, reversible rewards, review requests, account closure, password recovery, and advanced account history are not implemented. Existing tables are foundations, not completed programs.
- Owner configuration editing, customer management, audit-event emission, retention jobs, conversion tracking, outbound email/SMS, and analytics are not implemented. Automatic confirmation email is explicitly unavailable.
- No published service-area list, contact details, verified insurance/staff credentials, approved policies, or approved reward values. Preliminary notices require legal/owner review.
- Full automated security/accessibility coverage and a durable production rate-limit cleanup policy remain outstanding. Current throttling relies on the trusted deployment proxy's forwarded IP; verify trusted-header handling before release.

## Environment
Provided by Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (public browser-safe key), SUPABASE_SERVICE_ROLE_KEY (server-only), NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL (preview auth callback). Never put the service key in a public variable. Other injected Postgres credentials are unused.

No payment, calendar, email, analytics, or AI integration is used by this app. Do not add keys until a provider implementation is selected and approved.

## Essential owner actions
1. Supply approved contact details, service ZIP codes, service inclusions/exclusions, rates, taxes/fees, and cancellation/privacy terms.
2. Select the authoritative booking provider and payment approach, then connect sandbox credentials for development; do not enable live payments yet.
3. Provide a controlled mailbox for end-to-end auth testing and approve the initial administrator identity. Admin provisioning must be a trusted backend operation, not public signup.
4. Approve reward/referral rules before their implementation is enabled.

## Next engineering action
Implement protected owner configuration and load validated coverage/pricing from it, then connect one booking provider. Remaining unfinished code is engineering work, not merely an owner-credential blocker.

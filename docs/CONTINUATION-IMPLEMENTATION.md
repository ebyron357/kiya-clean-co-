# Implementation continuation — November 6, 2026

This is a code extension to the existing PR, not a replacement audit or rebuilt site. Prior recovery, date/retry/recovery-gate/admin-detail/booking-staff/mobile/isolation code remains. No migration files were found beyond the two prepared read-only catalog scripts; there is still no authoritative repository definition for the owner-reported booking migration.

## Runtime application changes

### Quote persistence adapter

The existing `/api/quotes` path now uses `submitQuote` and `quoteRepository` instead of embedding storage orchestration in the handler. The actual Supabase adapter is wired into the application and uses **only the existing `kiya_quotes` field contract**, preserving manual estimate semantics and existing duplicate-payload comparison. Rate limit now explicitly requires a boolean true result rather than treating arbitrary truthy RPC output as permission.

The application service derives user identity from the server Auth dependency, stores no browser-supplied amount/owner/status, and returns only a generic receipt. Rate-limit/auth outages fail closed. Duplicate insert errors trigger an ID-specific lookup; unrelated unique conflicts/missing rows/read errors do not become success. Provider database errors are not returned or logged with sensitive content.

Ten tests execute the actual adapter against a structural fake Supabase port. They cover guest/signed-in ownership, exact retries, changed payloads/owner mismatch, limiter/auth failure, unrelated uniqueness failures and provider-error privacy. These are **adapter contract tests, not live Supabase inserts, RLS or constraint verification**. Production persistence integration remains unverified. Existing pricing engine is preserved; quote submission deliberately stores unconfigured pricing.

### Customer request detail

Added `/account/quotes/[id]`, linked from existing request history. It authenticates with server `getUser`, uses the session client (not service-role), filters both record ID and user ID, rechecks returned ownership, and projects only customer-facing fields. Invalid/nonowned IDs share not-found behavior; storage errors are generic. Existing pending withdrawal action is reused; no new status mutation/guessed column is introduced.

The page shows the saved request, preferred date and instructions, and explicitly distinguishes requests from appointments/invoices/payments. Online acceptance/conversion remains unavailable until a safe persistence adapter exists. Seven tests exercise owner filters/projection/error/privacy behavior. Browser signed-out coverage now includes this route. Authenticated rendering and real two-customer RLS remain **UNVERIFIED**; no test identity or customer row was accessed.

## Executable domain modules — deliberately not live features

### Estimates

`lib/estimate-operations.ts` implements submitted → under review → quoted → accepted/declined/expired → converted transitions. Quote publication requires a trusted, active approval ID/terms version; no real rate is seeded. Validated USD integer-cent line arithmetic prevents negative/fractional/overflow totals or discounts exceeding subtotal. Customer acceptance/decline requires authenticated ownership and a nonexpired offer. Admin cannot impersonate a customer, staff cannot prepare/accept, accepted terms cannot silently be requoted, and transition results include versioned audit events without mutating the source.

`EstimateRepository` specifies atomic compare-and-swap, actor+idempotency key/payload, trusted approval lookup, audit/outbox persistence and transactional reservation on conversion. There is **no live estimate adapter, persisted quote-status mapping, exposed mutation route, payment, delivery or real booking conversion**. Existing requested/withdrawn SQL states are not replaced by guessed enum values. Fourteen tests include a serialized in-memory repository for competing revisions/retries; not a database atomicity claim.

### Availability

`lib/availability.ts` calculates deterministic candidate intervals from approved services/explicit ZIP coverage/resources/windows/durations/steps/buffers/notice. It excludes blackouts and existing resource conflicts, deduplicates overlapping windows, sorts results, validates safe integer times and bounds query amplification. Candidates align to owner-window anchors, not arbitrary customer query times. Missing approval yields no invented availability.

Thirteen tests cover these rules, including buffered boundaries, existing reservation buffers, blackouts, resource separation, query limits and input immutability. All test service/ZIP/time values are synthetic; none are owner-approved production rules. No public availability endpoint/calendar is activated. Owner-local recurring calendars, timezone/DST expansion, resource capacity, live completeness and transactional revalidation are still required; absolute-time arithmetic is not a complete scheduling provider.

## Evidence and safety

- New tests: 10 quote adapter + 7 customer quote + 14 estimate + 13 availability = **44 new tests** on top of the previous 82.
- Final totals: **126 unit/contract tests passed**; **12 desktop/mobile Playwright checks passed**, including the previous ten, customer-detail signed-out redirects, and new real local production-handler checks for missing Origin, invalid schema/JSON, and UTF-8 body limits. Valid quote browser submissions remain mocked; these invalid HTTP requests terminate before database calls.
- The loopback browser harness now consistently uses `localhost` for both server hostname and request Origin. An initial `127.0.0.1` request against Next’s localhost-normalized handler URL correctly failed the strict origin check; the harness was aligned, not the security check relaxed. Deployed proxy-origin compatibility remains separately unverified.
- Type checking and production build passed. Full production/development dependency audit reported zero advisories. An initial new fixture-helper syntax error and a Supabase generic structural-type recursion error were fixed; the latter uses narrow typed closures rather than suppressing type checking or casting the entire client.
- Final commands/outcomes and exact preview head are recorded in the PR after verification. No successful live database/customer/payment/email integration is claimed.
- TypeScript extension imports are enabled under existing noEmit mode so the tested TS adapter modules are exactly the ones bundled by Next; no transpile-only alternate test implementation.
- No dependency added. Existing branding/design unchanged. No SQL/RLS/env mapping edits, new infrastructure, customer records, provider mail, charges, recovery activation or public production launch.

## Exact remaining integration requirements

1. Reviewed definitions for the existing quote, estimate/customer/address/booking objects, unique keys/FKs/check constraints/status rules, migrations/RLS/grants/functions/indexes. The known kiya_quotes contract supports its adapter; unknown booking/estimate schema does not justify guessed adapters or destructive replacement tables.
2. A data-less isolated database or existing approved test resource with reviewed schema and disabled outbound jobs, then coherent non-production-only mapping under explicit approval. No test write to the shared production project is allowed. The existing isolation runbook is unchanged; no repeated screenshots requested.
3. Controlled customer A/customer B/admin/staff identities and owned test inboxes for session/RLS/lifecycle/delivery verification. Owner enters secrets directly into supported configuration; never chat.
4. Approved business catalogue, ZIP coverage, prices, terms, duration/buffer/timezone rules before publishing estimates/availability. Live estimate storage must atomically link accepted revision to a validated reservation; not merely trust a submitted booking ID.
5. Remaining engineering/integration: profile/property/address editing and notification preferences; full estimate UI/approved settings editor; real calendar/recurrence/change/assignment storage; invoices/payment/webhooks/refunds/reconciliation; durable notification outbox/retries; staff UI, backups/restore/monitoring and complete E2E. Newly tested domains are not substitutes for those missing modules.

**NO-GO remains.** This iteration ships a production-code adapter seam and customer detail route plus tested business logic, not a complete operational business platform.

# Resumed implementation — November 6, 2026

This extends Draft PR #1, preserving the recovered source and previous fixes. It is **not mission completion** and production remains **NO-GO**.

## Shipped in this PR extension

### Account recovery — implemented, deliberately inactive

- Forgot-password and reset-password views, linked from sign-in.
- Supabase SSR PKCE reset request/callback/password update wiring; callback destinations are an exact allowlist, with generic invalid/expired-link handling and no code/provider-error logging.
- Password updates require a server-verified confirmed-email session in the action itself and use that session's client, never a service-role key or a submitted user ID. Matching 12–128-character passwords required.
- Server-only `AUTH_RECOVERY_ENABLED` must be exactly `true` to request mail/update passwords. **Not set or enabled in Vercel by this work.** The default public form is visibly disabled and explains that no email is sent. An ordinary verified signed-in session can change its own password; this is not represented as proof that the session originated in a recovery email.
- Generic request receipts do not disclose account existence or claim delivery. Provider throttling/CAPTCHA, SMTP and exact allowed callbacks must be reviewed and tested before activation. PKCE links must be opened in the requesting browser.
- 12 dependency-injected tests use synthetic provider responses; no email or real password update occurred. These tests do not prove real Auth delivery or session behavior.

References used: [Supabase reset request](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [SSR PKCE](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [Next Server Actions security](https://nextjs.org/docs/app/guides/server-actions).

### Quote date and safe retries

- Optional preferred cleaning date added to the existing six-step wizard and review. Validated on client/server; real calendar dates today or later in UTC, or blank for flexibility. Existing clients can omit it.
- Date is carried in the existing `details` object; no new column or migration assumed. Preferred date is explicitly **not a reserved or available slot**. Manual estimate/no invented total behavior remains.
- Duplicate UUID retries now compare submitted identity/contact/consent/details. Same request succeeds; changed payload returns generic conflict rather than falsely claiming the new information was stored. Existing rows are never returned to the caller. New preferred-date field handles legacy missing/blank values. Live uniqueness constraints and database behavior remain unverified.
- 4 new date tests and 7 retry-comparison tests.

### Owner lead details

- Added `/admin/quotes/[id]`, linked from the existing persisted-request list.
- Every request checks Supabase getUser and trusted app_metadata admin role **before** any service-role quote query. UUID parsing, not-found and storage-error states included.
- Shows saved contact/property preferences, add-ons, preferred date, consent and instructions using existing quote fields; no mock revenue or fabricated customer records.
- Read-only. Estimate approval, booking conversion and delivery controls are explicitly unavailable rather than inert pretend buttons.
- Signed-out redirects covered in local browser tests. Authenticated admin reads/customer-role denial require controlled identities and isolated data; not verified live.

### Booking/staff domain implementation — contract tests only

`lib/booking-operations.ts` implements lifecycle transition validation/audit-event construction, assigned-staff-only start/completion/escalation, checklist completion gating, customer-owned cancellation/reschedule **requests**, and a whitelisted staff-job projection excluding billing and unrelated identities.

Reservation commands validate identity/interval/buffer input and delegate to an explicit atomic storage contract. Buffer-aware half-open overlap arithmetic is tested. The contract requires an adapter to enforce approved availability, durations, blackouts, ownership, idempotency, reservation and audit/outbox writes under DB atomicity. No adapter/endpoint/calendar is activated.

16 tests include a **test-only serialized in-memory adapter**: twenty concurrent conflicting requests reserve once; identical retries reuse the result; changed payload is refused. This proves reference-adapter/command semantics, **not PostgreSQL transactions, live exclusion constraints, production double-booking prevention or a deployed staff portal**. No fake production persistence was added.

### Targeted UX/design changes

- Preserved plum/ivory branding and existing authorized imagery; adjusted small-screen headline sizing/photo-note bounds, subtle image depth, tablet service-card layout, readable lead details, focus/invalid states and auth-card spacing.
- Mobile menu supports Escape with focus restoration. Sticky quote CTA no longer overlays auth/account/admin workflows.
- No externally sourced photographs or generic placeholders were substituted. Professional-photo replacement remains open pending an authorized/licensed asset source and owner visual feedback; this is not final design approval.

## Automated browser testing now executable

Added Playwright dev tooling and `pnpm test:browser`. After `pnpm build`, the suite starts an isolated local production-mode server on loopback with inert test-only Supabase placeholders, no service-role key, and recovery disabled. It does not accept a remote test base URL.

Five scenarios run in desktop Chromium and mobile Chromium emulation:

1. Homepage heading/image loading, no viewport zoom cap and no horizontal overflow.
2. Mobile menu open/Escape/focus restoration.
3. Visible disabled recovery gate and direct reset redirect.
4. Signed-out account/admin/lead-detail redirects.
5. Six-step quote with invalid ZIP, chosen service/add-on/frequency/date, review, and **mocked** success response. The valid quote API request is intercepted; no database insert occurs. Captured payload preserves date and omits invented totals/confirmation status.

Browser egress is limited to localhost by test routing; the local server also has no real database credentials. Mock success UI is explicitly test-only and never configured as production behavior. No claim of database persistence, provider email, booking, payment, or authenticated-role integration follows from these tests.

## Verification results

- `pnpm test`: **82 passed, 0 failed** (43 retained + 39 new).
- `pnpm typecheck`: passed.
- `pnpm build`: passed, including the new owner detail route.
- `pnpm test:browser`: **10 passed** on local desktop/mobile Chromium, with mocked quote persistence and inactive recovery.
- `pnpm audit --json`: zero reported advisories across production and development dependencies. The broader audit identified four existing PostCSS development-dependency findings; compatible PostCSS updates resolved them. This is not a comprehensive security certification.
- Latest exact-commit preview observations are recorded in PR #1 after publication.
- No production environment mapping, RLS, SQL migration, database row, test account, message or payment was changed by verification.

Reproduce locally: `pnpm install --frozen-lockfile`, `pnpm exec playwright install chromium`, `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm test:browser`. Do not run valid-write integration tests against shared production credentials.

## Remaining dependencies and engineering

Owner-reported dashboard evidence identifies an existing booking migration/tables, visible RLS policies, healthy DB status, no shown branches and no shown overview backups. Those are recorded as **user reports**, not independently inspected SQL results. `admin_all` attached to authenticated does not establish an admin predicate; visible RLS flags do not establish row ownership. The actual predicates, grants, migrations, indexes, storage rules, Auth configuration and backup/restore history still require authorized read-only provider evidence.

No connected Supabase SQL/Management API tool is available in this session. Prepared audit/isolation tools remain in the PR; this limitation is not solved by requesting repeated screenshots or guessing replacement schemas. A schema-only, data-less test target must precede persistence integration and QA writes. Do not copy customer/Auth rows or alter the existing shared project.

Still unfinished: live customer profiles/properties, approved persisted service/pricing/coverage configuration, estimate lifecycle, DB-backed booking/calendar/recurrence/assignment, staff portal, invoices, verified test payment/webhooks/refunds/reconciliation, durable notification outbox/provider delivery, rewards/referrals administration, full permission testing, backup restore rehearsal and operational monitoring. Domain modules are not substitutes for these missing application integrations. Stripe stays unconfigured in the app; rewards/SMS remain inactive.

To unblock integration work, provide sanitized authoritative schema/migration/RLS/function/grant evidence through an existing authorized provider session; approve a data-less test environment and its costs/mapping separately; assign owned test inboxes and admin/customer A/customer B/staff identities; approve business settings and licensed imagery. Secrets must be entered by the owner through supported secret configuration, never chat. No new dashboard screenshots or live data dumps are requested.

**Release recommendation: NO-GO**, until complete customer/admin/booking/staff/notification/payment flows and authorization/backup gates have actual integration evidence.

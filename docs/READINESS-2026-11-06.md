# Kiya Clean Co. — evidence-based readiness assessment

**Decision: NO-GO. Implementation assignment remains incomplete.**

This assessment supersedes unverified claims in the recovered `LAUNCH_READINESS.md`. That document is retained unchanged as historical source. Passing builds are not evidence of a working business platform.

## 1. System truth map

- Team: tradeiq. Project: kiya-clean-co-development. Existing public site: https://kiya-clean-co-development.vercel.app/.
- Current production deployment: `dpl_3ABos8wsuPnFe28qvtPensWPS4nH`, READY, created October 30. Vercel metadata identifies a v0 deployment with **no Git source**.
- Connected repository: ebyron357/kiya-clean-co-. Configured production branch `main`, whose starting revision `cfc6e7c` contained only README.md. The separate v0 branch at `7723333` contains a materially different, newer site with hard-coded business rules; it was inspected but not copied over the existing design.
- Recovered 54 source/asset files from the current deployment using Vercel's deployment-file read API. `deployed-source-manifest.json` records their SHA-256 digests before modifications. Generated TypeScript build artifacts were intentionally excluded.
- Architecture: Next.js 16.4.3 App Router, React 19, TypeScript, Tailwind 4, Zod, React Hook Form, Supabase SSR. Vercel project requests Node 26; local checks use Node 24.21.0. Preview build/runtime must verify the deployed environment separately.
- Persistence/auth: existing Supabase resource `supabase-pink-queen`, available, Free plan, attached to **production, preview, and development**. This is not proof of database isolation or schema correctness. Direct external database connections are unavailable in this session. No schema, RLS policies, migration history, functions, constraints, backups, or real records were inspected. No database writes or migrations were performed.
- Referenced tables: kiya_quotes, kiya_preferences, kiya_reward_ledger; rate-limit RPC: kiya_check_rate_limit. Historical notes also mention kiya_settings, kiya_referrals, kiya_audit, kiya_rate_limits. These are references, not independently verified schema facts.
- Payment resource: `stripe-sandbox-teal-door`, available, explicitly sandbox. Credentials exist by name, but the current source has no Stripe SDK, hosted checkout, webhook implementation, or reconciliation.
- Booking and payment interfaces in `lib/providers.ts` deliberately return unconfigured. Email/SMS delivery, monitoring, and analytics delivery are not implemented in the recovered source.
- Ownership: business owner must approve business settings and initial administrator; Supabase administrator must supply reviewed schema/migration artifacts and an isolated non-production test environment. Never paste credentials into this conversation.

## 2. Completed implementation

- Restored the actual deployed application to reversible Git history rather than rebuilding its design or substituting the incompatible v0 branch.
- Added `.gitignore` protections for env files, Vercel metadata, dependencies, and generated files.
- Added bounded streaming JSON validation: malformed/missing/cross-origin requests fail closed, scheme is compared, forwarded-host spoofing does not authorize requests, JSON content type is required, UTF-8 byte limits apply during reading, malformed JSON returns 400 rather than a generic database failure.
- Updated quote handler to use validation, preserve manual estimates/no invented prices, fail closed on unexpected authentication errors, and confirm that unique-conflict retries reference an actual existing submission ID. No raw database errors or secrets are returned.
- Removed the browser zoom cap.
- Removed unused shadcn CLI dependency and its unused stylesheet import; no application usage of its utility classes was found. Updated vulnerable transitive dependencies within their supported ranges using pnpm, not manual lockfile edits.
- Added 14 request-validation tests. Existing 15 pricing/schema tests retained.

## 3. Feature matrix

Statuses describe this revision, not desired future behavior. IMPLEMENTED BUT UNTESTED means source exists but integration behavior is not proven. BLOCKED denotes unavailable external evidence/setup, not a claim that the feature exists.

| Capability | Status | Evidence / limitation |
|---|---|---|
| Home, services overview, four service detail pages | IMPLEMENTED BUT UNTESTED | app/page.tsx; app/services; browser results recorded separately |
| About, service-area, rewards, referrals, seasonal, contact, FAQ pages | PARTIALLY IMPLEMENTED | app/[page]/page.tsx; informational copy, not operational integrations |
| Privacy, terms, cancellation/refund notices | PARTIALLY IMPLEMENTED | app/policies/[policy]/page.tsx; owner/legal approval absent |
| Consistent navigation, mobile navigation, public CTAs | IMPLEMENTED BUT UNTESTED | site-header/footer, zip-checker, quote-wizard; no exhaustive link audit |
| Owner-managed services/checklists/descriptions/activation | MISSING | lib/site.ts is static; no owner editor |
| Approved persisted base prices, size rules, extras, discounts, minimums, fees/tax | MISSING | pricing arithmetic exists but route intentionally calls calculateQuote(null, ...) |
| Service durations, availability restrictions, service-specific policies | MISSING | no persisted configuration workflow |
| Quote contact/property/type/size/beds/baths/condition/frequency/extras/notes/consent | PARTIALLY IMPLEMENTED | lib/quote-schema.ts and quote-wizard; preferred date is absent |
| Quote request validation | VERIFIED WORKING | 29-test suite includes 14 new request-boundary tests; not a DB integration claim |
| Quote persistence, lead visibility, confirmation page | IMPLEMENTED BUT UNTESTED | quote API inserts kiya_quotes; admin list; live persistence not exercised |
| Quote duplicate retry behavior / atomic unique constraint | PARTIALLY IMPLEMENTED | client submission UUID + duplicate lookup; live constraint and concurrency unverified |
| Quote lifecycle DRAFT→SUBMITTED→REVIEW→QUOTED→ACCEPTED/DECLINED/EXPIRED | MISSING | only initial request and pending withdrawal exist |
| Availability calendar, durations, travel buffers, conflict prevention | MISSING | bookingProvider is explicitly unconfigured |
| Booking lifecycle, assignments, rescheduling, cancellations, recurrence, history | MISSING | no operational booking adapter or state machine |
| Registration, verification callback, login/logout, sessions | IMPLEMENTED BUT UNTESTED | app/auth and proxy.ts; controlled mailbox and session tests unavailable |
| Password recovery | MISSING | no recovery flow |
| Customer profile/saved properties | PARTIALLY IMPLEMENTED | only cleaning preference notes |
| Customer quote history/preferences/reward ledger | IMPLEMENTED BUT UNTESTED | app/account; own-user filters present; live RLS isolation unverified |
| Customer appointments/invoices/payments/reschedule/cancel/support requests | MISSING | account explicitly states scheduling/payment unavailable |
| Admin server-side gate | IMPLEMENTED BUT UNTESTED | getUser + trusted app_metadata.role === admin; no public role assignment; authenticated boundary test absent |
| Admin new-lead list | IMPLEMENTED BUT UNTESTED | app/admin queries persisted quote records, not mock metrics |
| Admin overview/revenue/outstanding payment/activity reporting | MISSING | no operational metrics |
| Admin customer/property/contact/service/support management | MISSING | no management workflows |
| Admin calendar/assignment/status/conflict operations | MISSING | no booking operations |
| Admin estimates/invoices/refunds/discounts/reports | MISSING | no financial operations |
| Admin business/services/pricing/coverage/hours/policies/branding/contact/templates/rewards settings | MISSING | no settings editor |
| Admin roles/staff/permissions/audit/integration-health/error/failed-notification tools | MISSING | static readiness list is not operational tooling |
| Staff accounts/assigned jobs/schedules/checklists/completion/notes/escalation | MISSING | no staff workspace |
| Database schema, RLS, foreign keys, unique constraints, transactions, migrations | BLOCKED | no authoritative schema or direct DB access; not safe to guess changes |
| Users/roles/customers/properties/services/pricing/coverage/quotes/bookings/assignments/staff models | BLOCKED | model completeness cannot be established from application references |
| Invoices/payments/refunds/notifications/rewards/referrals/settings/support/audit models | BLOCKED | existing DB may differ; do not create duplicate tables |
| Data retention, backup and restore | BLOCKED | provider configuration and restore rehearsal not inspected |
| Hosted test checkout, deposits, invoices, receipts, failure handling | MISSING | Stripe resource exists, application adapter absent |
| Verified payment webhooks/idempotency/refunds/reconciliation | MISSING | no webhook route or verified event processing |
| Transactional email queue/retries/failure logs/idempotency/sender verification | MISSING | no delivery implementation; auth mail delivery unverified |
| SMS consent/opt-out/provider delivery | MISSING | no approved provider; do not send messages |
| ZIP coverage activation/restrictions/travel fees/reporting | MISSING | manual confirmation only; no invented covered ZIPs |
| Rewards/referral attribution/eligibility/balances/redemption/fraud/reporting | PARTIALLY IMPLEMENTED | account ledger read exists; program correctly inactive; other operations absent |
| Secret hygiene, input validation, generic error handling | PARTIALLY IMPLEMENTED | no credential values committed; request validation tested; no full secret/security audit certification |
| CSRF request boundary | VERIFIED WORKING | request-validation tests; deployed proxy compatibility still requires runtime checks |
| Rate limiting | IMPLEMENTED BUT UNTESTED | RPC call exists; trusted IP handling, cleanup and live enforcement unverified |
| Customer-to-customer authorization / tenant isolation | BLOCKED | controlled accounts and inspected RLS needed |
| Keyboard/focus/labels/reduced motion | PARTIALLY IMPLEMENTED | source includes controls; no WCAG conformance assessment |
| Mobile/tablet/desktop/contrast/screen readers/slow network/empty/error states | PARTIALLY IMPLEMENTED | limited preview smoke results only; comprehensive coverage outstanding |
| SEO titles/descriptions/manifest | PARTIALLY IMPLEMENTED | metadata present; approved canonical, sitemap, robots, verified local structured data missing |
| Performance/Core Web Vitals/responsive image optimization | IMPLEMENTED BUT UNTESTED | images unoptimized; no field metric evidence |
| Automated unit tests | VERIFIED WORKING | 29 passing; no claim about business E2E |
| Inquiry-to-reconciled-payment 20-step E2E and failure cases | BLOCKED | database/test identities/implemented booking/payment/delivery required |
| Production environment configuration/isolation | BLOCKED | environment names present, values not reviewed; resource shared across environments |
| Monitoring/error reporting/operational runbooks | MISSING | console logging alone is insufficient |
| Public launch and real charges | NOT APPLICABLE | explicitly not authorized; neither performed |

## 4. Test results

- Baseline: `pnpm test`: 15 passed, 0 failed; `pnpm typecheck`: passed.
- Final: `pnpm test`: 29 passed, 0 failed; `pnpm typecheck`: passed.
- `pnpm audit --prod --json`: baseline 82 advisories (1 critical, 32 high, 40 moderate, 9 low); after removing unused tooling/updating compatible transitives: **0 reported advisories**. Audit output is a registry report, not proof of exploitability or absence of application vulnerabilities.
- Local build and preview/runtime results are recorded in VERIFICATION.md. An intermediate build caught the leftover CLI stylesheet import; it was removed only after searching application usage. An initial new test caught Node strip-only incompatibility in a parameter property; fixed without weakening tests.
- No unsolicited messages, real charges, seed records, test identities, or customer database writes were created. No full E2E, authenticated RLS, migration, payment, or mail integration pass is claimed.

## 5. Security report

Admin uses server-side Supabase getUser and trusted app_metadata, not user_metadata. Customer reads filter by authenticated user ID; pending withdrawal uses both record ID and user ID. These source controls do not prove database RLS. Request boundary/body-limit regression tests pass. Remaining risks: no verified administrator provisioning or email recovery, no live cross-user isolation tests, no validated DB policies/backup restoration, unverified forwarded-IP throttling, no external monitoring. Request origin behavior must remain compatible with the deployed proxy; do not loosen it to arbitrary forwarded headers.

## 6. Integration report

- Supabase: resource available; application references present; schema and live business flows **UNVERIFIED**.
- Stripe: sandbox resource available; application processing **MISSING/UNVERIFIED**, never enabled.
- Email: auth provider may send verification email, but sender/delivery **UNVERIFIED**; business mail **MISSING**.
- SMS: **NOT CONFIGURED**. Calendar/booking: **NOT CONFIGURED**.
- No new paid infrastructure, duplicate database, destructive migration, provider claim, or credential rotation performed.

## 7. Deployment report

Existing production URL and deployment remain unchanged. Changes are for pull-request review and preview only. See VERIFICATION.md for exact preview URL, commit, build outcome and browser evidence. Do not merge into production until recovery branch/source decisions and launch gates are resolved.

## 8. Known defects

| Severity | Defect / impact | Next fix |
|---|---|---|
| Critical release blocker | No verified booking/payment/delivery end-to-end business operation | Implement against inspected schema and isolated sandbox resources; execute the directive's 20-step scenario |
| High | No authoritative schema/migrations/RLS/backups available in repository | Obtain reviewed schema-only export and policy/function/migration definitions; verify non-production DB |
| High | Three conflicting source versions / production branch lacks app | Review recovered-source PR; reconcile newer v0 branch without overwriting approved deployed design |
| High | Same Supabase resource connected to all environments | Establish owner-approved isolation before live test writes; never use production customer records for QA |
| High | Owner/admin/staff operational modules and password recovery absent | Implement after authoritative identity/schema setup; test least privilege |
| High | Business settings/policies not approved | Keep manual estimates and programs inactive until owner approval |
| Medium | Sitemap/canonical/robots/local business metadata incomplete; images unoptimized | Use approved public URL/business details and verify crawlers/performance |
| Medium | Accessibility and Core Web Vitals lack comprehensive evidence | Run automated and manual accessibility, device and network testing |

## 9. Owner action register

1. Review the exact deployed-source recovery versus the newer v0 branch; do not silently replace the approved website.
2. Supply **schema-only**, non-sensitive Supabase artifacts: migrations, tables, indexes, constraints, functions, grants and RLS policy definitions. No customer rows, credential values, or database dumps containing personal data.
3. Arrange an isolated non-production database and a development environment able to connect to it. Existing environment variable presence does not prove isolation. Enter secrets yourself through the project's supported secret configuration, never through chat.
4. Approve an initial admin identity and controlled test mailboxes/accounts, including a second customer and restricted staff identity, for authorization/delivery verification.
5. Approve service catalogue/checklists, ZIP coverage, prices, add-ons, duration/buffer rules, taxes/fees, hours, cancellation/refund terms, business contact details and legal notices. Until then use manual estimates and disabled rewards.
6. Confirm the existing Stripe sandbox is the approved test provider; arrange webhook signing configuration in the test environment. Do not enable live charges.
7. Approve transactional sender identity/provider and optional SMS program with consent/opt-out requirements. No paid purchases or messages have been authorized by this work.
8. Verify backups and perform a non-production restore rehearsal; define retention, monitoring and operations ownership.

## 10. Production recommendation

**NO-GO.** Source recovery and focused fixes are real implementation progress, not mission completion. Database access/isolation, owner decisions, and verified test identities block safe persistence/integration implementation. Missing booking, administration, staff, finance and notifications remain engineering work after those dependencies are available. Production launch and real charges still require explicit owner authorization.

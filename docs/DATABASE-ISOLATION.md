# Read-only database audit and isolation runbook

Status: **NO-GO**. This extends the existing recovered-source PR; it does not replace the application, create infrastructure, change environment variables, seed records, or apply migrations.

The repository is public. Exact account/project references and live configuration observations are intentionally kept in the private task report rather than committed here. The isolation checker accepts sanitized identifiers only; never commit its real input/output without reviewing disclosure.

## Evidence boundaries

- Current Vercel environment configuration can identify the authoritative Supabase project **without** retrieving service-role keys or connection-string values. Read only the individual URL/host/database-name variables and emit validated nonsecret identifiers.
- Both current application clients and proxy use `NEXT_PUBLIC_SUPABASE_URL`. The admin client also uses `SUPABASE_SERVICE_ROLE_KEY`; session clients use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_URL` is currently an unused alias. `POSTGRES_*` values are not used by this source.
- Checking environment targets and branch overrides establishes current configured routing, not the immutable environment snapshot of an older deployment. Values changed in Vercel apply to new deployments, not existing ones: [Vercel environments](https://vercel.com/docs/environment-variables).
- The Vercel integration resource reports its attachment/status/plan. It does **not** expose live table definitions, RLS policies, Auth configuration, migration history or backup inventory. A Vercel read grant is not a Supabase Management API authorization.
- This execution environment cannot connect directly to an external database and has no connected Supabase Management API tool. Do not work around that by deploying an administrative SQL endpoint or collecting credentials in chat.

## Tools added, not migrations

### Configuration-isolation guard

Run locally with a sanitized JSON observation list on stdin:

```sh
node scripts/database-isolation.mjs < isolated-observations.json
```

Each observation has exactly:

```json
{
  "environment": "preview",
  "variable": "NEXT_PUBLIC_SUPABASE_URL",
  "projectRef": "vvvvvvvvvvvvvvvvvvvv",
  "gitBranch": null
}
```

That identifier is synthetic. Include `NEXT_PUBLIC_SUPABASE_URL` for production, preview and development, plus `SUPABASE_URL` wherever that alias exists. Include every observed branch override. Do not pass an environment dump, API keys, URLs, usernames, DSNs, passwords or tokens. Unknown fields and malformed identifiers are rejected; CLI errors never echo raw input.

- Exit 0: complete observations show non-production application URL targets distinct from production, with no conflicting observed aliases/branch overlays.
- Exit 1: shared, missing, conflicting or ambiguous configuration. This is an intended safety failure, not a broken test.
- Exit 2: invalid input.

This is **not** runtime enforcement and is not wired into deployment CI. It cannot discover omitted overrides or validate credentials, historic deployments, RLS, schema drift, backups, provider webhooks or Auth settings. `liveDatabaseVerified` always remains false. Preview and development may share a dedicated test project without sharing production; separate test resources are preferred for concurrent QA.

### Catalog audit scripts

`scripts/database-audit-readonly.sql` opens a repeatable-read, READ ONLY transaction, applies short timeouts, reads catalog metadata, and ends with ROLLBACK. It inventories public-schema relations, columns, constraint columns, index flags, RLS policies, grants, default ACLs, routine security metadata and triggers. It does not query customer rows, auth identities, password hashes, Vault, function bodies, trigger arguments or default expressions.

Run only through an already-authorized database/SQL session outside this sandbox. Review the file first. If using psql, enable `ON_ERROR_STOP=1`. A permission error is incomplete evidence, not a finding that no policies/migrations exist. Ask the database administrator to inspect exposed custom application schemas too; the script intentionally defaults to `public` rather than scanning managed/internal schemas.

After confirming migration-history table visibility and the `version` column, run `scripts/database-migration-history-readonly.sql` to list versions only. No migration repair, `db push`, reset or baseline-history insertion is authorized. Obtain reviewed migration files separately for comparison; version presence alone does not prove live-schema equivalence. Supabase notes that initial `db pull` may ask to update remote migration history—do not use it as an unattended read-only audit: [CLI workflow](https://supabase.com/docs/guides/local-development/cli-workflows).

Policy expressions can contain literal business identifiers. Review/sanitize results privately before sharing. Routine bodies, partial-index predicates, view definitions, check expressions, scheduled jobs, webhooks and storage access policies need an additional privileged **read-only** review; this deliberately limited catalog report is not a full schema export or proof of security.

Both SQL files were parsed with PostgreSQL grammar (`pglast` 8.7) and their statement classes/READ ONLY/ROLLBACK structure checked. They were **not executed** against the live database. Parsing does not prove runtime permissions or catalog compatibility. The parser is a temporary audit tool, not an application dependency.

## Application persistence contract — not an observed live schema

| Referenced object | Source-required fields/behavior | Evidence |
|---|---|---|
| `public.kiya_quotes` | id, submission_id, user_id, customer_name, email, phone, zip, details, marketing_consent, status, created_at | quote API inserts; admin/account read; account pending withdrawal |
| `public.kiya_preferences` | user_id, preferences, updated_at; upsert ownership | account page/actions |
| `public.kiya_reward_ledger` | id, user_id, points, reason, created_at; own-user read only | account page |
| `public.kiya_check_rate_limit` | RPC parameters bucket, max_hits, window_seconds; boolean result | quote API |

Required checks, not verified facts: unique submission_id, preferences user_id uniqueness, appropriate foreign keys/status constraints, integer/range checks for balances, least-privilege RPC execution, race-safe throttling, and server-enforced ownership. Do not create duplicate tables from this contract; compare it to authoritative catalog output and migration files first.

## RLS and Auth review

1. Inventory all exposed schemas, grants and RLS policies. RLS and privileges must both be reviewed: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
2. Check `anon` cannot read customer quotes/preferences/ledger, cannot write rewards or grant roles, and cannot call administrative/security-definer RPCs inappropriately.
3. Check customer A can only select/update permitted A-owned records, and cannot change ownership/status/balances arbitrarily. Verify customer B isolation using API requests, not only hidden controls.
4. Review `kiya_check_rate_limit` body/search_path/execute grants privately; inspect all security-definer functions and view security semantics. A service-role client bypasses RLS, so source authorization and input validation are separate requirements.
5. Source observations: admin checks Supabase `getUser` and trusted `app_metadata.role === 'admin'`; customer reads filter user_id; service-role withdrawal filters id/user_id/requested status. These controls are implemented but live policy/authenticated-role behavior is **UNVERIFIED**.
6. Record nonsecret Auth settings: signup enabled/disabled, email confirmation requirement, allowed providers, session expiry/refresh policy, password requirements, MFA/administrator requirements, SMTP configured yes/no, allowed redirect URL patterns, rate limits and CAPTCHA configuration. Never export SMTP passwords/OAuth secrets/JWT signing keys.
7. Review the provider's **URL Configuration** page for Site URL and approved redirect allowlist, especially the exact auth callback path. Provider documentation recommends exact production redirect paths: [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). Application signup/callback code is not proof the provider requires email confirmation or delivers email.
8. A future connected read-only Management API grant can inspect Auth with `auth_config_read`, backups with `backups_read`, and SQL with `database_read`. The SQL read-only endpoint is beta and requires schema-qualified references: [Auth](https://supabase.com/docs/reference/api/v1-get-auth-service-config), [backups](https://supabase.com/docs/reference/api/v1-list-all-backups), [SQL](https://supabase.com/docs/reference/api/v1-read-only-query). No such authorization/tool is currently connected; do not create or paste a new token for this assistant.

## Preserve-data isolation strategy (not executed)

1. Treat the existing shared project as production-sensitive. Do not test writes, confirmations, withdrawals, role provisioning, bookings, mail or payments against it.
2. Obtain the read-only schema/policy/function/migration audit and a backup inventory. Record latest successful backup/export time, storage location, retention, encryption/access ownership, RPO/RTO and last non-production restore rehearsal. The database catalog cannot establish those facts. Do not restore the live project.
3. Prefer a **schema-only, data-less** test environment. Once migration provenance is reconciled, an owner-approved Supabase branch is an option; branches have distinct credentials and default to no production rows/storage objects. Repository-backed branches build from repository migrations; dashboard branches rely on base migration history. Neither is presently validated. Branch merge triggers production deployment: never merge a database branch as part of test setup. See [branching](https://supabase.com/docs/guides/deployment/branching).
4. If branching is unavailable or inappropriate, obtain approval for a separately provisioned non-production project; do not purchase it or duplicate infrastructure automatically. A local-only Supabase stack on an authorized workstation is another development option, not a production service. No new paid infrastructure was created here.
5. Apply reviewed schema/migrations to the **test target only**, with outbound webhooks/cron/email/SMS/jobs disabled. Seed synthetic fixtures, never production customer rows, auth password hashes, addresses or Vault secrets. Avoid a full production clone: it copies sensitive rows and can run restored jobs/webhooks; [clone cautions](https://supabase.com/docs/guides/platform/clone-project).
6. Owner enters the test project's credentials directly into supported secret configuration. Update development/preview mappings only under an approved Vercel change plan. Keep production mappings unchanged. Change public URL, publishable key, service-role key and all connected aliases/DSNs coherently, checking every branch override. No credential values are requested in chat.
7. Verify the sanitized target inventory with the guard; separately confirm credential provenance and live connectivity using the provider's authorized tooling. Create a fresh preview after environment changes; old deployment snapshots retain old mappings. Retire unsafe old previews only after owner authorization and record the rollback to the previous **safe** test configuration, never to production credentials.
8. Complete two-customer RLS/admin/staff boundary tests, then quote/booking concurrency, test payment webhook replay/refund/reconciliation and notification delivery/retries. Disable live charges and use owned recipient inboxes. Only then consider release gates. No production migration/launch is included.

## Minimum identities and fixtures (proposed, not created)

| Identity | Purpose |
|---|---|
| Anonymous browser | No account; safe request validation and signed-out access denial |
| Customer A with owned verified test mailbox | Signup/confirmation/login/recovery, A-owned quote/property/booking/invoice |
| Customer B with separate verified test mailbox | Cross-customer read/update denial and IDOR tests |
| Admin with trusted server-provisioned role | Lead review/configuration/assignment/refund operations; customer metadata cannot self-escalate |
| Staff with restricted server-provisioned role | Assigned-job read/update, deny other assignments, finances and settings |
| Unverified-email customer | Confirm provider's pre-verification restrictions; may reuse a fresh pre-confirmation signup during testing |

At least four verified human-role accounts plus a transient unverified identity are needed for the full intended system. Staff workflows and recovery are not implemented merely by defining these identities. Credentials belong in the authorized test runner's secret store, not fixtures or PR comments.

Synthetic fixture requirements, only after schema is authoritative: owner-approved test-only service/ZIP/pricing configuration (no final public rates); A/B properties and quote ownership; guest submission UUID; duplicate UUID/payload; disabled/out-of-area service; two overlapping booking requests and two staff assignments; pending/confirmed/completed/canceled lifecycle examples; test-mode invoice/payment/refund/webhook event IDs; notification outbox retries/failures with owned recipients; inactive rewards/referral/ledger cases. Use a unique test-run namespace, deterministic clock where applicable, and test-only cleanup ownership. Do not write guessed INSERT statements now.

## Additional test evidence

- `pnpm test`: 43 passed, 0 failed (29 previous + 14 new isolation regressions).
- `pnpm typecheck` and `pnpm build`: passed.
- Current sanitized connection observations cause the isolation guard to exit 1, correctly blocking shared production targeting. This is separate from the 43 passing unit tests.
- PostgreSQL grammar validation: 20 and 5 statements respectively; SELECT/transaction/SET only, READ ONLY entry and ROLLBACK exit. No live SQL execution.
- No application runtime/UI source was changed in this extension. Earlier browser checks remain evidence for the earlier PR head only; no new browser or authenticated integration pass is claimed.

## Exact remaining owner actions

1. In an existing authorized Supabase session, run/review the two read-only audit scripts and supply sanitized results plus reviewed schema/migration definitions privately, not as a public issue/PR attachment. Do not include customer rows, credentials or connection strings.
2. Record the Auth settings listed above from **URL Configuration** and the provider's relevant Auth configuration (other navigation is intentionally not guessed). Supply only the nonsecret settings and configured yes/no flags. No test signup or message delivery is needed for this read-only step.
3. Inspect **Database > Backups** and your off-site backup process; report timestamps, retention/PITR and restore-test evidence. A Free-plan label is not proof of no backups; Supabase recommends off-site exports for Free-tier projects and documents daily platform backups for paid plans: [backups](https://supabase.com/docs/guides/platform/backups). Any customer-data export stays in the owner's secure backup system, never chat/repository.
4. Decide whether to approve data-less branching or a separate test resource (including any cost), then approve a scoped non-production environment remapping. No production remapping or new infrastructure has been performed.
5. Provide controlled test-identity ownership and approve business policies/settings; after isolation, enter test-provider secrets yourself and authorize sandbox-only end-to-end verification. Never send account passwords or API tokens to the assistant.

Production remains **NO-GO** until the complete customer/admin/staff/booking/payment/notification workflow and security/backup gates have verified evidence. Tooling and a successful build do not resolve unavailable database evidence.

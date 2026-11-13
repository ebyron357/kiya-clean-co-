-- Metadata only. No customer/auth rows, password hashes, keys or function bodies.
-- Run via an already-authorized SQL session. Review policy expressions privately
-- before sharing; custom policies can contain literal business identifiers.
-- psql: use ON_ERROR_STOP=1 so a permission error cannot be mistaken for success.
-- This script is NOT a migration and must never be put in migrations/.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';

-- 1. Verify snapshot mode; privileges affect catalog visibility.
SELECT current_setting('transaction_read_only') AS transaction_read_only,
       current_setting('server_version') AS server_version;

-- 2. Application relations and RLS flags. Add approved custom application
-- schemas explicitly if the provider's exposed-schema configuration lists them.
SELECT n.nspname AS schema_name, c.relname AS relation_name, c.relkind AS kind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       pg_get_userbyid(c.relowner) AS owner_role,
       COALESCE(c.reloptions @> ARRAY['security_invoker=true'], false) AS security_invoker
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
ORDER BY 1,2;

-- 3. Column types/nullability; intentionally omit defaults (can contain secrets).
SELECT table_schema, table_name, column_name, ordinal_position, data_type,
       udt_schema, udt_name, is_nullable, is_identity, is_generated,
       column_default IS NOT NULL AS has_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4. Constraint types and involved columns; no stored/check/default values.
SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname,
       con.contype, con.convalidated, con.condeferrable, con.condeferred,
       ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
             JOIN pg_catalog.pg_attribute AS a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
             ORDER BY k.ord) AS columns,
       rn.nspname AS referenced_schema, rc.relname AS referenced_table,
       ARRAY(SELECT a.attname FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
             JOIN pg_catalog.pg_attribute AS a ON a.attrelid = con.confrelid AND a.attnum = k.attnum
             ORDER BY k.ord) AS referenced_columns,
       con.confupdtype, con.confdeltype
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_class AS rc ON rc.oid = con.confrelid
LEFT JOIN pg_catalog.pg_namespace AS rn ON rn.oid = rc.relnamespace
WHERE n.nspname = 'public'
ORDER BY 1,2,3;

-- 5. Unique/index validity. Expression/predicate text intentionally not exported.
SELECT n.nspname AS schema_name, t.relname AS table_name, idx.relname AS index_name,
       i.indisunique, i.indisprimary, i.indisvalid, i.indisready,
       i.indexprs IS NOT NULL AS expression_index, i.indpred IS NOT NULL AS partial_index
FROM pg_catalog.pg_index AS i
JOIN pg_catalog.pg_class AS t ON t.oid = i.indrelid
JOIN pg_catalog.pg_class AS idx ON idx.oid = i.indexrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
ORDER BY 1,2,3;

-- 6. Actual RLS expressions. Metadata is not authorization test evidence.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Explicit/default table privileges, including column-specific grants.
SELECT table_schema, table_name, grantee, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' ORDER BY table_name, grantee, privilege_type;
SELECT table_schema, table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' ORDER BY table_name, column_name, grantee;
SELECT pg_get_userbyid(d.defaclrole) AS owner_role, n.nspname AS schema_name,
       d.defaclobjtype, d.defaclacl
FROM pg_catalog.pg_default_acl AS d
LEFT JOIN pg_catalog.pg_namespace AS n ON n.oid = d.defaclnamespace
WHERE n.nspname = 'public' OR d.defaclnamespace = 0;
SELECT n.nspname AS schema_name, n.nspacl
FROM pg_catalog.pg_namespace AS n WHERE n.nspname = 'public';

-- 8. Routine execution/security metadata. No routine bodies/config secrets.
SELECT n.nspname AS schema_name, p.proname AS routine_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_function_result(p.oid) AS result_type,
       p.prosecdef AS security_definer, p.provolatile,
       pg_get_userbyid(p.proowner) AS owner_role,
       ARRAY(SELECT s FROM unnest(p.proconfig) AS s WHERE s LIKE 'search_path=%') AS configured_search_path,
       p.proacl AS execution_acl
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY 1,2,3;
SELECT grantee, routine_schema, routine_name, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' ORDER BY routine_name, grantee;

-- 9. Triggers: inventory only. Do not invoke or export arguments/webhook secrets.
SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname,
       t.tgenabled, pn.nspname AS function_schema, p.proname AS function_name
FROM pg_catalog.pg_trigger AS t
JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
JOIN pg_catalog.pg_namespace AS pn ON pn.oid = p.pronamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY 1,2,3;

-- 10. Relevant role flags only; pg_roles excludes password hashes.
SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
FROM pg_catalog.pg_roles
WHERE rolname IN ('anon','authenticated','service_role','authenticator') ORDER BY rolname;

-- 11. Migration history existence/visibility (no statements or application rows).
SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS migration_history_exists;
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
ORDER BY ordinal_position;

-- End without committing anything. READ ONLY prevents accidental row mutations.
ROLLBACK;
-- Full migration versions can be read using database-migration-history-readonly.sql
-- once this table and a version column have been confirmed. Absence/permission
-- denial must be reported as unavailable, never as "no migrations".
-- Auth service configuration, backup status, jobs/webhook configuration and
-- restore evidence require separate provider inspection. Do not infer them here.

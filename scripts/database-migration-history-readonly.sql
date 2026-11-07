-- Run only after database-audit-readonly.sql confirms this table/version column.
-- Versions only: names and statement bodies are omitted to avoid embedded data.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
ROLLBACK;

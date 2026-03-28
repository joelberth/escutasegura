-- Move extensions to a dedicated schema for security
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Example: moving common extensions (adjust based on what's installed)
-- ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
-- ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;

-- Re-run linter or check specific extensions
-- But the most important security check is RLS. 
-- Let's check tables.

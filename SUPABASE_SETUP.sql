-- ═══════════════════════════════════════════════════════════════
-- SUPABASE SETUP COMMANDS
-- Copy and paste these into Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Run the full schema (if not already done)
-- Go to SQL Editor → New Query → Paste contents of supabase/schema.sql → Run

-- Step 2: Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Expected output: companies, jobs, waitlist, scrape_log

-- Step 3: Verify foreign key relationship exists
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'jobs';

-- Expected output: jobs.company_id → companies.id

-- Step 4: Test the query that was failing
SELECT 
  id, title, category, tags, salary_min, salary_max,
  salary_currency, work_mode, description, requirements,
  apply_url, is_featured, posted_at, expires_at,
  companies (
    id, name, slug, sector, logo_initials, logo_url,
    lat, lng, arrondissement, funding_stage
  )
FROM jobs
WHERE is_active = true
LIMIT 5;

-- If this fails, the foreign key might be missing. Fix with:
-- ALTER TABLE jobs 
-- ADD CONSTRAINT jobs_company_id_fkey 
-- FOREIGN KEY (company_id) 
-- REFERENCES companies(id) 
-- ON DELETE CASCADE;

-- Step 5: Verify RLS policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('companies', 'jobs', 'waitlist', 'scrape_log');

-- Step 6: Check if you have any data
SELECT 
  (SELECT COUNT(*) FROM companies WHERE is_active = true) as companies_count,
  (SELECT COUNT(*) FROM jobs WHERE is_active = true) as jobs_count;

-- If counts are 0, you need to seed data. Run locally:
-- npm run seed

-- Step 7: Test the API-style query (what Supabase JS uses)
-- This should work after the fix:
SELECT 
  j.id, j.title, j.category, j.work_mode,
  c.id as company_id, c.name as company_name, c.slug as company_slug,
  c.lat, c.lng, c.arrondissement
FROM jobs j
INNER JOIN companies c ON c.id = j.company_id
WHERE j.is_active = true
  AND c.is_active = true
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════
-- TROUBLESHOOTING
-- ═══════════════════════════════════════════════════════════════

-- If you get "column does not exist" errors:
-- 1. Verify the schema was applied correctly
-- 2. Check table structure:
\d jobs
\d companies

-- If RLS is blocking queries:
-- Temporarily disable for testing (NOT for production):
-- ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing:
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- If foreign key is missing, add it:
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_company_id_fkey;

ALTER TABLE jobs 
ADD CONSTRAINT jobs_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE CASCADE;

-- Verify it was added:
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname = 'jobs_company_id_fkey';

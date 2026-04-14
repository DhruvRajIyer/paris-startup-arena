# Solution: Job Cards Not Opening ATS Pages

## Root Cause Found! 🔍

The job cards aren't opening ATS application pages because:

1. **Old seed data is still in database** - 200+ jobs from manual seed script
2. **ATS jobs exist but aren't showing** - 184 jobs from Greenhouse/Lever/Ashby
3. **API returns old jobs first** - Sorted by `is_featured` and `posted_at`
4. **Old jobs have generic URLs** - Like `https://payfit.com/careers` instead of specific ATS URLs

## Quick Fix

### Option 1: Delete Old Seed Data (Recommended)

Run this in Supabase SQL Editor:

```sql
-- Delete old manual seed jobs (they have source = 'manual' or NULL)
DELETE FROM jobs 
WHERE source IS NULL OR source = 'manual' OR source = 'unknown';

-- Verify ATS jobs remain
SELECT source, COUNT(*) as count
FROM jobs
GROUP BY source;
```

Expected result:
```
source      | count
------------|------
greenhouse  | 148
lever       | 27
ashby       | 9
```

### Option 2: Update API to Prioritize ATS Jobs

Edit `server.ts` line 98-99:

```typescript
// OLD:
.order('is_featured', { ascending: false })
.order('posted_at', { ascending: false })

// NEW: Prioritize ATS jobs
.order('source', { ascending: false, nullsFirst: false })
.order('is_featured', { ascending: false })
.order('posted_at', { ascending: false })
```

This will show ATS jobs (greenhouse, lever, ashby) before manual/unknown jobs.

### Option 3: Filter to Only Show ATS Jobs

Edit `server.ts` line 97:

```typescript
// Add this filter
.in('source', ['greenhouse', 'lever', 'ashby'])
```

## Verification Steps

After applying the fix:

1. **Restart server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Check API:**
   ```bash
   curl -s http://localhost:3000/api/jobs | python3 -c "
   import sys, json
   data = json.load(sys.stdin)
   jobs = data.get('jobs', [])
   print(f'First job:')
   print(f'  Title: {jobs[0].get(\"title\")}')
   print(f'  Source: {jobs[0].get(\"source\")}')
   print(f'  URL: {jobs[0].get(\"apply_url\")[:80]}')
   "
   ```

   Should show:
   ```
   First job:
     Title: Account Executive - Darmstadt (x/f/m)
     Source: greenhouse
     URL: https://boards.greenhouse.io/doctolib/jobs/...
   ```

3. **Test in browser:**
   - Visit http://localhost:3000
   - Open console (F12)
   - Click any job card
   - Should see: `✅ Opening URL: https://boards.greenhouse.io/...`
   - New tab should open with ATS application form

## Why This Happened

1. You ran `npm run seed:full` which created manual jobs
2. Then ran `npm run sync` which added ATS jobs
3. Both sets of jobs exist in database
4. API returns first 50 jobs sorted by featured/date
5. Old manual jobs appear first (they're featured)
6. ATS jobs are buried on page 2+

## Recommended Solution

**Delete old seed data** and keep only ATS jobs:

```sql
-- In Supabase SQL Editor
DELETE FROM jobs WHERE source NOT IN ('greenhouse', 'lever', 'ashby');
DELETE FROM companies WHERE is_verified = false AND slug NOT IN (
  SELECT DISTINCT db_slug FROM (VALUES 
    ('dataiku'), ('doctolib'), ('qonto'), ('photoroom')
  ) AS t(db_slug)
);
```

Then refresh the page - all job cards will now link to real ATS application pages! 🎉

## Current Status

✅ **Debug mode enabled** - Console logs show what's happening  
✅ **ATS jobs exist** - 184 jobs with real application URLs  
⚠️  **Old jobs showing first** - Need to delete or deprioritize  

**Next step:** Choose a fix option above and apply it!

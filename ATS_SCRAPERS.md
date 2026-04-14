# ATS Scrapers Documentation

## Overview

This project now scrapes jobs from **4 sources**:
1. **Greenhouse** - 2 companies, ~148 jobs
2. **Lever** - 1 company, ~27 jobs  
3. **Ashby** - 1 company, ~9 jobs
4. **Welcome to the Jungle** (legacy) - Variable

All ATS platforms provide **public, no-auth JSON APIs** with no rate limits.

## Quick Start

### Test Individual Scrapers

```bash
# Test all companies in registry
npm run test:ats

# Test specific company
npm run test:ats greenhouse dataiku
npm run test:ats lever qonto
npm run test:ats ashby photoroom
```

### Run Full Sync

```bash
npm run sync
```

This will:
- Fetch jobs from all 4 ATS companies
- Fetch jobs from WTTJ (if API is working)
- Upsert jobs into database
- Expire stale jobs
- Log results to `scrape_log` table

## Company Registry

Located in `lib/scrapers/registry.ts`:

```typescript
export const PARIS_COMPANIES: CompanyConfig[] = [
  // Greenhouse
  { name: 'Dataiku', ats: 'greenhouse', ats_slug: 'dataiku', db_slug: 'dataiku', sector: 'DeepTech' },
  { name: 'Doctolib', ats: 'greenhouse', ats_slug: 'doctolib', db_slug: 'doctolib', sector: 'HealthTech' },
  
  // Lever
  { name: 'Qonto', ats: 'lever', ats_slug: 'qonto', db_slug: 'qonto', sector: 'FinTech' },
  
  // Ashby
  { name: 'Photoroom', ats: 'ashby', ats_slug: 'photoroom', db_slug: 'photoroom', sector: 'DeepTech' },
];
```

### Adding New Companies

1. **Find the ATS platform** - Check the company's careers page URL:
   - `boards.greenhouse.io/company` → Greenhouse
   - `jobs.lever.co/company` → Lever
   - `jobs.ashbyhq.com/company` → Ashby

2. **Verify the slug works**:
   ```bash
   npm run test:ats greenhouse company-slug
   ```

3. **Add to registry**:
   ```typescript
   { 
     name: 'Company Name', 
     ats: 'greenhouse', 
     ats_slug: 'company-slug',  // From careers URL
     db_slug: 'company-name',    // Your database slug
     sector: 'FinTech'           // DeepTech, HealthTech, FinTech, etc.
   },
   ```

4. **Test again**:
   ```bash
   npm run test:ats
   ```

## API Endpoints

### Greenhouse
```
https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
```
- Returns: Array of jobs with HTML descriptions
- Salary: Not exposed in public API
- Location: `job.location.name`
- Department: `job.departments[0].name`

### Lever
```
https://api.lever.co/v0/postings/{slug}?mode=json&limit=100
```
- Returns: Array of postings with structured data
- Salary: `posting.salaryRange` (when available)
- Location: `posting.categories.location`
- Workplace: `posting.workplaceType` (onsite/remote/hybrid)

### Ashby
```
https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true
```
- Returns: Object with `jobs` array
- Salary: `job.compensation.compensationTiers` or parsed from summary
- Location: `job.location` + `job.secondaryLocations`
- Workplace: `job.workplaceType` + `job.isRemote`

## Paris Filtering

Each scraper filters to Paris-only jobs:

```typescript
const isParis = 
  loc.includes('paris') || 
  loc.includes('france') || 
  loc.includes('fr') ||
  loc === '' ||           // Empty = assume Paris
  loc.includes('remote'); // Remote = include
```

## Data Normalization

All scrapers convert to a standard `JobInsert` format:

```typescript
interface JobInsert {
  company_db_slug: string;  // Links to companies table
  title: string;
  category: string;         // eng, product, design, data, growth, ops
  tags: string[];           // ['React', 'TypeScript', 'AWS']
  salary_min: number | null;
  salary_max: number | null;
  work_mode: string;        // onsite, remote, hybrid
  description: string;
  requirements: string | null;
  apply_url: string;
  source: string;           // greenhouse, lever, ashby, wttj
  source_id: string;        // Unique ID from ATS
  posted_at: string;
  expires_at: string;       // 45 days from now
}
```

## Sync Behavior

### Company Creation
- If a company doesn't exist in the database, it's auto-created
- New companies are flagged with `is_verified: false`
- Default coordinates: Paris center (48.8566, 2.3522)
- Requires manual geocoding later

### Job Upserts
- Jobs are matched by `source` + `source_id`
- Existing jobs: Update `expires_at` and set `is_active: true`
- New jobs: Insert with all fields
- Stale jobs (past `expires_at`): Set `is_active: false`

### Polite Scraping
- 300ms delay between companies
- No parallel requests
- Graceful error handling (logs warnings, continues)

## Test Results

Last tested: 2026-04-14

| Company | ATS | Jobs Found | Status |
|---------|-----|------------|--------|
| Dataiku | Greenhouse | 38 | ✅ Working |
| Doctolib | Greenhouse | 110 | ✅ Working |
| Qonto | Lever | 27 | ✅ Working |
| Photoroom | Ashby | 9 | ✅ Working |

**Total: 184 Paris jobs from 4 companies**

## Troubleshooting

### "HTTP 404" Error
- The slug is wrong
- Try variations: `company`, `company-name`, `companyname`
- Check the careers page URL for the correct slug

### "No jobs found"
- Company may have no open positions
- All positions might be outside Paris
- Paris filtering might be too strict (check location strings)

### "Column does not exist"
- Database schema not applied
- Run `supabase/schema.sql` in Supabase SQL Editor

### "No company found for slug"
- Company not in database
- Will be auto-created on next sync
- Check `is_verified: false` companies and geocode them

## Monitoring

Check sync results in Supabase:

```sql
-- Recent sync logs
SELECT * FROM scrape_log 
ORDER BY started_at DESC 
LIMIT 10;

-- Jobs by source
SELECT source, COUNT(*) as count, MAX(posted_at) as latest
FROM jobs 
WHERE is_active = true
GROUP BY source;

-- Companies needing geocoding
SELECT name, slug, sector, is_verified
FROM companies
WHERE is_verified = false;
```

## Future Enhancements

1. **Expand Registry** - Add 25+ more Paris startups
2. **Auto-Geocoding** - Use Nominatim API for new companies
3. **Deduplication** - Detect same job across multiple ATSs
4. **Monitoring** - Alert on scraper failures
5. **Analytics** - Track data quality per source

## Files

```
lib/scrapers/
├── registry.ts       # Company → ATS mapping
├── greenhouse.ts     # Greenhouse scraper
├── lever.ts          # Lever scraper
├── ashby.ts          # Ashby scraper
└── wttj.ts          # WTTJ scraper (legacy)

scripts/
├── sync.ts          # Orchestrates all scrapers
└── test-ats.ts      # Test individual scrapers
```

## Contributing

To add a new company:

1. Find their ATS platform
2. Verify the slug: `npm run test:ats [ats] [slug]`
3. Add to `lib/scrapers/registry.ts`
4. Test: `npm run test:ats`
5. Run sync: `npm run sync`
6. Manually geocode the company in Supabase
7. Set `is_verified: true`

## Support

- Check `BACKEND_SETUP.md` for database setup
- Check `SETUP_FIX.md` for troubleshooting
- Check `VERCEL_DEPLOYMENT.md` for deployment

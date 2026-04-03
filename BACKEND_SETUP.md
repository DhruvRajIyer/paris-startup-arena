# Backend Setup Guide

## Overview

This backend provides a complete data pipeline for the Paris Startup Arena map:
- **Database**: Supabase (PostgreSQL)
- **API**: Express.js server with REST endpoints
- **Data Pipeline**: Automated job scraping from Welcome to the Jungle
- **Automation**: GitHub Actions for daily sync

---

## 1. Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision (~2 minutes)
3. Note your project URL and keys from Settings → API

### Step 2: Run Schema Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/schema.sql`
4. Paste and click **Run**
5. Verify tables were created in **Table Editor**

Expected tables:
- `companies` - Startup company data with lat/lng
- `jobs` - Job postings with company relationships
- `waitlist` - Email signups
- `scrape_log` - Audit trail for data pipeline

### Step 3: Seed Initial Data

Run the seed script to populate 20 Paris startups:

```bash
npm run seed
```

This will insert companies like Mistral AI, Alan, Qonto, etc. with verified locations.

---

## 2. Environment Variables

Create or update your `.env` file with these values:

```env
# Supabase (get from Supabase dashboard → Settings → API)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...                    # Public key (safe for frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 # Private key (server only!)

# Mapbox (get from mapbox.com)
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ...

# Cron protection (generate a random string)
CRON_SECRET=your-random-secret-here

# Optional: Notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**Important**: Never commit `.env` to git. It's already in `.gitignore`.

---

## 3. API Endpoints

All endpoints are served by `server.ts`:

### GET /api/companies
Returns all active companies with open role counts.

**Query params:**
- `sector` - Filter by sector (DeepTech, FinTech, etc.)
- `arrond` - Filter by arrondissement (1-20)

**Response:**
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "Mistral AI",
      "slug": "mistral-ai",
      "sector": "DeepTech",
      "lat": 48.8608,
      "lng": 2.3472,
      "arrondissement": 1,
      "open_roles_count": 12
    }
  ],
  "count": 47,
  "generated_at": "2025-04-01T06:00:00.000Z"
}
```

### GET /api/jobs
Returns all active jobs with company data.

**Query params:**
- `company_id` - Filter by company UUID
- `category` - Filter by category (eng, product, design, growth, data, ops)
- `work_mode` - Filter by work mode (remote, hybrid, onsite)
- `featured` - Set to 'true' for featured jobs only
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Senior Frontend Engineer",
      "category": "eng",
      "tags": ["React", "TypeScript", "Three.js"],
      "salary_min": 80000,
      "salary_max": 120000,
      "work_mode": "hybrid",
      "is_featured": true,
      "company": {
        "id": "uuid",
        "name": "Mistral AI",
        "lat": 48.8608,
        "lng": 2.3472
      }
    }
  ],
  "total": 247,
  "offset": 0,
  "limit": 50
}
```

### POST /api/waitlist
Add email to waitlist.

**Body:**
```json
{
  "email": "user@example.com",
  "type": "notify"  // or "advertise"
}
```

### GET /api/stats
Summary statistics for hero section.

**Response:**
```json
{
  "companies": 47,
  "roles": 247,
  "updated_at": "2025-04-01T06:00:00.000Z"
}
```

---

## 4. Data Pipeline

### How it works

1. **GitHub Actions** runs daily at 06:00 Paris time
2. Scrapes jobs from Welcome to the Jungle API
3. Creates new companies if needed (with default Paris center location)
4. Upserts jobs (inserts new, updates existing to keep fresh)
5. Expires jobs past their `expires_at` date
6. Logs everything to `scrape_log` table

### Manual sync

Run the sync script locally:

```bash
npx tsx scripts/sync.ts
```

### Monitoring

Check sync status in Supabase:

```sql
SELECT * FROM scrape_log 
ORDER BY started_at DESC 
LIMIT 10;
```

---

## 5. GitHub Actions Setup

### Step 1: Add Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Enable Workflows

The workflow file is already in `.github/workflows/daily-sync.yml`.

GitHub Actions will automatically:
- Run daily at 06:00 Paris time
- Can be triggered manually from Actions tab

### Step 3: Test

1. Go to Actions tab in GitHub
2. Select "Daily Job Sync" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait ~2-5 minutes
5. Check logs for success

---

## 6. Development Workflow

### Start the dev server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Test API endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Get companies
curl http://localhost:3000/api/companies

# Get jobs
curl http://localhost:3000/api/jobs?category=eng&limit=10

# Add to waitlist
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Run sync manually

```bash
npx tsx scripts/sync.ts
```

### Seed database

```bash
npx tsx scripts/seed.ts
```

---

## 7. Deployment Checklist

- [ ] Supabase project created
- [ ] Schema SQL executed in Supabase SQL Editor
- [ ] RLS policies applied (automatic with schema)
- [ ] Seed script run → verify companies in Table Editor
- [ ] `.env` file configured with all keys
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to GitHub Secrets
- [ ] GitHub Actions workflow enabled
- [ ] Manual workflow run successful
- [ ] `/api/companies` returns data
- [ ] `/api/jobs` returns data
- [ ] Map view shows pins and cards
- [ ] Waitlist form works

---

## 8. Troubleshooting

### No jobs showing up

1. Check if companies exist: `SELECT COUNT(*) FROM companies;`
2. Check if jobs exist: `SELECT COUNT(*) FROM jobs WHERE is_active = true;`
3. Run sync manually: `npx tsx scripts/sync.ts`
4. Check scrape_log for errors: `SELECT * FROM scrape_log ORDER BY started_at DESC LIMIT 1;`

### API returns empty array

1. Verify Supabase connection in server logs
2. Check RLS policies are enabled
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)

### GitHub Actions failing

1. Check secrets are added correctly
2. Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
3. Check Actions logs for specific error
4. Test sync locally first

### New companies have wrong location

1. Companies scraped automatically get default Paris center (48.8566, 2.3522)
2. Update manually in Supabase Table Editor
3. Or use geocoding utility:
   ```typescript
   import { geocodeAddress } from './lib/utils/geocode';
   const coords = await geocodeAddress('50 Rue de Clichy, 75009 Paris');
   ```

---

## 9. Extending the Pipeline

### Add more scrapers

Create a new file in `lib/scrapers/`:

```typescript
// lib/scrapers/greenhouse.ts
export async function fetchGreenhouseJobs(companySlug: string) {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs`
  );
  return res.json();
}
```

Then import and call in `scripts/sync.ts`.

### Add new job sources

1. Create scraper in `lib/scrapers/`
2. Add normalization function
3. Import in `scripts/sync.ts`
4. Add to the sync loop

---

## 10. Cost Estimate

**Supabase Free Tier:**
- 500 MB database
- 2 GB bandwidth/month
- 50,000 monthly active users
- **Cost: $0/month** ✅

**GitHub Actions Free Tier:**
- 2,000 minutes/month
- Daily sync takes ~2-5 minutes
- **Cost: $0/month** ✅

**Total: $0/month** for up to ~10,000 jobs and 100 companies.

---

## Support

For issues or questions:
1. Check scrape_log table in Supabase
2. Review GitHub Actions logs
3. Check server console output
4. Verify environment variables are set correctly

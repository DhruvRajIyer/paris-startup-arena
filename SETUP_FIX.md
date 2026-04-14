# 🔧 Setup Fix Guide - Paris Startup Arena

## 🚨 Current Issues Identified

### 1. **Supabase Connection Failing**
```
Error: getaddrinfo ENOTFOUND hecqblgpcwuhpkirfsee.supabase.co
```

**Cause:** The Supabase project URL in your `.env` file doesn't exist or was deleted.

**Fix:** Create a new Supabase project and update credentials.

---

## ✅ Complete Setup (5 Minutes)

### **Step 1: Create Supabase Project**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `paris-startup-arena`
   - **Database Password:** (save this somewhere safe)
   - **Region:** Choose closest to you (e.g., `eu-central-1` for Europe)
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### **Step 2: Get Your Credentials**

Once the project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 3: Update Your .env File**

Create or update `/Users/dhruviyer/Downloads/paris-startup-arena/.env`:

```bash
# Supabase credentials (from Step 2)
VITE_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Mapbox (already configured)
VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoiZGhydXZyYWppeWVyIiwiYSI6ImNtbmcyYWIyYTAyOXgycXM2czh2dmtkZm8ifQ.hvU7wWihDhZ01PyaOKfnoA"

# Cron secret (generate any random string)
CRON_SECRET="my-super-secret-key-12345"
```

### **Step 4: Apply Database Schema**

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql` (201 lines)
4. Paste into the SQL Editor
5. Click **"Run"** or press `Cmd/Ctrl + Enter`

You should see: ✅ `Success. No rows returned`

### **Step 5: Verify Tables Created**

1. Click **Table Editor** in left sidebar
2. You should see these tables:
   - ✅ `companies`
   - ✅ `jobs`
   - ✅ `waitlist`
   - ✅ `scrape_log`

If you don't see `scrape_log`, run this in SQL Editor:

```sql
create table if not exists scrape_log (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  started_at    timestamptz default now(),
  finished_at   timestamptz,
  jobs_found    int default 0,
  jobs_inserted int default 0,
  jobs_updated  int default 0,
  jobs_expired  int default 0,
  error         text,
  status        text default 'running'
);

create index if not exists idx_scrape_log_status on scrape_log(status);
create index if not exists idx_scrape_log_started on scrape_log(started_at desc);

alter table scrape_log enable row level security;

create policy "Service role read scrape_log"
  on scrape_log for select
  using (auth.role() = 'service_role');
```

### **Step 6: Seed Database with Data**

```bash
npm run seed:full
```

Expected output:
```
✅ Mistral AI (DeepTech)
  → Senior ML Engineer (eng)
  → Research Scientist (eng)
  → Product Manager - AI (product)

✅ Alan (HealthTech)
  → Frontend Engineer (eng)
  → Product Designer (design)
  → Data Analyst (data)

... (6 more companies)

📊 Summary:
   • Companies: 8
   • Jobs: 20
   • Errors: 0

✨ Database now has:
   • 8 active companies
   • 20 active jobs
```

### **Step 7: Test the Application**

```bash
npm run dev
```

Then visit:
- **Frontend:** http://localhost:3000
- **API - Jobs:** http://localhost:3000/api/jobs
- **API - Companies:** http://localhost:3000/api/companies
- **API - Stats:** http://localhost:3000/api/stats

You should see:
- ✅ Map with 8 company pins across Paris
- ✅ Job cards showing 20+ positions
- ✅ No errors in console

---

## 🐛 Troubleshooting

### Error: "fetch failed" or "ENOTFOUND"
**Problem:** Supabase URL is wrong or project doesn't exist  
**Fix:** Complete Steps 1-3 above with a new project

### Error: "column does not exist"
**Problem:** Schema not applied  
**Fix:** Run Step 4 again (apply schema.sql)

### Error: "Could not find the 'address' column"
**Problem:** Old schema version  
**Fix:** This is now fixed in the seed script (no address field)

### Seed shows "0 companies, 0 jobs" but no errors
**Problem:** RLS (Row Level Security) blocking inserts  
**Fix:** Run this in Supabase SQL Editor:

```sql
-- Temporarily allow all inserts for seeding
DROP POLICY IF EXISTS "Service role insert companies" ON companies;
CREATE POLICY "Service role insert companies"
  ON companies FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role insert jobs" ON jobs;
CREATE POLICY "Service role insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (true);
```

Then run `npm run seed:full` again.

### Map not showing
**Problem:** Mapbox token or companies missing coordinates  
**Fix:** 
1. Check `VITE_MAPBOX_ACCESS_TOKEN` is in `.env`
2. Verify companies have `lat` and `lng` in database

---

## 📋 Quick Checklist

Before running the app, verify:

- [ ] Supabase project created
- [ ] `.env` file has correct `VITE_SUPABASE_URL`
- [ ] `.env` file has correct `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Schema applied (4 tables visible in Table Editor)
- [ ] Seed script run successfully (8 companies, 20 jobs)
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000/api/jobs returns JSON with jobs
- [ ] http://localhost:3000 shows map with pins

---

## 🚀 Deploy to Vercel (After Local Works)

Once everything works locally:

```bash
# Commit changes
git add .
git commit -m "Fix Supabase connection and seed data"
git push

# Deploy to Vercel
# 1. Go to vercel.com
# 2. Import your GitHub repo
# 3. Add environment variables from .env
# 4. Deploy!
```

---

## 💡 Pro Tips

1. **Save your Supabase password** - You'll need it to access the database directly
2. **Use service_role key for scripts** - The anon key has limited permissions
3. **Check Supabase logs** - Dashboard → Logs shows all database queries
4. **Test API first** - Always verify `/api/jobs` works before checking the frontend

---

## 📞 Still Having Issues?

1. Check Supabase Dashboard → Logs for errors
2. Run `npm run dev` and check terminal output
3. Open browser console (F12) and check for errors
4. Verify `.env` file exists and has all 5 variables

The most common issue is **wrong Supabase credentials** - double-check Step 2! 🔑

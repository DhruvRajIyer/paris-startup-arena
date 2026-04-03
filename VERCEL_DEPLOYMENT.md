# Vercel Deployment Guide

## Overview

This guide covers deploying Paris Startup Arena to Vercel with:
- Static frontend (React + Vite)
- Serverless API functions
- Automatic deployments from GitHub
- Environment variable management

---

## 1. Prerequisites

- GitHub account with your repository
- Vercel account (free tier works perfectly)
- Supabase project set up (see `BACKEND_SETUP.md`)

---

## 2. Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Select your `paris-startup-arena` repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 3. Environment Variables

After deployment, add these environment variables in Vercel:

### Go to: Project Settings → Environment Variables

Add the following:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Dashboard → Settings → API (keep private!) |
| `VITE_MAPBOX_ACCESS_TOKEN` | `pk.eyJ...` | Your existing Mapbox token |
| `CRON_SECRET` | `random-string` | Generate a random secret |

**Important:** 
- Set all variables for **Production**, **Preview**, and **Development** environments
- Click "Save" after adding each variable
- Redeploy after adding variables

---

## 4. Redeploy with Environment Variables

After adding environment variables:

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

---

## 5. Verify Deployment

### Test the frontend
Visit your Vercel URL: `https://your-project.vercel.app`

### Test the API endpoints

```bash
# Replace with your Vercel URL
VERCEL_URL="https://your-project.vercel.app"

# Health check
curl $VERCEL_URL/api/health

# Get companies
curl $VERCEL_URL/api/companies

# Get jobs
curl $VERCEL_URL/api/jobs?limit=10

# Get stats
curl $VERCEL_URL/api/stats
```

Expected responses:
- `/api/health` → `{"status":"ok"}`
- `/api/companies` → Array of companies with job counts
- `/api/jobs` → Array of jobs with company data
- `/api/stats` → `{"companies":47,"roles":247}`

---

## 6. Custom Domain (Optional)

### Add a custom domain:

1. Go to **Project Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `paris-startup-arena.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (~5-60 minutes)

### Update Mapbox token restriction:

1. Go to [mapbox.com](https://mapbox.com) → Account → Tokens
2. Edit your token
3. Add your Vercel domain to **URL restrictions**:
   - `https://your-project.vercel.app`
   - `https://your-custom-domain.com` (if using custom domain)

---

## 7. Automatic Deployments

Vercel automatically deploys on every push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

### Deployment workflow:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Runs npm install
# 3. Runs npm run build
# 4. Deploys to production
# 5. Notifies you via email/Slack
```

---

## 8. GitHub Actions + Vercel

The daily sync runs via GitHub Actions (not Vercel serverless functions, which have 10s timeout).

### Ensure GitHub Actions secrets are set:

Go to GitHub repo → Settings → Secrets and variables → Actions

Required secrets:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The workflow in `.github/workflows/daily-sync.yml` will:
1. Run daily at 06:00 Paris time
2. Scrape jobs from Welcome to the Jungle
3. Update Supabase database
4. Vercel API automatically serves fresh data (cached for 1 hour)

---

## 9. Monitoring & Logs

### View deployment logs:

1. Go to **Deployments** tab
2. Click on a deployment
3. View **Build Logs** and **Function Logs**

### View API function logs:

1. Go to **Deployments** → Click deployment
2. Click **"Functions"** tab
3. Select a function (e.g., `/api/companies`)
4. View real-time logs

### Monitor performance:

1. Go to **Analytics** tab
2. View:
   - Page views
   - API requests
   - Response times
   - Error rates

---

## 10. Troubleshooting

### API returns empty data

**Problem:** `/api/companies` or `/api/jobs` returns `[]`

**Solutions:**
1. Verify environment variables are set in Vercel
2. Check `SUPABASE_SERVICE_ROLE_KEY` is correct (not anon key)
3. Redeploy after adding variables
4. Check Supabase has data: Run `npm run seed` locally first
5. View function logs in Vercel dashboard

### Map not showing

**Problem:** Map canvas is blank

**Solutions:**
1. Check `VITE_MAPBOX_ACCESS_TOKEN` is set in Vercel
2. Verify Mapbox token allows your Vercel domain
3. Check browser console for errors
4. Ensure companies have valid lat/lng in database

### Build fails

**Problem:** Deployment fails during build

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `package.json` has correct scripts
3. Test build locally: `npm run build`
4. Check TypeScript errors: `npm run lint`

### GitHub Actions sync fails

**Problem:** Daily sync workflow fails

**Solutions:**
1. Check GitHub Actions logs
2. Verify secrets are set in GitHub (not Vercel)
3. Test sync locally: `npm run sync`
4. Check Supabase service role key is correct

### 404 on API routes

**Problem:** `/api/*` returns 404

**Solutions:**
1. Verify `vercel.json` exists in root
2. Check `api/index.js` exists
3. Redeploy from Vercel dashboard
4. Clear Vercel build cache and redeploy

---

## 11. Performance Optimization

### Edge caching

API responses are cached at Vercel's edge network:
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=7200`
- Fresh data every hour
- Stale data served while revalidating (no downtime)

### Image optimization

If you add company logos:
```jsx
import Image from 'next/image'  // If migrating to Next.js

// Or use Vercel Image Optimization API
<img src={`/_vercel/image?url=${logoUrl}&w=64&q=80`} />
```

### Bundle size

Check bundle size:
```bash
npm run build
# Check dist/ folder size
du -sh dist/
```

Optimize if needed:
- Code splitting (already done with Vite)
- Tree shaking (automatic)
- Lazy loading components

---

## 12. Cost Estimate

### Vercel Free Tier (Hobby):
- ✅ 100 GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions (100 GB-hours)
- ✅ 6,000 build minutes/month
- **Cost: $0/month**

### When to upgrade to Pro ($20/month):
- Need custom domains (>1)
- Need team collaboration
- Need advanced analytics
- Need password protection
- Need more bandwidth (>100 GB/month)

**For this project:** Free tier is more than enough! 🎉

---

## 13. Production Checklist

Before going live:

- [ ] Database seeded with companies (`npm run seed`)
- [ ] GitHub Actions sync tested and working
- [ ] All environment variables set in Vercel
- [ ] Deployment successful on Vercel
- [ ] `/api/companies` returns data
- [ ] `/api/jobs` returns data
- [ ] Map shows pins and cards
- [ ] Waitlist form works
- [ ] Custom domain configured (optional)
- [ ] Mapbox token restricted to your domain
- [ ] Analytics enabled in Vercel
- [ ] Error tracking set up (optional: Sentry)

---

## 14. Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Pull environment variables from Vercel
vercel env pull

# Link local project to Vercel
vercel link
```

---

## 15. Next Steps

After deployment:

1. **Monitor the sync**: Check GitHub Actions runs daily
2. **Add more companies**: Update `scripts/seed.ts` and re-run
3. **Add more scrapers**: Implement Greenhouse, Lever scrapers
4. **Set up alerts**: Add Discord/Slack webhook for sync failures
5. **Analytics**: Enable Vercel Analytics or add Google Analytics
6. **SEO**: Add meta tags, sitemap, robots.txt
7. **Social sharing**: Add Open Graph tags for Twitter/LinkedIn

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **GitHub Issues**: Create an issue in your repo

---

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Deployment URL**: `https://your-project.vercel.app`
- **GitHub Actions**: `https://github.com/your-username/paris-startup-arena/actions`
- **Supabase Dashboard**: `https://supabase.com/dashboard`

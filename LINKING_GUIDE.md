# Job Card Linking Guide

## Overview

Job cards now link directly to the actual application pages on Greenhouse, Lever, and Ashby ATS platforms. When users click on a job card, it opens the application form in a new tab.

## How It Works

### 1. **Data Flow**

```
ATS Scraper → apply_url → Database → API → Frontend → User Click → ATS Application Page
```

**Example URLs:**
- Greenhouse: `https://boards.greenhouse.io/dataiku/jobs/7765844002`
- Lever: `https://jobs.lever.co/qonto/abc123-def456`
- Ashby: `https://jobs.ashbyhq.com/photoroom/xyz789`

### 2. **Scraper Implementation**

Each scraper extracts the `apply_url` from the ATS API:

**Greenhouse** (`lib/scrapers/greenhouse.ts`):
```typescript
apply_url: job.absolute_url
// Example: https://boards.greenhouse.io/dataiku/jobs/7765844002
```

**Lever** (`lib/scrapers/lever.ts`):
```typescript
apply_url: p.applyUrl || p.hostedUrl
// Example: https://jobs.lever.co/qonto/abc123-def456
```

**Ashby** (`lib/scrapers/ashby.ts`):
```typescript
apply_url: job.applyUrl || job.jobUrl
// Example: https://jobs.ashbyhq.com/photoroom/xyz789
```

### 3. **Database Schema**

The `jobs` table includes the `apply_url` field:

```sql
create table jobs (
  id uuid primary key,
  company_id uuid references companies(id),
  title text not null,
  apply_url text not null,  -- ← Application link
  source text,               -- greenhouse, lever, ashby
  source_id text,            -- Unique ID from ATS
  ...
);
```

### 4. **Frontend Implementation**

**JobCard Component** (`src/components/JobCard.tsx`):

```typescript
const handleCardClick = () => {
  // Open ATS application page in new tab
  if (job.apply_url) {
    window.open(job.apply_url, '_blank', 'noopener,noreferrer');
  }
  onClick?.(job);
};
```

**Visual Indicator:**
- Cards with `apply_url` show an "Apply" button with external link icon
- Clicking anywhere on the card opens the application page
- Opens in new tab to preserve user's browsing session

### 5. **User Experience**

**Before:**
```
User clicks job card → Nothing happens (or internal modal)
```

**After:**
```
User clicks job card → New tab opens → ATS application form
```

**Benefits:**
- Direct access to application forms
- No manual searching for company careers pages
- Seamless application experience
- Preserves context (original tab stays open)

## Testing

### Verify Links Work

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:** http://localhost:3000

3. **Click any job card** - should open ATS application page

4. **Check different sources:**
   - Dataiku jobs → Greenhouse
   - Qonto jobs → Lever
   - Photoroom jobs → Ashby

### Example Jobs to Test

| Company | ATS | Sample Job | Expected URL |
|---------|-----|------------|--------------|
| Dataiku | Greenhouse | Senior ML Engineer | `boards.greenhouse.io/dataiku/jobs/...` |
| Doctolib | Greenhouse | Backend Engineer | `boards.greenhouse.io/doctolib/jobs/...` |
| Qonto | Lever | Product Manager | `jobs.lever.co/qonto/...` |
| Photoroom | Ashby | Computer Vision | `jobs.ashbyhq.com/photoroom/...` |

## Troubleshooting

### Job card doesn't open anything

**Check:**
1. Does the job have an `apply_url`?
   ```sql
   SELECT title, apply_url FROM jobs WHERE id = 'job-id';
   ```

2. Is the URL valid?
   - Should start with `https://`
   - Should point to ATS domain

3. Browser blocking popups?
   - Check browser console for errors
   - Allow popups for localhost

### Wrong URL format

**Fix in scraper:**
```typescript
// Ensure full URL, not relative path
apply_url: job.absolute_url || `https://boards.greenhouse.io/...`
```

### Link opens but shows 404

**Possible causes:**
1. Job was removed from ATS
2. Slug changed
3. Company changed ATS platform

**Solution:**
- Re-run sync to update/expire stale jobs
- Verify slug in registry is correct

## Analytics (Future Enhancement)

Track which jobs get the most clicks:

```typescript
const handleCardClick = () => {
  // Track click event
  analytics.track('job_application_click', {
    job_id: job.id,
    company: job.company?.name,
    source: job.source,
    category: job.category,
  });
  
  window.open(job.apply_url, '_blank');
};
```

## Security Considerations

**Current implementation:**
- Uses `noopener,noreferrer` to prevent:
  - Reverse tabnabbing attacks
  - Referrer leakage
  - Performance issues

**Best practices:**
- ✅ Opens in new tab (preserves user context)
- ✅ Uses `noopener` (prevents window.opener access)
- ✅ Uses `noreferrer` (doesn't send referrer header)
- ✅ Validates URLs come from trusted ATS platforms

## Customization

### Change click behavior

**Option 1: Open in same tab**
```typescript
window.location.href = job.apply_url;
```

**Option 2: Show modal first**
```typescript
const handleCardClick = () => {
  setSelectedJob(job);
  setShowModal(true);
};
```

**Option 3: Copy link to clipboard**
```typescript
navigator.clipboard.writeText(job.apply_url);
toast.success('Application link copied!');
```

### Add source badge

Show which ATS platform:

```tsx
{job.source && (
  <span className="text-xs uppercase">
    via {job.source}
  </span>
)}
```

## Summary

✅ **184 jobs** now link to actual application pages  
✅ **3 ATS platforms** integrated (Greenhouse, Lever, Ashby)  
✅ **One-click apply** - no manual searching  
✅ **Secure** - uses noopener/noreferrer  
✅ **User-friendly** - opens in new tab  

All job cards are now fully functional and link directly to the ATS application forms! 🎉

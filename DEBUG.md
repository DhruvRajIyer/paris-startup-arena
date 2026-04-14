# Debugging Job Card Clicks

## Issue
Job cards not opening ATS application pages when clicked.

## Debugging Steps

### 1. Check if server is running
```bash
npm run dev
```
Server should start on http://localhost:3000

### 2. Test API endpoint
```bash
./test-api.sh
```

Should show:
- ✅ API is responding
- ✅ Jobs array found
- ✅ apply_url field exists
- ✅ Sample apply_url: https://...

### 3. Open browser console
1. Visit http://localhost:3000
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Click on a job card

### 4. Check console output
You should see:
```
🔍 JobCard clicked: {
  title: "Senior ML Engineer",
  apply_url: "https://boards.greenhouse.io/dataiku/jobs/...",
  has_url: true,
  url_type: "string"
}
✅ Opening URL: https://boards.greenhouse.io/dataiku/jobs/...
✅ Window opened successfully
```

## Common Issues

### Issue 1: Popup Blocked
**Symptom:** Console shows "❌ Popup blocked!"

**Fix:**
1. Click the popup blocker icon in browser address bar
2. Allow popups for localhost:3000
3. Try clicking again

### Issue 2: No apply_url
**Symptom:** Console shows "⚠️ No apply_url for this job"

**Fix:**
1. Check if job has apply_url in database:
   ```sql
   SELECT title, apply_url, source FROM jobs LIMIT 10;
   ```
2. If missing, re-run sync:
   ```bash
   npm run sync
   ```

### Issue 3: apply_url is null/undefined
**Symptom:** `has_url: false` or `url_type: "undefined"`

**Fix:**
1. Check API response includes apply_url
2. Verify server.ts selects apply_url field
3. Check database has apply_url values

### Issue 4: Click not triggering
**Symptom:** No console output when clicking

**Possible causes:**
1. JavaScript error preventing handler from running
2. Another element capturing the click
3. Event propagation stopped

**Fix:**
1. Check browser console for errors
2. Inspect element to verify onClick is attached
3. Try clicking directly on card (not on nested elements)

## Verification Checklist

- [ ] Server running on http://localhost:3000
- [ ] API returns jobs with apply_url field
- [ ] Browser console shows no errors
- [ ] Popups allowed for localhost
- [ ] Click triggers console log
- [ ] New tab opens with ATS page

## Manual Test

1. Start server: `npm run dev`
2. Open: http://localhost:3000
3. Open browser console (F12)
4. Click any job card
5. Check console for debug output
6. Verify new tab opens

## Expected Behavior

**Click on Dataiku job:**
- Console: `🔍 JobCard clicked: {...}`
- Console: `✅ Opening URL: https://boards.greenhouse.io/dataiku/jobs/...`
- New tab opens with Greenhouse application form

**Click on Qonto job:**
- New tab opens with Lever application form

**Click on Photoroom job:**
- New tab opens with Ashby application form

## If Still Not Working

1. **Check job data:**
   ```bash
   curl http://localhost:3000/api/jobs | grep -o '"apply_url":"[^"]*"' | head -5
   ```

2. **Verify JobCard component:**
   ```bash
   grep -A 5 "handleCardClick" src/components/JobCard.tsx
   ```

3. **Test with simple alert:**
   Add to handleCardClick:
   ```typescript
   alert('Clicked! URL: ' + job.apply_url);
   ```

4. **Check browser settings:**
   - Popups allowed?
   - JavaScript enabled?
   - No extensions blocking?

## Success Indicators

✅ Console shows click events  
✅ apply_url is present and valid  
✅ New tab opens automatically  
✅ ATS application form loads  
✅ No popup blocker warnings  

## Current Status

**Debug mode enabled** - JobCard now logs detailed information to console.

Visit http://localhost:3000 and check the browser console when clicking jobs!

/**
 * Daily sync script - orchestrates all scrapers and updates database
 * Run via: npx tsx scripts/sync.ts
 * Or via GitHub Actions cron
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fetchAllWTTJPages, normalizeWTTJJob } from '../lib/scrapers/wttj.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ScrapeLog {
  id: string;
  source: string;
  started_at: string;
  finished_at?: string;
  jobs_found: number;
  jobs_inserted: number;
  jobs_updated: number;
  jobs_expired: number;
  error?: string;
  status: 'running' | 'success' | 'error';
}

async function startScrapeLog(source: string): Promise<ScrapeLog> {
  const { data, error } = await supabase
    .from('scrape_log')
    .insert({ source, status: 'running' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function finishScrapeLog(
  id: string,
  updates: Partial<ScrapeLog>
): Promise<void> {
  await supabase
    .from('scrape_log')
    .update({ ...updates, finished_at: new Date().toISOString() })
    .eq('id', id);
}

async function findOrCreateCompany(companyName: string, companySlug: string) {
  // Check if company exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', companySlug)
    .single();

  if (existing) return existing.id;

  // Create new company (will need manual geocoding later)
  const logo_initials = companyName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      slug: companySlug,
      sector: 'Other', // Default, can be updated manually
      logo_initials,
      lat: 48.8566, // Default Paris center
      lng: 2.3522,
      is_active: true,
      is_verified: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to create company ${companyName}:`, error);
    return null;
  }

  console.log(`  📍 Created new company: ${companyName}`);
  return newCompany.id;
}

export async function runDailySync() {
  console.log('🚀 Starting daily job sync...\n');
  
  const logEntry = await startScrapeLog('daily-sync');
  let jobsFound = 0;
  let jobsInserted = 0;
  let jobsUpdated = 0;

  try {
    // ── 1. Fetch from WTTJ ──────────────────────────────────
    console.log('📥 Fetching jobs from Welcome to the Jungle...');
    const wttjJobs = await fetchAllWTTJPages();
    jobsFound = wttjJobs.length;

    // ── 2. Process and upsert jobs ──────────────────────────
    console.log(`\n📝 Processing ${jobsFound} jobs...`);
    
    for (const rawJob of wttjJobs) {
      const normalized = normalizeWTTJJob(rawJob);
      if (!normalized) continue;

      // Find or create company
      const companyId = await findOrCreateCompany(
        normalized.company_name,
        normalized.company_slug
      );

      if (!companyId) continue;

      // Check if job already exists
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('source', normalized.source)
        .eq('source_id', normalized.source_id)
        .single();

      if (existing) {
        // Update to keep it fresh
        await supabase
          .from('jobs')
          .update({
            is_active: true,
            expires_at: normalized.expires_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        jobsUpdated++;
      } else {
        // Insert new job
        const { error } = await supabase
          .from('jobs')
          .insert({
            company_id: companyId,
            title: normalized.title,
            category: normalized.category,
            tags: normalized.tags,
            salary_min: normalized.salary_min,
            salary_max: normalized.salary_max,
            work_mode: normalized.work_mode,
            description: normalized.description,
            requirements: normalized.requirements,
            apply_url: normalized.apply_url,
            source: normalized.source,
            source_id: normalized.source_id,
            posted_at: normalized.posted_at,
            expires_at: normalized.expires_at,
            is_active: true,
          });

        if (error) {
          console.error(`  ❌ Failed to insert job: ${normalized.title}`, error.message);
        } else {
          jobsInserted++;
        }
      }

      // Progress indicator
      if ((jobsInserted + jobsUpdated) % 10 === 0) {
        console.log(`  ⏳ Processed ${jobsInserted + jobsUpdated} jobs...`);
      }
    }

    // ── 3. Expire stale jobs ───────────────────────────────────────
    console.log('\n🗑️  Expiring stale jobs...');
    const { data: expiredJobs, error: expireError } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    const jobsExpired = expiredJobs?.length || 0;

    if (expireError) {
      console.error('Error expiring jobs:', expireError);
    } else {
      console.log(`  ✅ Expired ${jobsExpired} stale jobs`);
    }

    // ── 4. Finish log ──────────────────────────────────────────────
    await finishScrapeLog(logEntry.id, {
      status: 'success',
      jobs_found: jobsFound,
      jobs_inserted: jobsInserted,
      jobs_updated: jobsUpdated,
      jobs_expired: jobsExpired,
    });

    console.log('\n✨ Sync complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Found: ${jobsFound}`);
    console.log(`   • Inserted: ${jobsInserted}`);
    console.log(`   • Updated: ${jobsUpdated}`);
    console.log(`   • Expired: ${jobsExpired}`);

  } catch (err: any) {
    console.error('\n💥 Sync failed:', err);
    
    await finishScrapeLog(logEntry.id, {
      status: 'error',
      error: err.message,
      jobs_found: jobsFound,
      jobs_inserted: jobsInserted,
      jobs_updated: jobsUpdated,
    });

    throw err;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailySync()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

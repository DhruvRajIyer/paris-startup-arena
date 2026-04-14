/**
 * Daily sync script - orchestrates all scrapers and updates database
 * Run via: npx tsx scripts/sync.ts
 * Or via GitHub Actions cron
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fetchAllWTTJPages, normalizeWTTJJob } from '../lib/scrapers/wttj.js';
import { PARIS_COMPANIES } from '../lib/scrapers/registry.js';
import { scrapeGreenhouse } from '../lib/scrapers/greenhouse.js';
import { scrapeLever } from '../lib/scrapers/lever.js';
import { scrapeAshby } from '../lib/scrapers/ashby.js';
import type { JobInsert } from '../lib/scrapers/greenhouse.js';

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

async function findOrCreateCompany(
  companyName: string, 
  companySlug: string,
  sector = 'Other'
) {
  // Check if company exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', companySlug)
    .single();

  if (existing) return existing.id;

  // Create new company (flagged for manual review)
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
      sector,
      logo_initials,
      lat: 48.8566, // Default Paris center - needs manual geocoding
      lng: 2.3522,
      is_active: true,
      is_verified: false, // Flag for manual review
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to create company ${companyName}:`, error);
    return null;
  }

  console.log(`  📍 Created new company: ${companyName} (${sector}) - needs geocoding`);
  return newCompany.id;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function upsertJob(job: JobInsert, stats: { inserted: number; updated: number; errors: number }) {
  // Resolve company_id from db_slug
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', job.company_db_slug)
    .single();

  if (!company) {
    console.warn(`  ⚠️  No company found for slug: ${job.company_db_slug}`);
    stats.errors++;
    return;
  }

  // Check if job already exists
  const { data: existing } = await supabase
    .from('jobs')
    .select('id')
    .eq('source', job.source)
    .eq('source_id', job.source_id)
    .maybeSingle();

  if (existing) {
    // Update to keep it fresh
    await supabase
      .from('jobs')
      .update({
        is_active: true,
        expires_at: job.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    stats.updated++;
  } else {
    // Insert new job
    const { error } = await supabase
      .from('jobs')
      .insert({
        company_id: company.id,
        title: job.title,
        category: job.category,
        tags: job.tags,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        work_mode: job.work_mode,
        description: job.description,
        requirements: job.requirements,
        apply_url: job.apply_url,
        source: job.source,
        source_id: job.source_id,
        posted_at: job.posted_at,
        expires_at: job.expires_at,
        is_active: true,
      });

    if (error) {
      console.error(`  ❌ Failed to insert: ${job.title}`, error.message);
      stats.errors++;
    } else {
      stats.inserted++;
    }
  }
}

export async function runDailySync() {
  console.log('🚀 Starting daily job sync...\n');
  
  const logEntry = await startScrapeLog('daily-sync');
  const stats = { found: 0, inserted: 0, updated: 0, errors: 0 };
  const allJobs: JobInsert[] = [];

  try {
    // ── 1. Scrape from ATS platforms ──────────────────────────────────
    console.log('� Fetching jobs from ATS platforms...\n');
    
    for (const company of PARIS_COMPANIES) {
      try {
        let jobs: JobInsert[] = [];

        if (company.ats === 'greenhouse') {
          jobs = await scrapeGreenhouse(company);
        } else if (company.ats === 'lever') {
          jobs = await scrapeLever(company);
        } else if (company.ats === 'ashby') {
          jobs = await scrapeAshby(company);
        }

        console.log(`  ${company.name} (${company.ats}): ${jobs.length} Paris jobs`);
        allJobs.push(...jobs);

        // Polite delay between companies
        await sleep(300);
      } catch (err) {
        console.error(`  ❌ Error scraping ${company.name}:`, err);
        stats.errors++;
      }
    }

    // ── 2. Fetch from WTTJ (legacy) ──────────────────────────────────
    console.log('\n📥 Fetching jobs from Welcome to the Jungle...');
    try {
      const wttjJobs = await fetchAllWTTJPages();
      console.log(`  WTTJ: ${wttjJobs.length} jobs found`);
      
      for (const rawJob of wttjJobs) {
        const normalized = normalizeWTTJJob(rawJob);
        if (!normalized) continue;

        // Find or create company for WTTJ jobs
        const companyId = await findOrCreateCompany(
          normalized.company_name,
          normalized.company_slug,
          'Other'
        );

        if (!companyId) continue;

        // Convert to JobInsert format
        allJobs.push({
          company_db_slug: normalized.company_slug,
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
          posted_at: normalized.posted_at.toISOString(),
          expires_at: normalized.expires_at.toISOString(),
        });
      }
    } catch (err) {
      console.warn('  ⚠️  WTTJ fetch failed (API may be down):', err);
    }

    stats.found = allJobs.length;
    console.log(`\n📝 Processing ${stats.found} total jobs...\n`);

    // ── 3. Upsert all jobs ──────────────────────────────────
    for (const job of allJobs) {
      await upsertJob(job, stats);

      // Progress indicator
      if ((stats.inserted + stats.updated) % 10 === 0) {
        console.log(`  ⏳ Processed ${stats.inserted + stats.updated} jobs...`);
      }
    }

    // ── 4. Expire stale jobs ───────────────────────────────────────
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

    // ── 5. Finish log ──────────────────────────────────────────────
    await finishScrapeLog(logEntry.id, {
      status: 'success',
      jobs_found: stats.found,
      jobs_inserted: stats.inserted,
      jobs_updated: stats.updated,
      jobs_expired: jobsExpired,
    });

    console.log('\n✨ Sync complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Found: ${stats.found}`);
    console.log(`   • Inserted: ${stats.inserted}`);
    console.log(`   • Updated: ${stats.updated}`);
    console.log(`   • Expired: ${jobsExpired}`);
    console.log(`   • Errors: ${stats.errors}`);

  } catch (err: any) {
    console.error('\n💥 Sync failed:', err);
    
    await finishScrapeLog(logEntry.id, {
      status: 'error',
      error: err.message,
      jobs_found: stats.found,
      jobs_inserted: stats.inserted,
      jobs_updated: stats.updated,
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

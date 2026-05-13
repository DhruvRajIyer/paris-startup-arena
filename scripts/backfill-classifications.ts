/**
 * One-time backfill: classify contract_type + experience_level on all existing jobs
 * Run: npx tsx scripts/backfill-classifications.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { classifyContractType, classifyExperienceLevel } from '../lib/scrapers/classifier.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function backfill() {
  console.log('🔍 Fetching all active jobs for backfill...');

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, tags, description')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch jobs:', error);
    process.exit(1);
  }

  console.log(`📝 Classifying ${jobs.length} jobs...\n`);

  let updated = 0;
  let errors = 0;

  for (const job of jobs) {
    const contract_type = classifyContractType(job.title, job.description ?? '');
    const experience_level = classifyExperienceLevel(job.title, job.tags ?? [], job.description ?? '');

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ contract_type, experience_level })
      .eq('id', job.id);

    if (updateError) {
      console.error(`  ❌ ${job.title}: ${updateError.message}`);
      errors++;
    } else {
      updated++;
      if (updated % 25 === 0) {
        console.log(`  ⏳ Classified ${updated}/${jobs.length}...`);
      }
    }
  }

  console.log(`\n✨ Backfill complete!`);
  console.log(`   • Updated: ${updated}`);
  console.log(`   • Errors:  ${errors}`);
}

backfill()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Backfill failed:', err);
    process.exit(1);
  });

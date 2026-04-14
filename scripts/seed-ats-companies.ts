/**
 * Seed ATS companies from registry
 * Run: npm run seed:ats
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PARIS_COMPANIES } from '../lib/scrapers/registry.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Company locations (manually geocoded)
const COMPANY_LOCATIONS: Record<string, { lat: number; lng: number; arrondissement: number; address?: string }> = {
  'dataiku': { lat: 48.8736, lng: 2.3377, arrondissement: 9 },
  'doctolib': { lat: 48.8820, lng: 2.3264, arrondissement: 9 },
  'qonto': { lat: 48.8798, lng: 2.3377, arrondissement: 9 },
  'photoroom': { lat: 48.8566, lng: 2.3522, arrondissement: 4 }, // Default Paris center
};

async function seedATSCompanies() {
  console.log('🌱 Seeding ATS companies from registry...\n');

  let created = 0;
  let skipped = 0;

  for (const company of PARIS_COMPANIES) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', company.db_slug)
        .single();

      if (existing) {
        console.log(`⏭️  ${company.name} - already exists`);
        skipped++;
        continue;
      }

      // Get location
      const location = COMPANY_LOCATIONS[company.db_slug] || {
        lat: 48.8566,
        lng: 2.3522,
        arrondissement: 1,
      };

      // Create logo initials
      const logo_initials = company.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      // Insert company
      const { error } = await supabase
        .from('companies')
        .insert({
          name: company.name,
          slug: company.db_slug,
          sector: company.sector,
          logo_initials,
          lat: location.lat,
          lng: location.lng,
          arrondissement: location.arrondissement,
          is_active: true,
          is_verified: true, // These are known companies
        });

      if (error) {
        console.error(`❌ Failed to create ${company.name}:`, error.message);
      } else {
        console.log(`✅ ${company.name} (${company.sector}) - ${company.ats}`);
        created++;
      }
    } catch (err: any) {
      console.error(`❌ Error processing ${company.name}:`, err.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   • Created: ${created}`);
  console.log(`   • Skipped: ${skipped}`);

  // Verify
  const { count } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`\n✨ Total active companies: ${count}`);
}

seedATSCompanies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Seed failed:', err);
    process.exit(1);
  });

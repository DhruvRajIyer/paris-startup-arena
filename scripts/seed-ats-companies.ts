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
  // 1er–4e (Centre / Marais)
  'photoroom':    { lat: 48.8600, lng: 2.3490, arrondissement: 4,  address: '18 Rue du Renard, Paris 4' },

  // 8e–9e (Opéra / Grands Boulevards)
  'dataiku':      { lat: 48.8736, lng: 2.3377, arrondissement: 9,  address: '203 Rue de Bercy, Paris 9' },
  'doctolib':     { lat: 48.8820, lng: 2.3264, arrondissement: 9,  address: '54 Rue de Châteaudun, Paris 9' },
  'alan':         { lat: 48.8779, lng: 2.3296, arrondissement: 9,  address: '50 Rue de Châteaudun, Paris 9' },
  'qonto':        { lat: 48.8798, lng: 2.3377, arrondissement: 9,  address: '18 Rue de Navarin, Paris 9' },
  'swile':        { lat: 48.8779, lng: 2.3379, arrondissement: 9,  address: '36 Rue de Navarin, Paris 9' },
  'aircall':      { lat: 48.8735, lng: 2.3409, arrondissement: 9,  address: '7 Rue de Madrid, Paris 9' },
  'payfit':       { lat: 48.8736, lng: 2.3122, arrondissement: 8,  address: '65 Boulevard Haussmann, Paris 8' },

  // 10e–11e (République / Canal)
  'pigment':      { lat: 48.8640, lng: 2.3668, arrondissement: 11, address: '7 Rue du Faubourg Saint-Antoine, Paris 11' },
  'lempire':      { lat: 48.8637, lng: 2.3490, arrondissement: 11, address: '15 Rue de la Roquette, Paris 11' },
  'pennylane':    { lat: 48.8639, lng: 2.3510, arrondissement: 11, address: '12 Rue Saint-Sébastien, Paris 11' },

  // 12e–13e (Bercy / Nation)
  'back-market':  { lat: 48.8465, lng: 2.3752, arrondissement: 12, address: '56 Rue de la Victoire, Paris 12' },

  // 2e (Bourse)
  'ledger':       { lat: 48.8666, lng: 2.3440, arrondissement: 2,  address: '1 Rue du Mail, Paris 2' },
  'contentsquare':{ lat: 48.8653, lng: 2.3430, arrondissement: 2,  address: '7 Rue de Hanovre, Paris 2' },
  'spendesk':     { lat: 48.8680, lng: 2.3450, arrondissement: 2,  address: '28 Rue de Richelieu, Paris 2' },
  'dashlane':     { lat: 48.8661, lng: 2.3440, arrondissement: 2,  address: '6 Rue Ménars, Paris 2' },
  'algolia':      { lat: 48.8670, lng: 2.3460, arrondissement: 2,  address: '55 Rue d\'Amsterdam, Paris 2' },

  // 15e (Vaugirard)
  'mistral-ai':   { lat: 48.8450, lng: 2.3020, arrondissement: 15, address: '15 Rue de la Baume, Paris 15' },

  // Suburbs / La Défense
  'exotec':       { lat: 48.9000, lng: 2.2417, arrondissement: 17, address: 'Parc des Docks, Saint-Ouen' },
  'blablacar':    { lat: 48.8826, lng: 2.3360, arrondissement: 9,  address: '84 Avenue de la République, Paris 9' },
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
          website: company.website || null,
          lat: location.lat,
          lng: location.lng,
          arrondissement: location.arrondissement,
          address: location.address || null,
          is_active: true,
          is_verified: true,
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

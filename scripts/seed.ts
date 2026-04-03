import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SEED_COMPANIES = [
  { name: 'Alan', sector: 'HealthTech', address: '50 Rue de Clichy, 75009 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://alan.com', lat: 48.8820, lng: 2.3264, arrondissement: 9 },
  { name: 'Doctolib', sector: 'HealthTech', address: '54 Quai Charles Pasqua, 92300 Levallois', funding_stage: 'Série D', employee_count: '200+', website: 'https://doctolib.fr', lat: 48.8894, lng: 2.2869, arrondissement: null },
  { name: 'Spendesk', sector: 'FinTech', address: '2 Cité Paradis, 75010 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://spendesk.com', lat: 48.8752, lng: 2.3573, arrondissement: 10 },
  { name: 'Mistral AI', sector: 'DeepTech', address: '15 Rue des Halles, 75001 Paris', funding_stage: 'Série B', employee_count: '51-200', website: 'https://mistral.ai', lat: 48.8608, lng: 2.3472, arrondissement: 1 },
  { name: 'Back Market', sector: 'CleanTech', address: '199 Rue Championnet, 75018 Paris', funding_stage: 'Série D', employee_count: '200+', website: 'https://backmarket.fr', lat: 48.8939, lng: 2.3382, arrondissement: 18 },
  { name: 'Swile', sector: 'HRTech', address: '11-13 Rue Saint-Georges, 75009 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://swile.co', lat: 48.8779, lng: 2.3379, arrondissement: 9 },
  { name: 'Qonto', sector: 'FinTech', address: '18 Rue de Navarin, 75009 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://qonto.com', lat: 48.8798, lng: 2.3377, arrondissement: 9 },
  { name: 'Contentsquare', sector: 'DeepTech', address: '7 Rue de Madrid, 75008 Paris', funding_stage: 'Série F', employee_count: '200+', website: 'https://contentsquare.com', lat: 48.8775, lng: 2.3172, arrondissement: 8 },
  { name: 'Ledger', sector: 'DeepTech', address: '1 Rue du Mail, 75002 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://ledger.com', lat: 48.8666, lng: 2.3440, arrondissement: 2 },
  { name: 'ManoMano', sector: 'Other', address: '59 Rue de Ponthieu, 75008 Paris', funding_stage: 'Série F', employee_count: '200+', website: 'https://manomano.fr', lat: 48.8740, lng: 2.3068, arrondissement: 8 },
  { name: 'Meero', sector: 'DeepTech', address: '5 Parvis Alan Turing, 75013 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://meero.com', lat: 48.8248, lng: 2.3661, arrondissement: 13 },
  { name: 'Dataiku', sector: 'DeepTech', address: '203 Rue du Faubourg Saint-Antoine, 75011 Paris', funding_stage: 'Série E', employee_count: '200+', website: 'https://dataiku.com', lat: 48.8527, lng: 2.3906, arrondissement: 11 },
  { name: 'BlaBlaCar', sector: 'Other', address: '84 Avenue de la République, 75011 Paris', funding_stage: 'Série D', employee_count: '200+', website: 'https://blablacar.com', lat: 48.8639, lng: 2.3798, arrondissement: 11 },
  { name: 'Shift Technology', sector: 'DeepTech', address: '35 Boulevard des Capucines, 75002 Paris', funding_stage: 'Série D', employee_count: '200+', website: 'https://shift-technology.com', lat: 48.8698, lng: 2.3314, arrondissement: 2 },
  { name: 'Mirakl', sector: 'Other', address: '5 Rue de la Baume, 75008 Paris', funding_stage: 'Série E', employee_count: '200+', website: 'https://mirakl.com', lat: 48.8736, lng: 2.3122, arrondissement: 8 },
  { name: 'PayFit', sector: 'HRTech', address: '5 Rue de la Baume, 75008 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://payfit.com', lat: 48.8736, lng: 2.3122, arrondissement: 8 },
  { name: 'Vestiaire Collective', sector: 'Other', address: '80 Rue Taitbout, 75009 Paris', funding_stage: 'Série E', employee_count: '200+', website: 'https://vestiairecollective.com', lat: 48.8764, lng: 2.3361, arrondissement: 9 },
  { name: 'Lydia', sector: 'FinTech', address: '14 Avenue de l\'Opéra, 75001 Paris', funding_stage: 'Série C', employee_count: '51-200', website: 'https://lydia-app.com', lat: 48.8650, lng: 2.3341, arrondissement: 1 },
  { name: 'Ynsect', sector: 'FoodTech', address: '1 Rue Pierre Fontaine, 91000 Évry', funding_stage: 'Série C', employee_count: '200+', website: 'https://ynsect.com', lat: 48.6296, lng: 2.4281, arrondissement: null },
  { name: 'Algolia', sector: 'DeepTech', address: '55 Rue d\'Amsterdam, 75008 Paris', funding_stage: 'Série C', employee_count: '200+', website: 'https://algolia.com', lat: 48.8802, lng: 2.3276, arrondissement: 8 },
];

async function seed() {
  console.log('🌱 Seeding Paris startup companies...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const company of SEED_COMPANIES) {
    const slug = company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const logo_initials = company.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const { error } = await supabase
      .from('companies')
      .upsert(
        {
          ...company,
          slug,
          logo_initials,
          is_verified: true,
          is_active: true,
        },
        { onConflict: 'slug' }
      );

    if (error) {
      console.error(`❌ Failed to seed ${company.name}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Seeded: ${company.name} (${company.sector})`);
      successCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} companies seeded, ${errorCount} errors`);
  
  // Verify the seed
  const { count } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`\n✨ Total active companies in database: ${count}`);
}

seed()
  .then(() => {
    console.log('\n🎉 Seed complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Seed failed:', err);
    process.exit(1);
  });

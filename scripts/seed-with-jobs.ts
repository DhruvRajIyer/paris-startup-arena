/**
 * Seed database with companies AND sample jobs
 * This creates a complete working dataset without external APIs
 * Run: npm run seed:full
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const COMPANIES_WITH_JOBS = [
  {
    company: {
      name: 'Mistral AI',
      sector: 'DeepTech',
      funding_stage: 'Série B',
      employee_count: '51-200',
      website: 'https://mistral.ai',
      lat: 48.8608,
      lng: 2.3472,
      arrondissement: 1,
    },
    jobs: [
      { title: 'Senior ML Engineer', category: 'eng', work_mode: 'hybrid', tags: ['Python', 'PyTorch', 'LLMs'], salary_min: 90000, salary_max: 130000, is_featured: true },
      { title: 'Research Scientist', category: 'eng', work_mode: 'onsite', tags: ['AI', 'Research', 'Python'], salary_min: 80000, salary_max: 120000, is_featured: true },
      { title: 'Product Manager - AI', category: 'product', work_mode: 'hybrid', tags: ['AI', 'Product'], salary_min: 70000, salary_max: 100000 },
    ]
  },
  {
    company: {
      name: 'Alan',
      sector: 'HealthTech',
      funding_stage: 'Série C',
      employee_count: '200+',
      website: 'https://alan.com',
      lat: 48.8820,
      lng: 2.3264,
      arrondissement: 9,
    },
    jobs: [
      { title: 'Frontend Engineer', category: 'eng', work_mode: 'hybrid', tags: ['React', 'TypeScript', 'GraphQL'], salary_min: 60000, salary_max: 85000 },
      { title: 'Product Designer', category: 'design', work_mode: 'hybrid', tags: ['Figma', 'UI/UX', 'Mobile'], salary_min: 55000, salary_max: 75000, is_featured: true },
      { title: 'Data Analyst', category: 'data', work_mode: 'remote', tags: ['SQL', 'Python', 'Analytics'], salary_min: 50000, salary_max: 70000 },
    ]
  },
  {
    company: {
      name: 'Qonto',
      sector: 'FinTech',
      funding_stage: 'Série C',
      employee_count: '200+',
      website: 'https://qonto.com',
      lat: 48.8798,
      lng: 2.3377,
      arrondissement: 9,
    },
    jobs: [
      { title: 'Backend Engineer', category: 'eng', work_mode: 'hybrid', tags: ['Go', 'Kubernetes', 'PostgreSQL'], salary_min: 65000, salary_max: 90000 },
      { title: 'Growth Manager', category: 'growth', work_mode: 'onsite', tags: ['Marketing', 'Analytics'], salary_min: 55000, salary_max: 75000 },
      { title: 'Security Engineer', category: 'eng', work_mode: 'hybrid', tags: ['Security', 'DevOps', 'AWS'], salary_min: 70000, salary_max: 95000, is_featured: true },
    ]
  },
  {
    company: {
      name: 'Ledger',
      sector: 'DeepTech',
      funding_stage: 'Série C',
      employee_count: '200+',
      website: 'https://ledger.com',
      lat: 48.8666,
      lng: 2.3440,
      arrondissement: 2,
    },
    jobs: [
      { title: 'Embedded Systems Engineer', category: 'eng', work_mode: 'onsite', tags: ['C', 'Embedded', 'Hardware'], salary_min: 60000, salary_max: 85000 },
      { title: 'Blockchain Developer', category: 'eng', work_mode: 'hybrid', tags: ['Blockchain', 'Rust', 'Web3'], salary_min: 70000, salary_max: 100000, is_featured: true },
    ]
  },
  {
    company: {
      name: 'Back Market',
      sector: 'CleanTech',
      funding_stage: 'Série D',
      employee_count: '200+',
      website: 'https://backmarket.fr',
      lat: 48.8939,
      lng: 2.3382,
      arrondissement: 18,
    },
    jobs: [
      { title: 'Full Stack Engineer', category: 'eng', work_mode: 'remote', tags: ['React', 'Node.js', 'MongoDB'], salary_min: 55000, salary_max: 80000 },
      { title: 'Operations Manager', category: 'ops', work_mode: 'onsite', tags: ['Operations', 'Logistics'], salary_min: 50000, salary_max: 70000 },
    ]
  },
  {
    company: {
      name: 'Swile',
      sector: 'HRTech',
      funding_stage: 'Série C',
      employee_count: '200+',
      website: 'https://swile.co',
      lat: 48.8779,
      lng: 2.3379,
      arrondissement: 9,
    },
    jobs: [
      { title: 'Mobile Developer', category: 'eng', work_mode: 'hybrid', tags: ['React Native', 'iOS', 'Android'], salary_min: 60000, salary_max: 85000 },
      { title: 'Customer Success Manager', category: 'ops', work_mode: 'onsite', tags: ['Customer Success', 'SaaS'], salary_min: 45000, salary_max: 60000 },
    ]
  },
  {
    company: {
      name: 'Dataiku',
      sector: 'DeepTech',
      funding_stage: 'Série E',
      employee_count: '200+',
      website: 'https://dataiku.com',
      lat: 48.8527,
      lng: 2.3906,
      arrondissement: 11,
    },
    jobs: [
      { title: 'Solutions Engineer', category: 'eng', work_mode: 'hybrid', tags: ['Python', 'ML', 'Data Science'], salary_min: 65000, salary_max: 90000 },
      { title: 'Technical Writer', category: 'ops', work_mode: 'remote', tags: ['Documentation', 'Technical Writing'], salary_min: 45000, salary_max: 60000 },
    ]
  },
  {
    company: {
      name: 'PayFit',
      sector: 'HRTech',
      funding_stage: 'Série C',
      employee_count: '200+',
      website: 'https://payfit.com',
      lat: 48.8736,
      lng: 2.3122,
      arrondissement: 8,
    },
    jobs: [
      { title: 'Senior Frontend Engineer', category: 'eng', work_mode: 'hybrid', tags: ['Vue', 'TypeScript', 'GraphQL'], salary_min: 65000, salary_max: 90000, is_featured: true },
      { title: 'Product Marketing Manager', category: 'growth', work_mode: 'onsite', tags: ['Marketing', 'B2B', 'SaaS'], salary_min: 55000, salary_max: 75000 },
    ]
  },
];

async function seedWithJobs() {
  console.log('🌱 Seeding database with companies and jobs...\n');

  let companiesCreated = 0;
  let jobsCreated = 0;
  let errors = 0;

  for (const { company, jobs } of COMPANIES_WITH_JOBS) {
    try {
      // Create company
      const slug = company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const logo_initials = company.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const { data: companyData, error: companyError } = await supabase
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
        )
        .select()
        .single();

      if (companyError) {
        console.error(`❌ Failed to create ${company.name}:`, companyError.message);
        errors++;
        continue;
      }

      console.log(`✅ ${company.name} (${company.sector})`);
      companiesCreated++;

      // Create jobs for this company
      for (const job of jobs) {
        const { error: jobError } = await supabase
          .from('jobs')
          .insert({
            company_id: companyData.id,
            title: job.title,
            category: job.category,
            tags: job.tags,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: 'EUR',
            work_mode: job.work_mode,
            description: `Join ${company.name} as a ${job.title}. We're looking for talented individuals to help us build the future.`,
            requirements: 'Strong technical skills and passion for innovation.',
            apply_url: `${company.website}/careers`,
            source: 'manual',
            is_featured: job.is_featured || false,
            is_active: true,
            posted_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          });

        if (jobError) {
          console.error(`  ❌ Failed to create job "${job.title}":`, jobError.message);
          errors++;
        } else {
          console.log(`  → ${job.title} (${job.category})`);
          jobsCreated++;
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(`❌ Error processing ${company.name}:`, err.message);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   • Companies: ${companiesCreated}`);
  console.log(`   • Jobs: ${jobsCreated}`);
  console.log(`   • Errors: ${errors}`);

  // Verify
  const { count: companyCount } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`\n✨ Database now has:`);
  console.log(`   • ${companyCount} active companies`);
  console.log(`   • ${jobCount} active jobs`);
}

seedWithJobs()
  .then(() => {
    console.log('\n🎉 Seed complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Seed failed:', err);
    process.exit(1);
  });

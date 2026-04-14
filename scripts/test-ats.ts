/**
 * Test ATS scrapers individually
 * Usage: npx tsx scripts/test-ats.ts [ats] [slug]
 * Examples:
 *   npx tsx scripts/test-ats.ts greenhouse dataiku
 *   npx tsx scripts/test-ats.ts lever qonto
 *   npx tsx scripts/test-ats.ts ashby mistral
 */

import { PARIS_COMPANIES, verifySlug, type ATS } from '../lib/scrapers/registry.js';
import { scrapeGreenhouse } from '../lib/scrapers/greenhouse.js';
import { scrapeLever } from '../lib/scrapers/lever.js';
import { scrapeAshby } from '../lib/scrapers/ashby.js';

const [,, atsArg, slugArg] = process.argv;

async function testSingleCompany(ats: ATS, slug: string) {
  console.log(`\n🧪 Testing ${ats.toUpperCase()} scraper with slug: ${slug}\n`);

  // Find company in registry
  const company = PARIS_COMPANIES.find(
    c => c.ats === ats && c.ats_slug === slug
  );

  if (!company) {
    console.log(`⚠️  Company not in registry. Creating test config...\n`);
  }

  const testCompany = company || {
    name: slug,
    ats,
    ats_slug: slug,
    db_slug: slug,
    sector: 'Test',
  };

  // Verify slug works
  console.log('1️⃣  Verifying API endpoint...');
  const isValid = await verifySlug(ats, slug);
  
  if (!isValid) {
    console.error(`❌ Slug "${slug}" doesn't work for ${ats}`);
    console.log(`\nTry verifying manually:`);
    const urls = {
      greenhouse: `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      lever: `https://api.lever.co/v0/postings/${slug}?mode=json`,
      ashby: `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    };
    console.log(`  ${urls[ats]}\n`);
    process.exit(1);
  }
  
  console.log(`✅ Slug is valid!\n`);

  // Scrape jobs
  console.log('2️⃣  Fetching jobs...');
  let jobs;
  
  try {
    if (ats === 'greenhouse') {
      jobs = await scrapeGreenhouse(testCompany);
    } else if (ats === 'lever') {
      jobs = await scrapeLever(testCompany);
    } else if (ats === 'ashby') {
      jobs = await scrapeAshby(testCompany);
    }
  } catch (err: any) {
    console.error(`❌ Scraping failed:`, err.message);
    process.exit(1);
  }

  console.log(`✅ Found ${jobs?.length || 0} Paris jobs\n`);

  if (!jobs || jobs.length === 0) {
    console.log('ℹ️  No jobs found. This could mean:');
    console.log('  • Company has no open positions');
    console.log('  • All positions are outside Paris');
    console.log('  • Paris filtering is too strict\n');
    process.exit(0);
  }

  // Show sample jobs
  console.log('3️⃣  Sample jobs:\n');
  jobs.slice(0, 3).forEach((job, i) => {
    console.log(`${i + 1}. ${job.title}`);
    console.log(`   Category: ${job.category}`);
    console.log(`   Work mode: ${job.work_mode}`);
    console.log(`   Tags: ${job.tags.join(', ')}`);
    if (job.salary_min || job.salary_max) {
      console.log(`   Salary: €${job.salary_min || '?'} - €${job.salary_max || '?'}`);
    }
    console.log(`   Apply: ${job.apply_url}`);
    console.log('');
  });

  // Show structure
  console.log('4️⃣  Full job structure (first job):\n');
  console.log(JSON.stringify(jobs[0], null, 2));
  console.log('\n✨ Test complete!\n');
}

async function testAllCompanies() {
  console.log('\n🧪 Testing all companies in registry...\n');

  for (const company of PARIS_COMPANIES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${company.name} (${company.ats})`);
    console.log('='.repeat(60));

    try {
      let jobs;
      if (company.ats === 'greenhouse') {
        jobs = await scrapeGreenhouse(company);
      } else if (company.ats === 'lever') {
        jobs = await scrapeLever(company);
      } else if (company.ats === 'ashby') {
        jobs = await scrapeAshby(company);
      }

      console.log(`✅ ${company.name}: ${jobs?.length || 0} Paris jobs`);
      
      if (jobs && jobs.length > 0) {
        console.log(`   Sample: ${jobs[0].title}`);
      }
    } catch (err: any) {
      console.error(`❌ ${company.name}: ${err.message}`);
    }

    // Polite delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n✨ All tests complete!\n');
}

// Main
if (!atsArg) {
  testAllCompanies();
} else if (!slugArg) {
  console.error('Usage: npx tsx scripts/test-ats.ts [ats] [slug]');
  console.error('Example: npx tsx scripts/test-ats.ts greenhouse dataiku');
  console.error('\nOr run without arguments to test all companies in registry.');
  process.exit(1);
} else {
  const validATS = ['greenhouse', 'lever', 'ashby'];
  if (!validATS.includes(atsArg)) {
    console.error(`Invalid ATS. Must be one of: ${validATS.join(', ')}`);
    process.exit(1);
  }
  testSingleCompany(atsArg as ATS, slugArg);
}

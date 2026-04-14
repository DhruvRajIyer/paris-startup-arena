/**
 * Test WTTJ API connection - no database required
 * Run: npx tsx scripts/test-wttj.ts
 */

const WTTJ_BASE = 'https://www.welcometothejungle.com/api/v1';

async function testWTTJ() {
  console.log('🧪 Testing Welcome to the Jungle API...\n');

  try {
    const params = new URLSearchParams({
      page: '1',
      per_page: '10',
      'query': 'Paris',
      'refinementList[offices.city][]': 'Paris',
    });

    console.log('📡 Fetching from:', `${WTTJ_BASE}/jobs?${params}\n`);

    const res = await fetch(`${WTTJ_BASE}/jobs?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const jobs = data.jobs || [];

    console.log(`✅ Success! Found ${jobs.length} jobs\n`);

    if (jobs.length > 0) {
      console.log('📋 Sample jobs:\n');
      jobs.slice(0, 5).forEach((job: any, i: number) => {
        console.log(`${i + 1}. ${job.name}`);
        console.log(`   Company: ${job.company?.name || 'N/A'}`);
        console.log(`   Location: ${job.office?.city || 'N/A'}`);
        console.log(`   Department: ${job.department?.name || 'N/A'}`);
        console.log('');
      });

      console.log('\n📊 API Response Structure:');
      const sampleJob = jobs[0];
      console.log('Available fields:', Object.keys(sampleJob).join(', '));
      console.log('\nCompany fields:', Object.keys(sampleJob.company || {}).join(', '));
    } else {
      console.log('⚠️  No jobs found. API might have changed or rate limit hit.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testWTTJ();

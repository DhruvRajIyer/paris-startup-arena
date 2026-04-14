/**
 * Test Supabase connection
 * Run: npx tsx scripts/test-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  console.log('📋 Configuration:');
  console.log(`   URL: ${url || '❌ NOT SET'}`);
  console.log(`   Key: ${key ? '✅ SET (' + key.slice(0, 20) + '...)' : '❌ NOT SET'}\n`);

  if (!url || !key) {
    console.error('❌ Missing Supabase credentials in .env file!\n');
    console.log('Required variables:');
    console.log('  - VITE_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)\n');
    console.log('See SETUP_FIX.md for instructions.');
    process.exit(1);
  }

  try {
    const supabase = createClient(url, key);

    console.log('🔌 Attempting connection...');
    
    // Test 1: Check if we can query
    const { data, error } = await supabase
      .from('companies')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('\n❌ Connection failed!');
      console.error('Error:', error.message);
      console.error('\nPossible causes:');
      console.error('  1. Supabase project doesn\'t exist');
      console.error('  2. Wrong URL in .env');
      console.error('  3. Schema not applied (tables don\'t exist)');
      console.error('\nSee SETUP_FIX.md for fix instructions.');
      process.exit(1);
    }

    console.log('✅ Connection successful!\n');

    // Test 2: Check tables exist
    console.log('📊 Checking tables...');
    const tables = ['companies', 'jobs', 'waitlist', 'scrape_log'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        console.log(`   ❌ ${table} - NOT FOUND`);
      } else {
        console.log(`   ✅ ${table}`);
      }
    }

    // Test 3: Count data
    console.log('\n📈 Data summary:');
    const { count: companyCount } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true });
    
    const { count: jobCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true });

    console.log(`   Companies: ${companyCount || 0}`);
    console.log(`   Jobs: ${jobCount || 0}`);

    if (companyCount === 0) {
      console.log('\n💡 Tip: Run "npm run seed:full" to add sample data');
    }

    console.log('\n🎉 All checks passed!');
    console.log('Your Supabase connection is working correctly.\n');

  } catch (err: any) {
    console.error('\n❌ Unexpected error:', err.message);
    console.error('\nFull error:', err);
    console.error('\nSee SETUP_FIX.md for troubleshooting.');
    process.exit(1);
  }
}

testConnection();

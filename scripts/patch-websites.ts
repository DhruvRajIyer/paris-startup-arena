import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const websites = [
  { slug: 'doctolib',  website: 'https://doctolib.com' },
  { slug: 'photoroom', website: 'https://photoroom.com' },
  { slug: 'qonto',     website: 'https://qonto.com' },
  { slug: 'dataiku',   website: 'https://dataiku.com' },
];

async function main() {
  for (const { slug, website } of websites) {
    const { error } = await supabase
      .from('companies')
      .update({ website })
      .eq('slug', slug);

    if (error) {
      console.error(`❌ ${slug}:`, error.message);
    } else {
      console.log(`✅ Updated ${slug} → ${website}`);
    }
  }
}

main();

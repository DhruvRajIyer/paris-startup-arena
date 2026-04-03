import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchGreenhouseJobs() {
  // Mock Greenhouse API call
  console.log("Fetching from Greenhouse...");
  return [
    {
      external_id: "gh-1",
      title: "Fullstack Developer",
      company_name: "Alan",
      category: "eng",
      work_mode: "hybrid",
      salary_min: 65000,
      salary_max: 95000,
      tags: ["Node.js", "React", "PostgreSQL"],
      description: "Build the future of health insurance.",
      apply_url: "https://boards.greenhouse.io/alan/jobs/1",
      is_featured: true
    }
  ];
}

async function fetchLeverJobs() {
  // Mock Lever API call
  console.log("Fetching from Lever...");
  return [
    {
      external_id: "lv-1",
      title: "Growth Lead",
      company_name: "Back Market",
      category: "growth",
      work_mode: "onsite",
      salary_min: 70000,
      salary_max: 110000,
      tags: ["Marketing", "Data", "Strategy"],
      description: "Scale the leading refurbished electronics marketplace.",
      apply_url: "https://jobs.lever.co/backmarket/1",
      is_featured: false
    }
  ];
}

async function ingest() {
  console.log("Starting job ingestion pipeline...");
  
  try {
    const ghJobs = await fetchGreenhouseJobs();
    const lvJobs = await fetchLeverJobs();
    
    const allJobs = [...ghJobs, ...lvJobs];
    
    console.log(`Normalizing ${allJobs.length} jobs...`);
    
    // In a real app, you would upsert into Supabase here
    /*
    for (const job of allJobs) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('name', job.company_name)
        .single();
        
      if (company) {
        await supabase.from('jobs').upsert({
          external_id: job.external_id,
          company_id: company.id,
          title: job.title,
          category: job.category,
          work_mode: job.work_mode,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          tags: job.tags,
          description: job.description,
          apply_url: job.apply_url,
          is_featured: job.is_featured,
          posted_at: new Date().toISOString()
        }, { onConflict: 'external_id' });
      }
    }
    */
    
    console.log("Ingestion complete!");
  } catch (error) {
    console.error("Ingestion failed:", error);
  }
}

ingest();

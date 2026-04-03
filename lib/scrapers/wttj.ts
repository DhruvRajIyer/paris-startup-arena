/**
 * Welcome to the Jungle (WTTJ) scraper
 * Public API for Paris startup jobs
 */

import { extractTagsFromTitle, mapCategory, detectWorkMode, addDays } from '../utils/tags.js';

const WTTJ_BASE = 'https://www.welcometothejungle.com/api/v1';

interface WTTJJob {
  id: number;
  name: string;
  slug: string;
  description?: string;
  profile?: string;
  department?: { name: string };
  contract_type?: { en: string };
  office?: { name: string; city: string };
  remote?: string;
  salary_min?: number;
  salary_max?: number;
  published_at: string;
  company: {
    id: number;
    name: string;
    slug: string;
  };
}

export async function fetchWTTJJobs(page = 1): Promise<WTTJJob[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: '100',
    'query': 'Paris',
    'refinementList[offices.city][]': 'Paris',
  });

  try {
    const res = await fetch(`${WTTJ_BASE}/jobs?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      console.error(`WTTJ API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.jobs ?? [];
  } catch (error) {
    console.error('WTTJ fetch error:', error);
    return [];
  }
}

export async function fetchAllWTTJPages(): Promise<WTTJJob[]> {
  const allJobs: WTTJJob[] = [];
  let page = 1;
  
  while (page <= 5) { // Limit to 5 pages (500 jobs max)
    console.log(`Fetching WTTJ page ${page}...`);
    const batch = await fetchWTTJJobs(page);
    
    if (!batch.length) break;
    
    allJobs.push(...batch);
    
    if (batch.length < 100) break; // Last page
    page++;
  }
  
  console.log(`✅ Fetched ${allJobs.length} jobs from WTTJ`);
  return allJobs;
}

export function normalizeWTTJJob(job: WTTJJob, companyId?: string) {
  const isParis = job.office?.city?.toLowerCase().includes('paris');
  if (!isParis) return null;

  const description = job.description || job.profile || '';
  
  return {
    company_id: companyId,
    company_name: job.company.name,
    company_slug: job.company.slug,
    title: job.name,
    category: mapCategory(job.department?.name),
    tags: extractTagsFromTitle(job.name, description),
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    work_mode: detectWorkMode(job.name, job.remote || ''),
    description: description.slice(0, 2000),
    requirements: null,
    apply_url: `https://www.welcometothejungle.com/en/companies/${job.company.slug}/jobs/${job.slug}`,
    source: 'wttj',
    source_id: String(job.id),
    posted_at: new Date(job.published_at),
    expires_at: addDays(job.published_at, 60),
  };
}

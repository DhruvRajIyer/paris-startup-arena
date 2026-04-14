/**
 * Greenhouse ATS Scraper
 * Public API: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
 */

import { extractTagsFromTitle, mapCategory, detectWorkMode, stripHtml, addDays } from '../utils/tags.js';
import type { CompanyConfig } from './registry.js';

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  content?: string;
  departments?: { name: string }[];
  offices?: { location?: string }[];
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export interface JobInsert {
  company_db_slug: string;
  title: string;
  category: string;
  tags: string[];
  salary_min: number | null;
  salary_max: number | null;
  work_mode: string;
  description: string;
  requirements: string | null;
  apply_url: string;
  source: string;
  source_id: string;
  posted_at: string;
  expires_at: string;
}

export async function scrapeGreenhouse(company: CompanyConfig): Promise<JobInsert[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.ats_slug}/jobs?content=true`;

  let data: GreenhouseResponse;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Greenhouse ${company.name}: HTTP ${res.status}`);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.warn(`Greenhouse ${company.name}: fetch failed`, err);
    return [];
  }

  const jobs: JobInsert[] = [];

  for (const job of data.jobs ?? []) {
    // Filter to Paris only — check location string
    const loc = (job.location?.name ?? '').toLowerCase();
    const isParis = 
      loc.includes('paris') || 
      loc.includes('france') || 
      loc.includes('fr') ||
      loc === '' || 
      loc.includes('remote');
    
    if (!isParis) continue;

    const description = stripHtml(job.content ?? '');
    const dept = job.departments?.[0]?.name ?? '';

    jobs.push({
      company_db_slug: company.db_slug,
      title: job.title,
      category: mapCategory(dept),
      tags: extractTagsFromTitle(job.title, description),
      salary_min: null, // Greenhouse doesn't expose salary in public API
      salary_max: null,
      work_mode: detectWorkMode(job.title, description),
      description: description.slice(0, 3000),
      requirements: null,
      apply_url: job.absolute_url,
      source: 'greenhouse',
      source_id: String(job.id),
      posted_at: new Date(job.updated_at).toISOString(),
      expires_at: addDays(new Date(), 45).toISOString(),
    });
  }

  return jobs;
}

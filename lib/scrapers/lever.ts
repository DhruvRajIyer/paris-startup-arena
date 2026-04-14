/**
 * Lever ATS Scraper
 * Public API: https://api.lever.co/v0/postings/{slug}?mode=json
 */

import { extractTagsFromTitle, mapCategory, stripHtml, addDays } from '../utils/tags.js';
import type { CompanyConfig } from './registry.js';
import type { JobInsert } from './greenhouse.js';

interface LeverPosting {
  id: string;
  text: string; // job title
  categories: {
    department?: string;
    team?: string;
    location?: string;
    commitment?: string; // 'Full-time' | 'Part-time'
  };
  description: string; // HTML
  descriptionPlain?: string;
  additional?: string; // requirements HTML
  additionalPlain?: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number; // unix ms
  workplaceType?: string; // 'onsite' | 'remote' | 'hybrid'
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export async function scrapeLever(company: CompanyConfig): Promise<JobInsert[]> {
  // mode=json returns structured JSON instead of HTML page
  const url = `https://api.lever.co/v0/postings/${company.ats_slug}?mode=json&limit=100`;

  let postings: LeverPosting[];
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Lever ${company.name}: HTTP ${res.status}`);
      return [];
    }
    postings = await res.json();
  } catch (err) {
    console.warn(`Lever ${company.name}: fetch failed`, err);
    return [];
  }

  const jobs: JobInsert[] = [];

  for (const p of postings ?? []) {
    // Filter to Paris / France
    const loc = (p.categories?.location ?? '').toLowerCase();
    const isParis = 
      !loc || 
      loc.includes('paris') || 
      loc.includes('france') || 
      loc.includes('fr') ||
      loc.includes('remote');
    
    if (!isParis) continue;

    const description = p.descriptionPlain || stripHtml(p.description ?? '');
    const requirements = p.additionalPlain || stripHtml(p.additional ?? '');

    jobs.push({
      company_db_slug: company.db_slug,
      title: p.text,
      category: mapCategory(p.categories?.department ?? p.categories?.team ?? ''),
      tags: extractTagsFromTitle(p.text, description),
      salary_min: p.salaryRange?.min ?? null,
      salary_max: p.salaryRange?.max ?? null,
      work_mode: mapLeverWorkplace(p.workplaceType),
      description: description.slice(0, 3000),
      requirements: requirements.slice(0, 2000),
      apply_url: p.applyUrl || p.hostedUrl,
      source: 'lever',
      source_id: p.id,
      posted_at: new Date(p.createdAt).toISOString(),
      expires_at: addDays(new Date(), 45).toISOString(),
    });
  }

  return jobs;
}

function mapLeverWorkplace(type?: string): string {
  if (!type) return 'onsite';
  if (type === 'remote') return 'remote';
  if (type === 'hybrid') return 'hybrid';
  return 'onsite';
}

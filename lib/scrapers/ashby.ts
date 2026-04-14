/**
 * Ashby ATS Scraper
 * Public API: https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true
 */

import { extractTagsFromTitle, mapCategory, stripHtml, addDays } from '../utils/tags.js';
import type { CompanyConfig } from './registry.js';
import type { JobInsert } from './greenhouse.js';

interface AshbyJob {
  id: string;
  title: string;
  isListed: boolean;
  isRemote: boolean;
  workplaceType?: string; // 'Remote' | 'OnSite' | 'Hybrid'
  location: string;
  secondaryLocations?: { location: string }[];
  department?: string;
  team?: string;
  descriptionHtml: string;
  descriptionPlain?: string;
  publishedAt: string;
  jobUrl: string;
  applyUrl: string;
  compensation?: {
    compensationTierSummary?: string;
    scrapeableCompensationSalarySummary?: string; // "$60K – $80K"
    compensationTiers?: {
      tierSummary?: string;
      salaryMin?: number;
      salaryMax?: number;
      currency?: string;
    }[];
  };
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export async function scrapeAshby(company: CompanyConfig): Promise<JobInsert[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${company.ats_slug}?includeCompensation=true`;

  let data: AshbyResponse;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Ashby ${company.name}: HTTP ${res.status}`);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.warn(`Ashby ${company.name}: fetch failed`, err);
    return [];
  }

  const jobs: JobInsert[] = [];

  for (const job of data.jobs ?? []) {
    // Skip unlisted / draft jobs
    if (!job.isListed) continue;

    // Filter to Paris / France
    const allLocations = [
      job.location, 
      ...(job.secondaryLocations?.map(l => l.location) ?? [])
    ];
    const isParis = allLocations.some(loc => {
      const l = (loc ?? '').toLowerCase();
      return !l || 
        l.includes('paris') || 
        l.includes('france') || 
        l.includes('fr') ||
        l.includes('remote');
    });
    
    if (!isParis) continue;

    // Parse salary from Ashby's summary string
    const { salary_min, salary_max } = parseAshbySalary(job.compensation);

    const description = job.descriptionPlain || stripHtml(job.descriptionHtml ?? '');

    jobs.push({
      company_db_slug: company.db_slug,
      title: job.title,
      category: mapCategory(job.department ?? job.team ?? ''),
      tags: extractTagsFromTitle(job.title, description),
      salary_min,
      salary_max,
      work_mode: mapAshbyWorkplace(job.workplaceType, job.isRemote),
      description: description.slice(0, 3000),
      requirements: null,
      apply_url: job.applyUrl || job.jobUrl,
      source: 'ashby',
      source_id: job.id,
      posted_at: new Date(job.publishedAt).toISOString(),
      expires_at: addDays(new Date(), 45).toISOString(),
    });
  }

  return jobs;
}

function mapAshbyWorkplace(type?: string, isRemote?: boolean): string {
  if (isRemote || type === 'Remote') return 'remote';
  if (type === 'Hybrid') return 'hybrid';
  return 'onsite';
}

function parseAshbySalary(comp?: AshbyJob['compensation']): { 
  salary_min: number | null; 
  salary_max: number | null;
} {
  if (!comp) return { salary_min: null, salary_max: null };

  // Try structured tiers first
  const tier = comp.compensationTiers?.[0];
  if (tier?.salaryMin) {
    return { 
      salary_min: tier.salaryMin, 
      salary_max: tier.salaryMax ?? null 
    };
  }

  // Fall back to parsing the summary string "€60K – €80K" or "$60K - $80K"
  const summary = comp.scrapeableCompensationSalarySummary ?? comp.compensationTierSummary ?? '';
  const numbers = summary.match(/[\d,]+K?/g)?.map(n => {
    const val = parseFloat(n.replace(',', ''));
    return n.includes('K') ? val * 1000 : val;
  }) ?? [];

  return {
    salary_min: numbers[0] ?? null,
    salary_max: numbers[1] ?? null,
  };
}

/**
 * Company Registry - Maps Paris startups to their ATS platforms
 * 
 * How to verify a slug before adding:
 * - Greenhouse: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
 * - Lever: https://api.lever.co/v0/postings/{slug}?mode=json
 * - Ashby: https://api.ashbyhq.com/posting-api/job-board/{slug}
 */

export type ATS = 'greenhouse' | 'lever' | 'ashby';

export interface CompanyConfig {
  name: string;
  ats: ATS;
  ats_slug: string;      // Slug used in the ATS URL
  db_slug: string;       // Slug in your companies table
  sector: string;
}

export const PARIS_COMPANIES: CompanyConfig[] = [
  // ── GREENHOUSE companies ──────────────────────────────────────────
  // Verify at: https://boards.greenhouse.io/{slug}
  { 
    name: 'Dataiku', 
    ats: 'greenhouse', 
    ats_slug: 'dataiku', 
    db_slug: 'dataiku', 
    sector: 'DeepTech' 
  },
  { 
    name: 'Doctolib', 
    ats: 'greenhouse', 
    ats_slug: 'doctolib', 
    db_slug: 'doctolib', 
    sector: 'HealthTech' 
  },

  // ── LEVER companies ──────────────────────────────────────────────
  // Verify at: https://jobs.lever.co/{slug}
  { 
    name: 'Qonto', 
    ats: 'lever', 
    ats_slug: 'qonto', 
    db_slug: 'qonto', 
    sector: 'FinTech' 
  },
  // Note: Alan slug needs verification - currently returns 404
  // { 
  //   name: 'Alan', 
  //   ats: 'lever', 
  //   ats_slug: 'alan', 
  //   db_slug: 'alan', 
  //   sector: 'HealthTech' 
  // },

  // ── ASHBY companies ──────────────────────────────────────────────
  // Verify at: https://jobs.ashbyhq.com/{slug}
  // Note: Mistral AI slug needs verification - currently returns 404
  // { 
  //   name: 'Mistral AI', 
  //   ats: 'ashby', 
  //   ats_slug: 'mistral', 
  //   db_slug: 'mistral-ai', 
  //   sector: 'DeepTech' 
  // },
  { 
    name: 'Photoroom', 
    ats: 'ashby', 
    ats_slug: 'photoroom', 
    db_slug: 'photoroom', 
    sector: 'DeepTech' 
  },
];

/**
 * Helper to verify an ATS slug works before adding to registry
 */
export async function verifySlug(ats: ATS, slug: string): Promise<boolean> {
  const urls = {
    greenhouse: `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
    lever: `https://api.lever.co/v0/postings/${slug}?mode=json`,
    ashby: `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
  };

  try {
    const res = await fetch(urls[ats]);
    return res.ok;
  } catch {
    return false;
  }
}

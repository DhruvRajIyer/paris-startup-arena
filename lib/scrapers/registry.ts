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
  website?: string;      // Company website for logo fetching
}

export const PARIS_COMPANIES: CompanyConfig[] = [
  // ── GREENHOUSE companies ──────────────────────────────────────────
  {
    name: 'Dataiku',
    ats: 'greenhouse',
    ats_slug: 'dataiku',
    db_slug: 'dataiku',
    sector: 'DeepTech',
    website: 'https://dataiku.com'
  },
  {
    name: 'Doctolib',
    ats: 'greenhouse',
    ats_slug: 'doctolib',
    db_slug: 'doctolib',
    sector: 'HealthTech',
    website: 'https://doctolib.com'
  },
  {
    name: 'Alan',
    ats: 'ashby',
    ats_slug: 'alan',
    db_slug: 'alan',
    sector: 'HealthTech',
    website: 'https://alan.com'
  },
  {
    name: 'Ledger',
    ats: 'greenhouse',
    ats_slug: 'ledgerhq',
    db_slug: 'ledger',
    sector: 'DeepTech',
    website: 'https://ledger.com'
  },
  {
    name: 'Contentsquare',
    ats: 'lever',
    ats_slug: 'contentsquare',
    db_slug: 'contentsquare',
    sector: 'SaaS',
    website: 'https://contentsquare.com'
  },
  {
    name: 'Spendesk',
    ats: 'lever',
    ats_slug: 'spendesk',
    db_slug: 'spendesk',
    sector: 'FinTech',
    website: 'https://spendesk.com'
  },
  {
    name: 'Aircall',
    ats: 'lever',
    ats_slug: 'aircall',
    db_slug: 'aircall',
    sector: 'SaaS',
    website: 'https://aircall.io'
  },
  {
    name: 'Algolia',
    ats: 'greenhouse',
    ats_slug: 'algolia',
    db_slug: 'algolia',
    sector: 'DeepTech',
    website: 'https://algolia.com'
  },
  {
    name: 'Exotec',
    ats: 'ashby',
    ats_slug: 'exotec',
    db_slug: 'exotec',
    sector: 'DeepTech',
    website: 'https://exotec.com'
  },

  // ── LEVER companies ──────────────────────────────────────────────
  {
    name: 'Qonto',
    ats: 'lever',
    ats_slug: 'qonto',
    db_slug: 'qonto',
    sector: 'FinTech',
    website: 'https://qonto.com'
  },
  {
    name: 'BlaBlaCar',
    ats: 'lever',
    ats_slug: 'blablacar',
    db_slug: 'blablacar',
    sector: 'MarketPlace',
    website: 'https://blablacar.com'
  },
  {
    name: 'Pennylane',
    ats: 'lever',
    ats_slug: 'pennylane',
    db_slug: 'pennylane',
    sector: 'FinTech',
    website: 'https://pennylane.com'
  },
  {
    name: 'Back Market',
    ats: 'ashby',
    ats_slug: 'backmarket',
    db_slug: 'back-market',
    sector: 'CleanTech',
    website: 'https://backmarket.fr'
  },
  {
    name: 'Swile',
    ats: 'lever',
    ats_slug: 'swile',
    db_slug: 'swile',
    sector: 'HRTech',
    website: 'https://swile.co'
  },
  {
    name: 'PayFit',
    ats: 'ashby',
    ats_slug: 'payfit',
    db_slug: 'payfit',
    sector: 'HRTech',
    website: 'https://payfit.com'
  },
  {
    name: 'Dashlane',
    ats: 'greenhouse',
    ats_slug: 'dashlane',
    db_slug: 'dashlane',
    sector: 'DeepTech',
    website: 'https://dashlane.com'
  },

  // ── ASHBY companies ──────────────────────────────────────────────
  {
    name: 'Photoroom',
    ats: 'ashby',
    ats_slug: 'photoroom',
    db_slug: 'photoroom',
    sector: 'DeepTech',
    website: 'https://photoroom.com'
  },
  {
    name: 'Mistral AI',
    ats: 'lever',
    ats_slug: 'mistral',
    db_slug: 'mistral-ai',
    sector: 'DeepTech',
    website: 'https://mistral.ai'
  },
  {
    name: 'Pigment',
    ats: 'ashby',
    ats_slug: 'pigmenthq',
    db_slug: 'pigment',
    sector: 'SaaS',
    website: 'https://pigment.com'
  },
  {
    name: 'Lempire',
    ats: 'lever',
    ats_slug: 'lempire',
    db_slug: 'lempire',
    sector: 'SaaS',
    website: 'https://lempire.com'
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

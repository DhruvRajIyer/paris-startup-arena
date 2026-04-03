/**
 * Vercel Serverless API Handler
 * This file adapts the Express server to work with Vercel's serverless functions
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/companies
app.get('/api/companies', async (req, res) => {
  try {
    const { sector, arrond } = req.query;

    let query = supabase
      .from('companies')
      .select(`
        id, name, slug, sector, logo_initials, logo_url,
        lat, lng, arrondissement, funding_stage,
        employee_count, description, website
      `)
      .eq('is_active', true);

    if (sector) query = query.eq('sector', sector);
    if (arrond) query = query.eq('arrondissement', Number(arrond));

    const { data: companies, error: companiesError } = await query;

    if (companiesError) throw companiesError;

    // Get job counts for each company
    const companiesWithCounts = await Promise.all(
      (companies || []).map(async (company) => {
        const { count } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('is_active', true);

        return { ...company, open_roles_count: count || 0 };
      })
    );

    const activeCompanies = companiesWithCounts
      .filter(c => c.open_roles_count > 0)
      .sort((a, b) => b.open_roles_count - a.open_roles_count);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.json({
      companies: activeCompanies,
      count: activeCompanies.length,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const { company_id, category, work_mode, featured, limit = '50', offset = '0' } = req.query;

    let query = supabase
      .from('jobs')
      .select(`
        id, title, category, tags, salary_min, salary_max,
        salary_currency, work_mode, description, requirements,
        apply_url, is_featured, posted_at, expires_at,
        companies (
          id, name, slug, sector, logo_initials, logo_url,
          lat, lng, arrondissement, funding_stage
        )
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('posted_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (company_id) query = query.eq('company_id', company_id);
    if (category) query = query.eq('category', category);
    if (work_mode) query = query.eq('work_mode', work_mode);
    if (featured === 'true') query = query.eq('is_featured', true);

    const { data, error } = await query;

    if (error) throw error;

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.json({
      jobs: data || [],
      total: data?.length || 0,
      offset: Number(offset),
      limit: Number(limit),
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/waitlist
app.post('/api/waitlist', async (req, res) => {
  try {
    const { email, type = 'notify' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const { error } = await supabase
      .from('waitlist')
      .upsert(
        { email: email.toLowerCase().trim(), type },
        { onConflict: 'email' }
      );

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const [companiesResult, jobsResult] = await Promise.all([
      supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
    ]);

    const { data: companiesWithJobs } = await supabase
      .from('jobs')
      .select('company_id')
      .eq('is_active', true);

    const uniqueCompanies = new Set(companiesWithJobs?.map(j => j.company_id) || []);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.json({
      companies: uniqueCompanies.size,
      roles: jobsResult.count || 0,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cron/sync - Protected endpoint for GitHub Actions
app.post('/api/cron/sync', async (req, res) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ 
    message: 'Sync endpoint - use GitHub Actions to trigger sync script directly',
    note: 'Vercel serverless functions have 10s timeout, sync runs via GitHub Actions'
  });
});

// Export for Vercel
export default app;

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  );

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // GET /api/companies - Returns all active companies with open role counts
  app.get("/api/companies", async (req, res) => {
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

      // Filter to only companies with open roles and sort
      const activeCompanies = companiesWithCounts
        .filter(c => c.open_roles_count > 0)
        .sort((a, b) => b.open_roles_count - a.open_roles_count);

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        companies: activeCompanies,
        count: activeCompanies.length,
        generated_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/jobs - Returns all active jobs with company data
  app.get("/api/jobs", async (req, res) => {
    try {
      const { company_id, category, work_mode, featured, limit = '50', offset = '0' } = req.query;

      let query = supabase
        .from('jobs')
        .select(`
          id, title, category, tags, salary_min, salary_max,
          salary_currency, work_mode, description, requirements,
          apply_url, source, source_id, is_featured, posted_at, expires_at,
          companies (
            id, name, slug, sector, logo_initials, logo_url,
            lat, lng, arrondissement, funding_stage, website
          )
        `)
        .in('source', ['greenhouse', 'lever', 'ashby'])
        .eq('is_active', true)
        .in('source', ['greenhouse', 'lever', 'ashby'])
        .order('is_featured', { ascending: false })
        .order('posted_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (company_id) query = query.eq('company_id', company_id);
      if (category) query = query.eq('category', category);
      if (work_mode) query = query.eq('work_mode', work_mode);
      if (featured === 'true') query = query.eq('is_featured', true);

      const { data, error, count } = await query;

      if (error) throw error;

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        jobs: data || [],
        total: count || 0,
        offset: Number(offset),
        limit: Number(limit),
        generated_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/waitlist - Add email to waitlist
  app.post("/api/waitlist", async (req, res) => {
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
    } catch (error: any) {
      console.error('Error adding to waitlist:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/stats - Summary statistics
  app.get("/api/stats", async (req, res) => {
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

      // Get companies with open roles
      const { data: companiesWithJobs } = await supabase
        .from('jobs')
        .select('company_id')
        .eq('is_active', true);

      const uniqueCompanies = new Set(companiesWithJobs?.map(j => j.company_id) || []);

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        companies: uniqueCompanies.size,
        roles: jobsResult.count || 0,
        updated_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/cron/sync - Trigger daily sync (protected)
  app.post("/api/cron/sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      console.log('Triggering daily sync...');
      // Import and run sync function
      const { runDailySync } = await import('./scripts/sync.js');
      await runDailySync();
      res.json({ success: true, message: 'Sync completed' });
    } catch (error: any) {
      console.error('Sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/cron/expire - Expire stale jobs (protected)
  app.post("/api/cron/expire", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { data, error } = await supabase.rpc('expire_stale_jobs');
      if (error) throw error;
      res.json({ success: true, message: 'Expired stale jobs' });
    } catch (error: any) {
      console.error('Expire error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

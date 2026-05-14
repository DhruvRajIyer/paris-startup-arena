import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { Hero } from "./components/Hero";
import { FilterShelf, FilterState } from "./components/FilterShelf";
import { MapView } from "./components/MapView";
import { CustomCursor } from "./components/CustomCursor";
import { JobDrawer } from "./components/JobDrawer";
import { CompanyPage } from "./components/CompanyPage";
import { Job } from "./types";
import { supabase } from "./lib/supabase";

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [liveStats, setLiveStats] = useState<{ roles: number; companies: number } | null>(null);

  // Filters — read initial state from URL params
  const initFilters = (): FilterState => {
    const p = new URLSearchParams(window.location.search);
    return {
      category: p.get('category') || 'All',
      workMode: p.get('work_mode') || '',
      contractType: p.get('contract_type') || '',
      experienceLevel: p.get('experience_level') || '',
      salaryMin: p.get('salary_min') || '',
      salaryMax: p.get('salary_max') || '',
      savedOnly: p.get('saved') === '1',
    };
  };
  const [filters, setFilters] = useState<FilterState>(initFilters);

  // Saved jobs — localStorage
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('psa_saved_jobs');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  // Drawer + Company page
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsFilterSticky(y > window.innerHeight - 100);
      setIsScrolled(y > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('jobs').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setSupabaseConnected(true);
      } catch (err) {
        console.error("Supabase connection check failed:", err);
        setSupabaseConnected(false);
      }
    };
    checkConnection();

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.roles !== undefined) {
          setLiveStats({ roles: data.roles, companies: data.companies });
        }
      })
      .catch(() => {});

    fetch("/api/jobs")
      .then(res => res.json())
      .then(data => {
        const jobsData = data.jobs || data;
        const transformedJobs = jobsData.map((job: any) => ({
          ...job,
          company: job.companies || job.company
        }));
        setJobs(transformedJobs);
      })
      .catch(err => console.error('Error fetching jobs:', err));
  }, []);

  // Sync filters → URL params
  useEffect(() => {
    const p = new URLSearchParams();
    if (filters.category !== 'All') p.set('category', filters.category);
    if (filters.workMode) p.set('work_mode', filters.workMode);
    if (filters.contractType) p.set('contract_type', filters.contractType);
    if (filters.experienceLevel) p.set('experience_level', filters.experienceLevel);
    if (filters.salaryMin) p.set('salary_min', filters.salaryMin);
    if (filters.salaryMax) p.set('salary_max', filters.salaryMax);
    if (filters.savedOnly) p.set('saved', '1');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [filters]);

  // Persist saved jobs to localStorage
  useEffect(() => {
    try { localStorage.setItem('psa_saved_jobs', JSON.stringify([...savedJobs])); } catch {}
  }, [savedJobs]);

  const handleToggleSave = useCallback((jobId: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  }, []);

  const handleFilterChange = useCallback((patch: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  }, []);

  // Client-side filtering (work_mode, salary done client-side; contract_type/experience_level also done client-side since we load all jobs)
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.category !== 'All' && job.category !== filters.category) return false;
      if (filters.workMode && job.work_mode !== filters.workMode) return false;
      if (filters.contractType && job.contract_type !== filters.contractType) return false;
      if (filters.experienceLevel && job.experience_level !== filters.experienceLevel) return false;
      if (filters.salaryMin && job.salary_min != null && job.salary_min < Number(filters.salaryMin) * 1000) return false;
      if (filters.salaryMax && job.salary_max != null && job.salary_max > Number(filters.salaryMax) * 1000) return false;
      if (filters.savedOnly && !savedJobs.has(job.id)) return false;
      return true;
    });
  }, [jobs, filters, savedJobs]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistStatus('loading');
    try {
      const { error } = await supabase.from('waitlist').insert({ email: waitlistEmail, type: 'notify' });
      if (error) throw error;
      setWaitlistStatus('success');
    } catch {
      setWaitlistStatus('error');
    }
  };

  const navLinks = [
    { label: 'Discover', href: '#discover' },
    { label: 'Map', href: '#map' },
    { label: 'Waitlist', href: '#waitlist' },
  ];

  return (
    <div className="bg-surface min-h-screen selection:bg-primary/30 selection:text-primary font-body text-on-surface">
      <CustomCursor />

      {supabaseConnected === false && (
        <div className="fixed top-4 z-[9999] left-1/2 -translate-x-1/2 glass px-4 py-2 flex items-center gap-2 text-[10px] font-label uppercase tracking-widest bg-red-900/20 text-red-200">
          <span className="w-2 h-2 rounded-full pulse-gold bg-red-400"></span>
          Supabase not configured. Using mock data.
        </div>
      )}

      {/* Nav */}
      <motion.nav
        className={`fixed top-0 w-full z-50 grid grid-cols-3 items-center px-4 md:px-8 py-5 transition-all duration-500 ${
          isScrolled
            ? 'bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 py-4'
            : 'bg-transparent backdrop-blur-sm border-b border-outline-variant/10'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-xl font-light tracking-widest text-on-surface font-headline uppercase">Paris Startup Arena</span>
        </motion.div>

        {/* Desktop links — col 2, truly centred */}
        <motion.div
          className="hidden md:flex gap-10 items-center justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {navLinks.map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="text-on-surface-variant hover:text-on-surface transition-colors duration-300 font-label text-[11px] uppercase tracking-[0.18em]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              {item.label}
            </motion.a>
          ))}
        </motion.div>

        <div className="flex items-center gap-4 justify-end">
          <motion.button
            className={`bg-primary text-surface font-label text-[10px] px-6 py-2 uppercase tracking-widest hover:bg-on-surface transition-all duration-300 ${!isScrolled ? 'ring-1 ring-primary/50' : ''}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
          >
            Post a Job
          </motion.button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-5 h-px bg-on-surface"
              animate={mobileMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-px bg-on-surface"
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-px bg-on-surface"
              animate={mobileMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed top-[64px] inset-x-0 z-40 bg-surface/98 backdrop-blur-md border-b border-outline-variant/30 flex flex-col items-center gap-6 py-8 md:hidden"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {navLinks.map(item => (
              <a
                key={item.label}
                href={item.href}
                className="font-label text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Hero jobCount={liveStats?.roles ?? 0} companyCount={liveStats?.companies ?? 0} />

      {/* Job Detail Drawer */}
      <JobDrawer
        job={drawerJob}
        onClose={() => setDrawerJob(null)}
        savedJobs={savedJobs}
        onToggleSave={handleToggleSave}
      />

      {/* Company Profile Page */}
      {companySlug && (
        <CompanyPage
          slug={companySlug}
          onClose={() => setCompanySlug(null)}
          onJobClick={job => { setCompanySlug(null); setTimeout(() => setDrawerJob(job), 50); }}
          savedJobs={savedJobs}
          onToggleSave={handleToggleSave}
        />
      )}

      <main className="relative z-10 bg-surface">
        <div id="discover">
          <FilterShelf
            filters={filters}
            onFilterChange={handleFilterChange}
            isSticky={isFilterSticky}
            filteredCount={filteredJobs.length}
            savedCount={savedJobs.size}
          />
        </div>

        <div id="map">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <MapView
              jobs={filteredJobs}
              onClearFilters={() => setFilters(f => ({ ...f, category: 'All', workMode: '', contractType: '', experienceLevel: '', salaryMin: '', salaryMax: '', savedOnly: false }))}
              onJobClick={setDrawerJob}
              savedJobs={savedJobs}
              onToggleSave={handleToggleSave}
              onCompanyClick={setCompanySlug}
            />
          </motion.div>
        </div>

        {/* Waitlist */}
        <section id="waitlist" className="bg-surface relative overflow-hidden pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-8 text-center mb-16">
            <motion.h2
              className="text-6xl md:text-8xl font-headline text-on-surface mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              STAY <span className="italic text-primary">In The</span> ARENA
            </motion.h2>

            <motion.div
              className="w-16 h-px bg-primary/40 mx-auto my-8"
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            />

            <motion.p
              className="font-headline italic text-2xl text-on-surface mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            >
              Receive curated roles directly in your inbox before they are published.
            </motion.p>

            <AnimatePresence mode="wait">
              {waitlistStatus === 'success' ? (
                <motion.div
                  key="success"
                  className="flex flex-col items-center gap-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">check</span>
                  </div>
                  <p className="font-label text-[11px] uppercase tracking-[0.25em] text-primary">You're on the list</p>
                  <p className="font-headline italic text-on-surface text-xl">We'll be in touch soon.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto"
                  onSubmit={handleWaitlistSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                >
                  <label htmlFor="waitlist-email" className="sr-only">Email address</label>
                  <motion.input
                    id="waitlist-email"
                    className="flex-1 h-[52px] bg-surface-container-low border border-outline-variant px-6 font-label text-[11px] uppercase tracking-widest focus:ring-1 focus:ring-primary focus:border-primary text-on-surface outline-none disabled:opacity-50 placeholder:text-on-surface-variant/60"
                    placeholder="YOUR EMAIL ADDRESS"
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    disabled={waitlistStatus === 'loading'}
                    required
                    whileFocus={{ scale: 1.02, transition: { duration: 0.2 } }}
                  />
                  <motion.button
                    type="submit"
                    className="h-[52px] w-full md:w-auto bg-primary text-surface px-10 font-label text-[11px] uppercase tracking-widest hover:bg-on-surface transition-colors cursor-pointer disabled:opacity-60"
                    disabled={waitlistStatus === 'loading'}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {waitlistStatus === 'loading' ? 'Joining…' : 'Join Waitlist'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
            {waitlistStatus === 'error' && (
              <p className="mt-4 font-label text-[11px] uppercase tracking-widest text-red-400">Something went wrong — please try again.</p>
            )}
          </div>
        </section>

        <motion.footer
          className="w-full flex flex-col items-center justify-center gap-6 px-8 py-12 border-t border-[#1C1A14] bg-[#060604]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-xl font-light tracking-widest text-[#E8DFC8] font-headline uppercase">PARIS STARTUP ARENA</span>
          </motion.div>
          <motion.div
            className="flex flex-wrap justify-center gap-8 mb-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {['Privacy', 'Terms', 'Manifesto', 'API'].map((link, i) => (
              <motion.a
                key={link}
                className="text-[#6A5C48] hover:text-[#E8DFC8] transition-colors font-label text-[11px] uppercase tracking-widest"
                href="#"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                {link}
              </motion.a>
            ))}
          </motion.div>
          <motion.div
            className="text-[#6A5C48] font-label text-[11px] uppercase tracking-[0.2em] flex flex-col gap-2 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div>MADE IN PARIS • © 2025 THE DIGITAL CURATOR. ALL RIGHTS RESERVED.</div>
            <div className="text-[10px] text-[#6A5C48]">
              <a
                href="https://logo.dev"
                title="Logo API"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Logos provided by Logo.dev
              </a>
            </div>
          </motion.div>
        </motion.footer>
      </main>
    </div>
  );
}

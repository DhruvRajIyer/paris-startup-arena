import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Company, Job } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface CompanyPageProps {
  slug: string;
  onClose: () => void;
  onJobClick: (job: Job) => void;
  savedJobs: Set<string>;
  onToggleSave: (jobId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  eng: 'Engineering', product: 'Product', design: 'Design',
  growth: 'Growth', data: 'Data', ops: 'Operations',
};

const CONTRACT_LABELS: Record<string, string> = {
  cdi: 'CDI', cdd: 'CDD', stage: 'Stage', alternance: 'Alternance', freelance: 'Freelance',
};

const SECTOR_COLORS: Record<string, string> = {
  DeepTech: '#60A5FA', HealthTech: '#34D399', FinTech: '#FBBF24',
  CleanTech: '#10B981', HRTech: '#A78BFA', FoodTech: '#F97316', Other: '#9CA3AF',
};

export function CompanyPage({ slug, onClose, onJobClick, savedJobs, onToggleSave }: CompanyPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/companies/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setCompany(data.company);
        setJobs((data.jobs || []).map((j: any) => ({ ...j, company: data.company })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const sectorColor = company ? (SECTOR_COLORS[company.sector] ?? '#9CA3AF') : '#9CA3AF';

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Full-screen panel */}
        <motion.div
          className="fixed inset-y-0 right-0 z-[61] w-full max-w-2xl bg-surface border-l border-outline-variant flex flex-col shadow-2xl overflow-y-auto"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Close */}
          <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-tertiary hover:text-on-surface transition-colors font-label text-[10px] uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </button>
            <button onClick={onClose} className="p-1 text-tertiary hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="font-label text-[10px] uppercase tracking-widest text-tertiary">Loading…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="font-label text-[11px] uppercase tracking-widest text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && company && (
            <>
              {/* Hero */}
              <div className="px-8 pt-8 pb-6 border-b border-outline-variant/30">
                <div className="flex items-start gap-5">
                  <CompanyLogo company={company} size={72} isHovered={false} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: sectorColor }} />
                      <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {company.sector}
                      </span>
                      {company.funding_stage && (
                        <span className="font-label text-[9px] tracking-widest border border-outline-variant px-2 py-0.5 text-tertiary uppercase">
                          {company.funding_stage}
                        </span>
                      )}
                    </div>
                    <h1 className="font-headline text-4xl text-on-surface">{company.name}</h1>
                    {company.arrondissement && (
                      <p className="font-label text-[10px] uppercase tracking-widest text-tertiary mt-1">
                        Paris {company.arrondissement}
                      </p>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest text-primary/70 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    )}
                  </div>
                </div>

                {(company as any).description && (
                  <p className="mt-5 font-body text-sm text-on-surface-variant leading-relaxed">
                    {(company as any).description}
                  </p>
                )}
              </div>

              {/* Open roles */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-headline italic text-primary text-xl">{jobs.length}</span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-tertiary">
                    {jobs.length === 1 ? 'Open Role' : 'Open Roles'}
                  </span>
                </div>

                <div className="space-y-3">
                  {jobs.map(job => {
                    const isSaved = savedJobs.has(job.id);
                    return (
                      <motion.div
                        key={job.id}
                        className="group border border-outline-variant border-l-4 border-l-transparent hover:border-l-primary hover:border-primary/30 bg-surface-container-low hover:bg-surface p-4 cursor-pointer transition-all duration-200"
                        whileHover={{ x: 2 }}
                        onClick={() => onJobClick(job)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
                                {CATEGORY_LABELS[job.category] ?? job.category}
                              </span>
                              {job.is_featured && (
                                <span className="font-label text-[8px] bg-primary text-surface px-1.5 py-0.5 uppercase tracking-wider">Featured</span>
                              )}
                            </div>
                            <h3 className="font-headline text-lg text-on-surface leading-tight">{job.title}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="font-label text-[9px] uppercase tracking-widest border border-outline-variant px-2 py-0.5 text-tertiary">
                                {job.work_mode}
                              </span>
                              {job.contract_type && (
                                <span className="font-label text-[9px] uppercase tracking-widest border border-primary/30 px-2 py-0.5 text-primary/80">
                                  {CONTRACT_LABELS[job.contract_type] ?? job.contract_type}
                                </span>
                              )}
                              {job.salary_min && job.salary_max && (
                                <span className="font-label text-[9px] uppercase tracking-widest border border-outline-variant px-2 py-0.5 text-tertiary">
                                  €{job.salary_min}k–{job.salary_max}k
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); onToggleSave(job.id); }}
                              className={`p-1.5 transition-colors ${isSaved ? 'text-primary' : 'text-tertiary/50 hover:text-tertiary'}`}
                            >
                              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                            </button>
                            <span className="font-label text-[9px] uppercase tracking-wider text-primary/60 group-hover:text-primary transition-colors">
                              View →
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface JobDrawerProps {
  job: Job | null;
  onClose: () => void;
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

const EXP_LABELS: Record<string, string> = {
  intern: 'Intern', junior: 'Junior', mid: 'Mid-level', senior: 'Senior',
};

const SECTOR_COLORS: Record<string, string> = {
  DeepTech: '#60A5FA', HealthTech: '#34D399', FinTech: '#FBBF24',
  CleanTech: '#10B981', HRTech: '#A78BFA', FoodTech: '#F97316', Other: '#9CA3AF',
};

export function JobDrawer({ job, onClose, savedJobs, onToggleSave }: JobDrawerProps) {
  const isSaved = job ? savedJobs.has(job.id) : false;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (job) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [job]);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  return (
    <AnimatePresence>
      {job && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Drawer — bottom sheet on mobile, right panel on desktop */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[92vh] rounded-t-2xl md:rounded-none md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:w-full md:max-w-xl bg-surface md:border-l border-outline-variant flex flex-col shadow-2xl"
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Drag handle on mobile */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-outline-variant/60" />
            </div>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-outline-variant/40">
              <div className="flex items-start gap-4 min-w-0">
                {job.company && (
                  <div className="flex-shrink-0 mt-1">
                    <CompanyLogo company={job.company} size={56} isHovered={false} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: SECTOR_COLORS[job.company?.sector ?? 'Other'] ?? '#9CA3AF' }}
                    />
                    <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {CATEGORY_LABELS[job.category] ?? job.category}
                    </span>
                    {job.is_featured && (
                      <span className="font-label text-[9px] tracking-[0.2em] bg-primary text-surface px-2 py-0.5 uppercase">
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="font-headline text-2xl text-on-surface leading-tight">
                    {job.title}
                  </h2>
                  <p className="font-headline italic text-primary text-lg leading-none mt-1">
                    {job.company?.name}
                  </p>
                  {job.company?.arrondissement && (
                    <p className="font-label text-[9px] uppercase tracking-widest text-tertiary mt-0.5">
                      Paris {job.company.arrondissement} · {job.company.sector}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => onToggleSave(job.id)}
                  className={`p-2 transition-colors duration-200 ${isSaved ? 'text-primary' : 'text-tertiary hover:text-on-surface'}`}
                  aria-label={isSaved ? 'Unsave job' : 'Save job'}
                  title={isSaved ? 'Saved' : 'Save role'}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-tertiary hover:text-on-surface transition-colors duration-200"
                  aria-label="Close drawer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Badges row */}
            <div className="px-6 py-3 border-b border-outline-variant/30 flex flex-wrap gap-2">
              <span className="font-label text-[10px] uppercase tracking-widest border border-outline-variant px-2.5 py-1 text-tertiary">
                {job.work_mode}
              </span>
              {job.contract_type && (
                <span className="font-label text-[10px] uppercase tracking-widest border border-primary/40 px-2.5 py-1 text-primary/90">
                  {CONTRACT_LABELS[job.contract_type] ?? job.contract_type}
                </span>
              )}
              {job.experience_level && (
                <span className="font-label text-[10px] uppercase tracking-widest border border-outline-variant px-2.5 py-1 text-on-surface-variant">
                  {EXP_LABELS[job.experience_level] ?? job.experience_level}
                </span>
              )}
              {job.salary_min && job.salary_max && (
                <span className="font-label text-[10px] uppercase tracking-widest border border-outline-variant px-2.5 py-1 text-on-surface-variant">
                  €{job.salary_min.toLocaleString()} – €{job.salary_max.toLocaleString()}
                </span>
              )}
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="px-6 py-3 border-b border-outline-variant/30 flex flex-wrap gap-2">
                {job.tags.map(tag => (
                  <span
                    key={tag}
                    className="font-label text-[9px] uppercase tracking-wider border border-primary/25 text-primary/80 px-2.5 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {job.description && (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-3">
                    About the role
                  </p>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              )}

              {job.requirements && (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-3">
                    Requirements
                  </p>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {job.requirements}
                  </p>
                </div>
              )}

              {job.company?.website && (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-3">
                    About {job.company.name}
                  </p>
                  <div className="flex items-center gap-3">
                    {job.company.funding_stage && (
                      <span className="font-label text-[10px] uppercase tracking-widest border border-outline-variant px-2.5 py-1 text-tertiary">
                        {job.company.funding_stage}
                      </span>
                    )}
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-label text-[10px] uppercase tracking-widest text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      {job.company.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-5 border-t border-outline-variant/40 bg-surface">
              {job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-primary text-surface font-label text-[11px] uppercase tracking-widest text-center py-4 hover:bg-on-surface transition-colors duration-300"
                >
                  Apply Directly →
                </a>
              ) : (
                <p className="text-center font-label text-[10px] uppercase tracking-widest text-tertiary py-3">
                  No direct application link available
                </p>
              )}
              <p className="text-center font-label text-[9px] uppercase tracking-widest text-tertiary/50 mt-3">
                You will be taken directly to the company's career page
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

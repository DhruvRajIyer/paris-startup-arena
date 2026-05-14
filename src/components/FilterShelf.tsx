import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface FilterState {
  category: string;
  workMode: string;
  contractType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  savedOnly: boolean;
}

interface FilterShelfProps {
  filters: FilterState;
  onFilterChange: (patch: Partial<FilterState>) => void;
  isSticky?: boolean;
  filteredCount?: number;
  savedCount?: number;
}

const CATEGORIES = [
  { label: 'All', value: 'All' },
  { label: 'Engineering', value: 'eng' },
  { label: 'Product', value: 'product' },
  { label: 'Design', value: 'design' },
  { label: 'Growth', value: 'growth' },
  { label: 'Data', value: 'data' },
  { label: 'Operations', value: 'ops' },
];

const WORK_MODES = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Onsite', value: 'onsite' },
];

const CONTRACT_TYPES = [
  { label: 'CDI', value: 'cdi' },
  { label: 'CDD', value: 'cdd' },
  { label: 'Stage', value: 'stage' },
  { label: 'Alternance', value: 'alternance' },
  { label: 'Freelance', value: 'freelance' },
];

const EXPERIENCE_LEVELS = [
  { label: 'Intern', value: 'intern' },
  { label: 'Junior', value: 'junior' },
  { label: 'Mid', value: 'mid' },
  { label: 'Senior', value: 'senior' },
];

function PillGroup({
  options,
  active,
  onToggle,
}: {
  options: { label: string; value: string }[];
  active: string;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onToggle(active === opt.value ? '' : opt.value)}
          className={`px-3 py-1 font-label text-[10px] tracking-widest uppercase transition-all duration-150 ${
            active === opt.value
              ? 'bg-primary text-surface border border-primary'
              : 'border border-outline-variant/60 text-on-surface/70 hover:border-primary/50 hover:text-on-surface'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function FilterShelf({ filters, onFilterChange, isSticky, filteredCount, savedCount = 0 }: FilterShelfProps) {
  const [expanded, setExpanded] = useState(false);

  const extraFilterCount = [
    filters.workMode, filters.contractType, filters.experienceLevel,
    filters.salaryMin, filters.salaryMax, filters.savedOnly ? 'saved' : '',
  ].filter(Boolean).length;

  return (
    <motion.div
      className={`glass border-x-0 z-40 ${isSticky ? 'sticky top-0 border-t border-b border-outline-variant/40' : 'relative'}`}
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Row 1: category pills + count + more-filters */}
      <div className="px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-headline italic text-primary text-xl shrink-0 hidden md:block">The Curator</span>

          <div className="flex overflow-x-auto md:flex-wrap md:justify-center gap-2 w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat.value}
                onClick={() => onFilterChange({ category: cat.value })}
                className={`px-5 py-2 font-label text-[11px] tracking-widest uppercase transition-colors duration-200 ${
                  filters.category === cat.value
                    ? 'bg-primary text-surface border border-primary'
                    : 'border border-outline-variant/60 text-on-surface/70 hover:border-primary/50 hover:text-on-surface'
                }`}
                whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {cat.label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
            {filteredCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <motion.span
                  key={filteredCount}
                  className="font-headline italic text-primary text-xl leading-none"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredCount}
                </motion.span>
                <span className="font-label text-[11px] text-tertiary tracking-widest uppercase">
                  {filteredCount === 1 ? 'role' : 'roles'}
                </span>
              </div>
            )}

            <button
              onClick={() => setExpanded(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-label text-[10px] uppercase tracking-widest transition-all duration-200 border ${
                expanded || extraFilterCount > 0
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'border-outline-variant/60 text-on-surface/70 hover:border-primary/40 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xs">tune</span>
              Filters
              {extraFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-surface text-[8px] flex items-center justify-center font-bold">
                  {extraFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: expanded filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="border-t border-outline-variant/30 bg-surface/60 px-4 md:px-8 py-5"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Work Mode */}
              <div>
                <p className="font-label text-[9px] uppercase tracking-[0.25em] text-primary mb-2">Work Mode</p>
                <PillGroup
                  options={WORK_MODES}
                  active={filters.workMode}
                  onToggle={v => onFilterChange({ workMode: v })}
                />
              </div>

              {/* Contract Type */}
              <div>
                <p className="font-label text-[9px] uppercase tracking-[0.25em] text-primary mb-2">Contract</p>
                <PillGroup
                  options={CONTRACT_TYPES}
                  active={filters.contractType}
                  onToggle={v => onFilterChange({ contractType: v })}
                />
              </div>

              {/* Experience */}
              <div>
                <p className="font-label text-[9px] uppercase tracking-[0.25em] text-primary mb-2">Experience</p>
                <PillGroup
                  options={EXPERIENCE_LEVELS}
                  active={filters.experienceLevel}
                  onToggle={v => onFilterChange({ experienceLevel: v })}
                />
              </div>

              {/* Salary + Saved */}
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-label text-[9px] uppercase tracking-[0.25em] text-primary mb-2">Salary (€k)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.salaryMin}
                      onChange={e => onFilterChange({ salaryMin: e.target.value })}
                      className="w-20 bg-surface-container-low border border-outline-variant/60 px-2 py-1 font-label text-[10px] text-on-surface focus:outline-none focus:border-primary placeholder:text-tertiary/60"
                      min={0}
                    />
                    <span className="font-label text-[9px] text-tertiary">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.salaryMax}
                      onChange={e => onFilterChange({ salaryMax: e.target.value })}
                      className="w-20 bg-surface-container-low border border-outline-variant/60 px-2 py-1 font-label text-[10px] text-on-surface focus:outline-none focus:border-primary placeholder:text-tertiary/60"
                      min={0}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onFilterChange({ savedOnly: !filters.savedOnly })}
                  className={`flex items-center gap-2 px-3 py-1.5 font-label text-[10px] uppercase tracking-widest border transition-colors duration-150 w-fit ${
                    filters.savedOnly
                      ? 'bg-primary/10 border-primary/50 text-primary'
                      : 'border-outline-variant/60 text-on-surface/70 hover:border-primary/40'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: filters.savedOnly ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                  Saved {savedCount > 0 && `(${savedCount})`}
                </button>
              </div>
            </div>

            {/* Reset row */}
            {extraFilterCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => onFilterChange({
                    workMode: '', contractType: '', experienceLevel: '',
                    salaryMin: '', salaryMax: '', savedOnly: false,
                  })}
                  className="font-label text-[9px] uppercase tracking-widest text-tertiary hover:text-on-surface transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  Clear filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

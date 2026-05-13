import { useState, useMemo, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import { CompanyLogo } from './CompanyLogo';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
  onClearFilters?: () => void;
  savedJobs?: Set<string>;
  onToggleSave?: (jobId: string) => void;
  onCompanyClick?: (slug: string) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const PARIS_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
  zoom: 11
};

const ARRONDISSEMENTS = [
  { number: 1, name: 'Louvre', center: [2.3414, 48.8606] },
  { number: 2, name: 'Bourse', center: [2.3419, 48.8686] },
  { number: 3, name: 'Temple', center: [2.3631, 48.8634] },
  { number: 4, name: 'Hôtel-de-Ville', center: [2.3522, 48.8566] },
  { number: 5, name: 'Panthéon', center: [2.3486, 48.8462] },
  { number: 6, name: 'Luxembourg', center: [2.3319, 48.8503] },
  { number: 7, name: 'Palais-Bourbon', center: [2.3147, 48.8567] },
  { number: 8, name: 'Élysée', center: [2.3117, 48.8736] },
  { number: 9, name: 'Opéra', center: [2.3386, 48.8750] },
  { number: 10, name: 'Entrepôt', center: [2.3631, 48.8761] },
  { number: 11, name: 'Popincourt', center: [2.3789, 48.8594] },
  { number: 12, name: 'Reuilly', center: [2.4000, 48.8400] },
  { number: 13, name: 'Gobelins', center: [2.3600, 48.8300] },
  { number: 14, name: 'Observatoire', center: [2.3267, 48.8333] },
  { number: 15, name: 'Vaugirard', center: [2.2944, 48.8400] },
  { number: 16, name: 'Passy', center: [2.2700, 48.8600] },
  { number: 17, name: 'Batignolles-Monceau', center: [2.3100, 48.8850] },
  { number: 18, name: 'Butte-Montmartre', center: [2.3444, 48.8922] },
  { number: 19, name: 'Buttes-Chaumont', center: [2.3828, 48.8839] },
  { number: 20, name: 'Ménilmontant', center: [2.3989, 48.8644] },
];

export function MapView({ jobs, onJobClick, onClearFilters, savedJobs = new Set(), onToggleSave, onCompanyClick }: MapViewProps) {
  const [viewState, setViewState] = useState(PARIS_CENTER);
  const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'featured'>('recent');
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const mapRef = useRef<MapRef>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jobsByDistrict = useMemo(() => {
    const districts: Record<number, Job[]> = {};
    jobs.forEach(job => {
      if (job.company?.arrondissement) {
        const arr = job.company.arrondissement;
        if (!districts[arr]) {
          districts[arr] = [];
        }
        districts[arr].push(job);
      }
    });
    return districts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (selectedDistrict && job.company?.arrondissement !== selectedDistrict) {
        return false;
      }
      if (searchQuery && job.company?.arrondissement) {
        const arr = ARRONDISSEMENTS.find(a => a.number === job.company!.arrondissement);
        const searchLower = searchQuery.toLowerCase();
        return (
          arr?.name.toLowerCase().includes(searchLower) ||
          arr?.number.toString().includes(searchLower) ||
          `paris ${arr?.number}`.includes(searchLower)
        );
      }
      return true;
    });
  }, [jobs, selectedDistrict, searchQuery]);

  const jobsByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    filteredJobs.forEach(job => {
      const id = job.company?.id;
      if (id) map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [filteredJobs]);

  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortMode === 'featured') {
      list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    } else {
      list.sort((a, b) => new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime());
    }
    return list;
  }, [filteredJobs, sortMode]);

  const handleDistrictClick = useCallback((districtNumber: number) => {
    const district = ARRONDISSEMENTS.find(a => a.number === districtNumber);
    if (district) {
      setSelectedDistrict(districtNumber);
      setViewState({
        latitude: district.center[1],
        longitude: district.center[0],
        zoom: 14
      });
    }
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'eng': return '#60A5FA';
      case 'design': return '#C084FC';
      case 'product': return '#FB923C';
      case 'growth': return '#34D399';
      default: return '#C8A96E';
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="font-headline text-2xl text-primary mb-4">Map Configuration Required</p>
          <p className="font-label text-xs text-tertiary uppercase">Please add VITE_MAPBOX_ACCESS_TOKEN to .env</p>
        </div>
      </div>
    );
  }

  const handleCardHover = useCallback((job: Job | null) => {
    setHoveredJob(job);
  }, []);

  const handleMapMove = useCallback((evt: { viewState: typeof PARIS_CENTER }) => {
    setViewState(evt.viewState);
    if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
    boundsTimerRef.current = setTimeout(() => {
      const map = mapRef.current;
      if (!map) return;
      const bounds = map.getBounds();
      if (!bounds) return;
      const firstVisible = sortedJobsRef.current.find(job => {
        const lat = job.company?.lat;
        const lng = job.company?.lng;
        if (!lat || !lng) return false;
        return bounds.contains([lng, lat]);
      });
      if (firstVisible && !hoveredJobRef.current) {
        const cardEl = cardRefs.current[firstVisible.id];
        if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 200);
  }, []);

  const handlePinClick = useCallback((job: Job) => {
    const cardEl = cardRefs.current[job.id];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHoveredJob(job);
  }, []);

  const sortedJobsRef = useRef(sortedJobs);
  sortedJobsRef.current = sortedJobs;
  const hoveredJobRef = useRef(hoveredJob);
  hoveredJobRef.current = hoveredJob;

  return (
    <div className="relative h-screen w-full flex">
      {/* Map Section - Left Side */}
      <div className="w-3/5 h-full relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={handleMapMove}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
        <NavigationControl position="bottom-right" />

          {filteredJobs.map((job) => {
            if (!job.company?.lat || !job.company?.lng) return null;
            
            const isHovered = hoveredJob?.id === job.id;
            const isPinHovered = hoveredPin === job.id;
            const pinSize = job.is_featured ? 50 : 38;
            const roleCount = jobsByCompany[job.company.id] ?? 1;
            const sectorColors: Record<string, string> = {
              'DeepTech': '#60A5FA', 'HealthTech': '#34D399', 'FinTech': '#FBBF24',
              'CleanTech': '#10B981', 'HRTech': '#A78BFA', 'SaaS': '#C8A96E',
              'MarketPlace': '#F97316', 'Other': '#9CA3AF'
            };
            const dotColor = sectorColors[job.company.sector] || '#9CA3AF';
            
            return (
              <Marker
                key={job.id}
                latitude={job.company.lat}
                longitude={job.company.lng}
                anchor="bottom"
              >
                <div
                  className="relative cursor-pointer"
                  style={{ zIndex: isPinHovered || isHovered ? 50 : 1 }}
                  onMouseEnter={() => setHoveredPin(job.id)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={() => handlePinClick(job)}
                >
                  {/* Tooltip */}
                  <AnimatePresence>
                    {isPinHovered && (
                      <motion.div
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none"
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        style={{ zIndex: 100 }}
                      >
                        <div className="glass px-3 py-2 whitespace-nowrap flex flex-col gap-0.5 min-w-[120px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                            <span className="font-headline text-on-surface text-sm leading-none">{job.company.name}</span>
                          </div>
                          <span className="font-label text-[9px] uppercase tracking-widest text-tertiary pl-3">
                            {roleCount} {roleCount === 1 ? 'open role' : 'open roles'}
                          </span>
                        </div>
                        {/* Caret */}
                        <div className="w-2 h-2 bg-[rgba(14,13,10,0.8)] border-r border-b border-[rgba(200,169,110,0.15)] rotate-45 mx-auto -mt-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    className="relative"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Gold ring pulse when card is hovered but mouse is not on pin */}
                    {isHovered && !isPinHovered && (
                      <span
                        className="absolute inset-0 rounded-xl ring-2 ring-primary/70 animate-ping pointer-events-none"
                        style={{ zIndex: 0 }}
                      />
                    )}
                    <CompanyLogo
                      company={job.company}
                      size={pinSize}
                      isHovered={isPinHovered || isHovered}
                    />
                  </motion.div>
                </div>
              </Marker>
            );
          })}

        </Map>

        {/* Title Overlay */}
        <motion.div 
          className="absolute top-6 left-6 z-10 pointer-events-none glass px-5 py-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-4xl font-headline text-on-surface uppercase tracking-tight max-w-xl leading-none">
            FIND ROLES <span className="italic text-primary">Across</span> PARIS
          </h2>
          <p className="font-label text-[11px] text-tertiary uppercase tracking-widest mt-3">
            <span className="text-primary/80">{filteredJobs.length}</span> Roles
            {' · '}
            <span className="text-on-surface-variant/70">{Object.keys(jobsByCompany).length}</span> Companies
            {' · '}
            <span className="text-on-surface-variant/70">{Object.keys(jobsByDistrict).length}</span> Districts
          </p>
        </motion.div>
      </div>

      {/* Job Cards Panel - Right Side */}
      <motion.div 
        className="w-2/5 h-full bg-surface-container-low border-l border-outline-variant overflow-y-auto"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-surface-container-low border-b border-outline-variant">
          {/* Count + Sort row */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-1.5">
              <motion.span
                key={filteredJobs.length}
                className="font-headline italic text-primary text-lg leading-none"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {filteredJobs.length}
              </motion.span>
              <span className="font-label text-[10px] text-tertiary uppercase tracking-widest">
                {filteredJobs.length === 1 ? 'Role' : 'Roles'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(['recent', 'featured'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`font-label text-[9px] uppercase tracking-widest px-2.5 py-1 transition-colors duration-200 ${
                    sortMode === mode
                      ? 'bg-primary text-surface'
                      : 'text-tertiary hover:text-on-surface border border-outline-variant'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          {/* Search row */}
          <div className="px-4 pb-3">
            <div className="glass flex items-center px-3 py-2.5">
              <span className="material-symbols-outlined text-tertiary text-sm mr-2">search</span>
              <input
                className="bg-transparent border-none text-[11px] font-label uppercase tracking-widest text-on-surface focus:outline-none placeholder:text-tertiary/80 w-full"
                placeholder="Search by Arrondissement..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="ml-2 flex-shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-sm">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedJobs.map((job, index) => {
              const isHovered = hoveredJob?.id === job.id;
              const glowColorClass = job.category === 'eng' ? 'bg-blue-400' : 
                                     job.category === 'design' ? 'bg-purple-400' : 
                                     job.category === 'product' ? 'bg-orange-400' : 
                                     'bg-emerald-400';
              const categoryLabel = job.category === 'eng' ? 'Engineering'
                : job.category === 'ops' ? 'Operations'
                : job.category === 'product' ? 'Product'
                : job.category === 'design' ? 'Design'
                : job.category === 'growth' ? 'Growth'
                : job.category === 'data' ? 'Data'
                : job.category;
              
              return (
                <motion.div
                  key={job.id}
                  ref={(el) => { cardRefs.current[job.id] = el; }}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                  onMouseEnter={() => handleCardHover(job)}
                  onMouseLeave={() => handleCardHover(null)}
                  onClick={() => onJobClick?.(job)}
                >
                  <div 
                    className={`p-5 border-l-4 border border-outline-variant transition-all duration-200 ${
                      isHovered 
                        ? 'bg-surface border-l-primary border-primary/30 shadow-lg shadow-primary/10 -translate-y-0.5' 
                        : job.is_featured 
                          ? 'bg-primary/5 border-l-primary/60 border-primary/20' 
                          : 'bg-surface border-l-transparent hover:border-l-primary/40 hover:border-outline-variant/60'
                    }`}
                  >
                    {/* Top row: category dot + label + featured badge + save */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${glowColorClass} ${isHovered ? 'pulse-gold' : ''}`} />
                        <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                          {categoryLabel}
                        </span>
                        {job.contract_type && (
                          <span className="font-label text-[9px] uppercase tracking-widest border border-primary/30 text-primary/80 px-1.5 py-0.5">
                            {job.contract_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {job.is_featured && (
                          <span className="font-label text-[9px] tracking-[0.2em] bg-primary text-surface px-2 py-0.5 uppercase">Featured</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); onToggleSave?.(job.id); }}
                          className={`p-0.5 transition-colors ${savedJobs.has(job.id) ? 'text-primary' : 'text-tertiary/50 hover:text-tertiary'}`}
                          title={savedJobs.has(job.id) ? 'Saved' : 'Save role'}
                        >
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: savedJobs.has(job.id) ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                        </button>
                      </div>
                    </div>

                    {/* Logo + title block */}
                    <div className="flex items-start gap-3 mb-3">
                      {job.company && (
                        <div className="flex-shrink-0 mt-0.5">
                          <CompanyLogo
                            company={job.company}
                            size={36}
                            isHovered={isHovered}
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className={`${job.is_featured ? 'text-2xl' : 'text-lg'} font-headline text-on-surface leading-tight mb-1`}>
                          {job.title}
                        </h3>
                        <button
                          className={`font-headline italic ${job.is_featured ? 'text-lg' : 'text-base'} text-primary leading-none hover:underline text-left`}
                          onClick={e => { e.stopPropagation(); if (job.company?.slug) onCompanyClick?.(job.company.slug); }}
                        >
                          {job.company?.name || 'Unknown Company'}
                        </button>
                        <p className="font-label text-[9px] text-tertiary uppercase mt-0.5">
                          Paris {job.company?.arrondissement || ''}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {job.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="font-label text-[9px] text-primary/80 border border-primary/25 px-2.5 py-1 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: badges + CTA */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="font-label text-[10px] text-tertiary border border-outline-variant px-2 py-0.5 uppercase">
                          {job.work_mode}
                        </span>
                        {job.salary_min && job.salary_max && (
                          <span className="font-label text-[10px] text-tertiary border border-outline-variant px-2 py-0.5 uppercase">
                            €{job.salary_min}k–{job.salary_max}k
                          </span>
                        )}
                      </div>

                      {/* CTA: open drawer */}
                      <span className={`font-label text-[9px] uppercase tracking-widest px-3 py-1 transition-all duration-200 flex items-center gap-1.5 ${
                        isHovered ? 'bg-primary text-surface' : 'text-primary/60 border border-primary/20'
                      }`}>
                        View →
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredJobs.length === 0 && (
            <motion.div
              className="h-64 flex flex-col items-center justify-center text-on-surface-variant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center p-8 flex flex-col items-center gap-4">
                <p className="font-headline text-2xl uppercase tracking-widest text-primary">No roles found</p>
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary">Try a different filter</p>
                {onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className="mt-2 border border-primary/40 text-primary font-label text-[9px] uppercase tracking-widest px-4 py-2 hover:bg-primary/10 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

    </div>
  );
}

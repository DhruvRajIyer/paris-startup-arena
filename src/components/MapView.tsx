import { useState, useMemo, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const PARIS_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
  zoom: 12
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

export function MapView({ jobs, onJobClick }: MapViewProps) {
  const [viewState, setViewState] = useState(PARIS_CENTER);
  const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<'pins' | 'heatmap'>('pins');
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    if (job?.company?.lat && job?.company?.lng) {
      setViewState({
        latitude: job.company.lat,
        longitude: job.company.lng,
        zoom: 15
      });
    }
  }, []);

  const handlePinClick = useCallback((job: Job) => {
    const cardEl = cardRefs.current[job.id];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHoveredJob(job);
  }, []);

  return (
    <div className="relative h-screen w-full flex">
      {/* Map Section - Left Side */}
      <div className="w-2/3 h-full relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          transitionDuration={800}
        >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

          {filteredJobs.map((job) => {
            if (!job.company?.lat || !job.company?.lng) return null;
            
            const isHovered = hoveredJob?.id === job.id;
            
            return (
              <Marker
                key={job.id}
                latitude={job.company.lat}
                longitude={job.company.lng}
                anchor="bottom"
              >
                <motion.div
                  className="cursor-pointer relative"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: isHovered ? 1.5 : 1, 
                    opacity: 1,
                    zIndex: isHovered ? 50 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handlePinClick(job)}
                >
                  <div 
                    className="relative"
                    style={{
                      width: job.is_featured ? '24px' : '16px',
                      height: job.is_featured ? '24px' : '16px',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(job.category),
                        boxShadow: `0 0 ${isHovered ? '30px' : job.is_featured ? '20px' : '12px'} ${getCategoryColor(job.category)}`,
                        animation: job.is_featured || isHovered ? 'pulse-gold 2s infinite' : 'none'
                      }}
                    />
                    {(job.is_featured || isHovered) && (
                      <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />
                    )}
                  </div>
                </motion.div>
              </Marker>
            );
          })}

        </Map>

        {/* Title Overlay */}
        <motion.div 
          className="absolute top-6 left-6 z-10 pointer-events-none"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-5xl font-headline text-on-surface uppercase tracking-tight max-w-xl leading-none">
            FIND ROLES <span className="italic text-primary">Across</span> PARIS
          </h2>
          <p className="font-label text-[10px] text-tertiary uppercase tracking-widest mt-4">
            {filteredJobs.length} Opportunities • {Object.keys(jobsByDistrict).length} Districts
          </p>
        </motion.div>
      </div>

      {/* Job Cards Panel - Right Side */}
      <motion.div 
        className="w-1/3 h-full bg-surface-container-low border-l border-outline-variant overflow-y-auto"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Search Bar */}
        <div className="sticky top-0 z-20 bg-surface-container-low border-b border-outline-variant p-4">
          <div className="glass flex items-center px-4 py-3">
            <span className="material-symbols-outlined text-tertiary text-sm mr-2">search</span>
            <input
              className="bg-transparent border-none text-[10px] font-label uppercase tracking-widest text-on-surface focus:outline-none placeholder:text-tertiary w-full"
              placeholder="Search by Arrondissement..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="ml-2">
                <span className="material-symbols-outlined text-tertiary text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Job Cards */}
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job, index) => {
              const isHovered = hoveredJob?.id === job.id;
              const glowColorClass = job.category === 'eng' ? 'bg-blue-400' : 
                                     job.category === 'design' ? 'bg-purple-400' : 
                                     job.category === 'product' ? 'bg-orange-400' : 
                                     'bg-emerald-400';
              
              return (
                <motion.div
                  key={job.id}
                  ref={(el) => { cardRefs.current[job.id] = el; }}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onMouseEnter={() => handleCardHover(job)}
                  onMouseLeave={() => handleCardHover(null)}
                  onClick={() => onJobClick?.(job)}
                >
                  <div 
                    className={`bg-surface p-6 border transition-all duration-300 ${
                      isHovered 
                        ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                        : job.is_featured 
                          ? 'border-primary/30' 
                          : 'border-outline-variant hover:border-primary/40'
                    }`}
                  >
                    {job.is_featured && (
                      <div className="flex justify-end mb-2">
                        <span className="font-label text-[9px] tracking-[0.2em] bg-primary text-surface px-3 py-1 uppercase">Featured</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${glowColorClass} shadow-[0_0_8px] ${isHovered ? 'pulse-gold' : ''}`} />
                      <span className="font-label text-[9px] text-on-surface-variant uppercase tracking-widest">
                        {job.category === 'eng' ? 'Engineering' : job.category}
                      </span>
                    </div>
                    
                    <h3 className={`${job.is_featured ? 'text-3xl mb-4' : 'text-xl mb-3'} font-headline text-on-surface`}>
                      {job.title}
                    </h3>
                    
                    <div className="flex flex-col gap-1 mb-4">
                      <p className={`font-headline italic ${job.is_featured ? 'text-xl' : 'text-lg'} text-primary`}>
                        {job.company?.name || 'Unknown Company'}
                      </p>
                      <p className="font-label text-[10px] text-tertiary uppercase">
                        Paris {job.company?.arrondissement || ''}
                      </p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-label text-[9px] text-tertiary border border-outline-variant px-2 py-1 uppercase">
                          {job.work_mode}
                        </span>
                        {job.salary_min && job.salary_max && (
                          <span className="font-label text-[9px] text-tertiary border border-outline-variant px-2 py-1 uppercase">
                            €{job.salary_min}k - €{job.salary_max}k
                          </span>
                        )}
                      </div>
                      <span className="font-label text-[9px] text-tertiary uppercase flex items-center gap-2">
                        {isHovered && <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-gold"></span>}
                        Active
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
              <div className="text-center p-8">
                <p className="font-headline text-2xl uppercase tracking-widest text-primary mb-3">No jobs found</p>
                <p className="font-label text-[10px] uppercase tracking-[0.2em]">Adjust your filters</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

    </div>
  );
}

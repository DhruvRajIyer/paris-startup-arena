import { Job } from "../types";
import { useEffect, useRef } from "react";
import { motion } from 'motion/react';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardClick = () => {
    // If apply_url exists, open it in a new tab
    if (job.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
    // Also trigger the onClick callback if provided
    onClick?.(job);
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = `perspective(1000px) rotateX(2deg) rotateY(-1deg) translateZ(0)`;
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Determine indicator color based on category
  let glowColorClass = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]";
  if (job.category === 'eng') glowColorClass = "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6)]";
  else if (job.category === 'product') glowColorClass = "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]";
  else if (job.category === 'design') glowColorClass = "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]";

  return (
    <motion.div 
      className="group h-full cursor-pointer" 
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 30, rotateX: 5 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.6, 
        ease: [0.34, 1.56, 0.64, 1],
        opacity: { duration: 0.4 }
      }}
    >
      <div 
        ref={cardRef}
        className={`card-3d bg-surface-container-low p-8 relative overflow-hidden h-full flex flex-col ${job.is_featured ? 'card-3d-featured border border-primary/30' : 'border border-outline-variant hover:border-primary/40'}`}
      >
        {job.is_featured && (
          <div className="absolute top-0 right-0 p-6">
            <span className="font-label text-[10px] tracking-[0.2em] bg-primary text-surface px-4 py-1 uppercase shadow-xl">Featured</span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-2.5 h-2.5 rounded-full ${glowColorClass} ${job.is_featured ? 'pulse-gold' : ''}`}></div>
          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
             {job.category === 'eng' ? 'Engineering' : job.category}
          </span>
        </div>
        
        <h3 className={`${job.is_featured ? 'text-5xl mb-6' : 'text-2xl mb-4'} font-headline text-on-surface`}>{job.title}</h3>
        
        <div className={`flex flex-col ${job.is_featured ? 'gap-2 mb-10' : 'gap-1 mb-8'}`}>
          <p className={`font-headline italic ${job.is_featured ? 'text-2xl' : 'text-lg'} text-primary`}>{job.company?.name || 'Unknown Company'}</p>
          <p className="font-label text-xs text-tertiary uppercase">Paris</p>
        </div>

        <div className="mt-auto flex justify-between items-end">
          <div className="flex gap-4">
            <span className="font-label text-[10px] text-tertiary border border-outline-variant px-3 py-1 uppercase">{job.work_mode}</span>
            {job.salary_min && job.salary_max && (
               <span className="font-label text-[10px] text-tertiary border border-outline-variant px-3 py-1 uppercase">€{job.salary_min}k - €{job.salary_max}k</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {job.apply_url && (
              <span className="font-label text-[10px] text-primary uppercase flex items-center gap-1 hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Apply
              </span>
            )}
            <span className="font-label text-[10px] text-tertiary uppercase flex items-center gap-2">
              {job.is_featured && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-gold"></span>}
              Active
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

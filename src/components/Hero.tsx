import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  return (
    <motion.section 
      ref={heroRef}
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden mesh-gradient"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div 
        className="absolute inset-0 z-0 opacity-40" 
        style={{ y, willChange: 'transform' }}
      >
        <img 
          className="w-full h-full object-cover grayscale brightness-50 contrast-125" 
          alt="Isometric wireframe 3D map of Paris at night with golden grid lines" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlDwyAvt8oFfkWgSuN8a2ycCjy9f78fc6672wRC_J0w9oMjadsJ0Gi2CPIeru59FHSOdWiXdDmhw266whNoWkUB3w4-w61W24f7toOixckr28jRi0aR_m16mspdswV4OdRdUsiyBLbPJeVFafmvlyynfmyLi7VrcphMjDcSGkyYTeIjwRGt2eSsF3Vs2vJbNYNieefFom8nvXIa00uUEnpouiqRVzwrmKcShthU89D2pAbRjdb8GLek9nOmZR0xndj_8gQ4zNHiQqb" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface"></div>
      </motion.div>
      
      <motion.div 
        className="relative z-10 text-center flex flex-col items-center max-w-5xl px-6" 
        style={{ opacity }}
      >
        <motion.h1 
          className="text-7xl md:text-9xl font-headline tracking-tight text-on-surface mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          PARIS <span className="italic text-primary font-light">Startup</span> ARENA
        </motion.h1>
        <motion.div 
          className="flex flex-wrap justify-center gap-12 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        >
          {[{ label: '247 Open Roles' }, { label: '83 Startups' }, { label: 'Daily Refresh' }].map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: 'backOut' }}
            >
              <span className="font-label text-xs tracking-[0.2em] text-tertiary uppercase">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: 'easeOut' }}
      >
        <span className="font-label text-[9px] uppercase tracking-[0.3em] text-tertiary mb-2">Scroll to Observe</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-primary/0 via-primary to-primary/0 animate-bob"></div>
        <span className="material-symbols-outlined text-primary">expand_more</span>
      </motion.div>
      <motion.div 
        className="absolute bottom-0 w-full py-4 border-t border-outline-variant/30 flex justify-center items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <div className="w-2 h-2 rounded-full bg-primary pulse-gold"></div>
        <span className="font-label text-[9px] uppercase tracking-[0.3em] text-on-surface-variant">Live Intelligence Feed Active</span>
      </motion.div>
    </motion.section>
  );
}

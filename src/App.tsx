import { useState, useEffect } from "react";
import { motion } from 'motion/react';
import { Hero } from "./components/Hero";
import { FilterShelf } from "./components/FilterShelf";
import { MapView } from "./components/MapView";
import { CustomCursor } from "./components/CustomCursor";
import { Job } from "./types";
import { supabase } from "./lib/supabase";

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsFilterSticky(window.scrollY > window.innerHeight - 100);
    };
    window.addEventListener("scroll", handleScroll);
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

    // Fetch jobs from our mock API
    fetch("/api/jobs")
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setFilteredJobs(data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (activeCategory === "All") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((job) => job.category === activeCategory));
    }
  }, [activeCategory, jobs]);

  return (
    <div className="bg-surface min-h-screen selection:bg-primary/30 selection:text-primary font-body text-on-surface">
      <CustomCursor />

      {supabaseConnected === false && (
        <div className="fixed top-4 z-[9999] left-1/2 -translate-x-1/2 glass px-4 py-2 flex items-center gap-2 text-[10px] font-label uppercase tracking-widest bg-red-900/20 text-red-200">
          <span className="w-2 h-2 rounded-full pulse-gold bg-red-400"></span>
          Supabase not configured. Using mock data.
        </div>
      )}

      <motion.nav 
        className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-transparent backdrop-blur-md border-b border-outline-variant/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-xl font-light tracking-widest text-[#E8DFC8] font-headline uppercase">PARIS STARTUP ARENA</span>
        </motion.div>
        <motion.div 
          className="hidden md:flex gap-10 items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {['Discover', 'Sectors', 'Map', 'Waitlist'].map((item, i) => (
            <motion.a 
              key={item}
              className={`${item === 'Discover' ? 'text-[#C8A96E] border-b border-[#C8A96E]/30 pb-1' : 'text-[#9A9282] hover:text-[#E8DFC8]'} transition-colors duration-300 font-label text-[10px] uppercase tracking-[0.12em]`}
              href="#"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              {item}
            </motion.a>
          ))}
        </motion.div>
        <motion.button 
          className="bg-primary text-surface font-label text-[10px] px-6 py-2 uppercase tracking-widest hover:bg-on-surface transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.95 }}
        >
          Post a Job
        </motion.button>
      </motion.nav>

      <Hero />

      <main className="relative z-10 bg-surface">
        <FilterShelf 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory}
          isSticky={isFilterSticky}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <MapView jobs={filteredJobs} />
        </motion.div>
        
        <section className="bg-surface relative overflow-hidden pt-32 pb-32">
          <div className="max-w-4xl mx-auto px-8 text-center mb-32">
            <motion.h2 
              className="text-6xl md:text-8xl font-headline text-on-surface mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              STAY <span className="italic text-primary">In The</span> ARENA
            </motion.h2>
            <motion.p 
              className="font-headline italic text-2xl text-on-surface-variant mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            >
              Receive curated roles directly in your inbox before they are published.
            </motion.p>
            <motion.form 
              className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto" 
              onSubmit={(e) => e.preventDefault()}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            >
              <motion.input 
                className="flex-1 bg-surface-container-low border border-outline-variant px-6 py-4 font-label text-[10px] uppercase tracking-widest focus:ring-1 focus:ring-primary focus:border-primary text-on-surface outline-none" 
                placeholder="YOUR EMAIL ADDRESS" 
                type="email"
                whileFocus={{ scale: 1.02, transition: { duration: 0.2 } }}
              />
              <motion.button 
                className="bg-primary text-surface px-10 py-4 font-label text-[10px] uppercase tracking-widest hover:bg-on-surface transition-colors cursor-pointer"
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95 }}
              >
                Join Waitlist
              </motion.button>
            </motion.form>
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
                className="text-[#4A4030] hover:text-[#E8DFC8] transition-colors font-label text-[10px] uppercase tracking-widest" 
                href="#"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                whileHover={{ y: -2, color: '#E8DFC8', transition: { duration: 0.2 } }}
              >
                {link}
              </motion.a>
            ))}
          </motion.div>
          <motion.div 
            className="text-[#4A4030] font-label text-[10px] uppercase tracking-[0.2em]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            MADE IN PARIS • © 2025 THE DIGITAL CURATOR. ALL RIGHTS RESERVED.
          </motion.div>
        </motion.footer>
      </main>
    </div>
  );
}

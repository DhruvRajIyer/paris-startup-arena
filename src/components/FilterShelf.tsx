import { motion } from 'motion/react';

interface FilterShelfProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isSticky?: boolean;
}

export function FilterShelf({ activeCategory, onCategoryChange, isSticky }: FilterShelfProps) {
  const categories = ["All", "Engineering", "Design", "Product", "DeepTech", "HealthTech", "FinTech", "SaaS", "AI / ML"];

  // Normalize active logic, handling shorthand 'eng' vs 'Engineering'
  const displayToValue = (display: string) => {
    if (display === "Engineering") return "eng";
    if (display === "Design") return "design";
    if (display === "Product") return "product";
    if (display === "All") return "All";
    return display; // The rest might map exactly to the category
  };

  const isActive = (display: string) => activeCategory === displayToValue(display);

  return (
    <motion.div 
      className={`py-4 px-8 glass border-x-0 z-40 ${isSticky ? 'sticky top-0' : 'relative'}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="font-headline italic text-primary text-xl">The Curator</span>
        </motion.div>
        <motion.div 
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              onClick={() => onCategoryChange(displayToValue(cat))}
              className={`px-4 py-1.5 font-label text-[10px] tracking-widest uppercase ${
                isActive(cat)
                  ? "bg-primary text-surface border border-primary"
                  : "border border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
              layout
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>
        <motion.div 
          className="flex items-center gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className="font-label text-[10px] text-tertiary tracking-widest uppercase">Showing Results</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

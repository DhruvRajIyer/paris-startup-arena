import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'motion/react';
import { useRef, useEffect, useState } from 'react';

const FRAME_COUNT = 192;
const framePath = (i: number) =>
  `/hero-frames/frame_${String(i).padStart(3, '0')}.webp`;

interface HeroProps {
  jobCount?: number;
  companyCount?: number;
}

export function Hero({ jobCount = 247, companyCount = 83 }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(0);
  const reduceMotion = useReducedMotion();

  // Scroll progress spans the entire tall hero section (220vh).
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Spring-smooth the raw scroll so frames ease into place instead of snapping.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.6,
    restDelta: 0.0005,
  });

  // Title copy fades out within the first third of scroll, never fighting the dissolve.
  const titleOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.5], ['0%', '-30%']);

  // The frame canvas breathes in at start, holds, and gently recedes into section B.
  const canvasScale = useTransform(smoothProgress, [0, 0.4, 1], [0.94, 1, 1.03]);
  const canvasOpacity = useTransform(
    smoothProgress,
    [0, 0.08, 0.9, 1],
    [0.6, 1, 1, 0.8]
  );
  // Whole section lifts slightly at the end to blend into what's below.
  const containerY = useTransform(smoothProgress, [0.85, 1], ['0%', '-5%']);

  // Mouse-driven 3D parallax — springs smooth the motion.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [8, -8]),
    { stiffness: 80, damping: 22, mass: 0.6 }
  );
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [-6, 6]),
    { stiffness: 80, damping: 22, mass: 0.6 }
  );
  const translateZ = useSpring(0, { stiffness: 60, damping: 18 });

  // Preload every frame so scroll scrubbing never flickers.
  useEffect(() => {
    let cancelled = false;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = framePath(i);
      const done = () => {
        if (!cancelled) setLoaded((n) => n + 1);
      };
      img.onload = done;
      img.onerror = done;
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Smoothed scroll → frame index scrubbing via rAF-throttled updates.
  useEffect(() => {
    let raf = 0;
    let pending = -1;

    const apply = () => {
      raf = 0;
      if (pending < 0) return;
      const img = imgRef.current;
      if (!img) return;
      const src = framePath(pending + 1);
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    };

    const unsub = smoothProgress.on('change', (p) => {
      const idx = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(p * (FRAME_COUNT - 1)))
      );
      if (idx === pending) return;
      pending = idx;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    return () => {
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [smoothProgress]);

  // Mouse tracking for the 3D parallax tilt.
  useEffect(() => {
    if (reduceMotion) return;
    const handle = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    const leave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };
    window.addEventListener('mousemove', handle);
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', handle);
      window.removeEventListener('mouseleave', leave);
    };
  }, [mouseX, mouseY, reduceMotion]);

  // Scroll-linked depth push — gentle forward motion as dissolve progresses.
  useEffect(() => {
    const unsub = smoothProgress.on('change', (p) => {
      translateZ.set(p * 40);
    });
    return unsub;
  }, [smoothProgress, translateZ]);

  return (
    <section ref={sectionRef} className="relative h-[220vh]">
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden mesh-gradient"
        style={{ y: containerY }}
      >
        {/* Frame-sequence canvas with 3D parallax */}
        <div
          className="absolute inset-0"
          style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              rotateX: reduceMotion ? 0 : rotateX,
              rotateY: reduceMotion ? 0 : rotateY,
              z: reduceMotion ? 0 : translateZ,
              scale: canvasScale,
              opacity: canvasOpacity,
              transformStyle: 'preserve-3d',
              willChange: 'transform, opacity',
            }}
          >
            <img
              ref={imgRef}
              src={framePath(1)}
              alt="Paris map dissolving into golden particles"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </motion.div>

          {/* Oval vignette — clears center for text, darkens edges so video breathes */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,_transparent_30%,_rgba(6,6,4,0.92)_100%)]" />
          {/* Protective centre scrim — darkens only the text zone so any frame is readable */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_42%_at_50%_50%,_rgba(6,6,4,0.52)_0%,_transparent_100%)]" />
          {/* Soft top fade so it meets the nav bar cleanly */}
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-gradient-to-b from-surface/90 to-transparent" />
          {/* Bottom fade blends the last frame into section B */}
          <div className="absolute inset-x-0 bottom-0 h-[35vh] pointer-events-none bg-gradient-to-b from-transparent via-surface/70 to-surface" />
        </div>

        {/* Dead-center content block — title, stats, all centered */}
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          {/* Eyebrow — grounds the brand immediately */}
          <motion.p
            className="font-label text-[9px] uppercase tracking-[0.35em] text-primary/90 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0, ease: 'easeOut' }}
          >
            Paris&nbsp;·&nbsp;Startup&nbsp;Arena&nbsp;·&nbsp;2025
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="font-headline leading-[0.88] text-on-surface drop-shadow-[0_2px_48px_rgba(0,0,0,0.98)]"
            style={{ fontSize: 'clamp(3.2rem, 9vw, 8rem)', letterSpacing: '0.05em', textShadow: '0 0 60px rgba(6,6,4,0.9), 0 4px 24px rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            PARIS
            <br />
            <span
              className="italic text-primary"
              style={{ fontWeight: 200, fontSize: '1.08em', letterSpacing: '0.03em' }}
            >
              Startup
            </span>
            <br />
            ARENA
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="font-headline italic text-on-surface/90 mt-5 drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
            style={{ fontSize: 'clamp(0.9rem, 1.6vw, 1.2rem)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.36, ease: 'easeOut' }}
          >
            The curated job board for Paris's most ambitious startups.
          </motion.p>

          {/* Thin gold divider */}
          <motion.div
            className="w-px h-10 bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 my-8"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
          />

          {/* Stats with numeric values */}
          <motion.div
            className="flex flex-wrap justify-center gap-10 md:gap-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
          >
            {[
              { value: jobCount, label: 'Open Roles' },
              { value: companyCount, label: 'Startups' },
              { value: -1, label: 'Daily Refresh' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.62 + i * 0.12, ease: 'easeOut' }}
              >
                {stat.value === -1 ? (
                  <span className="font-headline italic text-primary text-2xl leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    ∞
                  </span>
                ) : stat.value === 0 ? (
                  <span className="w-10 h-5 rounded bg-primary/20 animate-pulse inline-block" />
                ) : (
                  <span className="font-headline italic text-primary text-2xl leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    {stat.value}
                  </span>
                )}
                <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/90">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint — bottom-anchored, editorial line treatment */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 pointer-events-none"
          style={{ opacity: titleOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-primary/50" />
            <span className="font-label text-[10px] uppercase tracking-[0.32em] text-on-surface-variant/70">
              Scroll to Observe
            </span>
            <div className="w-12 h-px bg-primary/50" />
          </div>
          <div className="w-[1px] h-10 bg-gradient-to-b from-primary/0 via-primary/60 to-primary/0 animate-bob mt-1" />
        </motion.div>

        {/* Live indicator strip */}
        <motion.div
          className="absolute bottom-0 w-full py-4 border-t border-outline-variant/30 flex justify-center items-center gap-3 z-10 bg-surface/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <div className="w-2 h-2 rounded-full bg-primary pulse-gold" />
          <span className="font-label text-[9px] uppercase tracking-[0.3em] text-on-surface-variant">
            Live
          </span>
          {jobCount > 0 && (
            <>
              <span className="font-label text-[9px] text-tertiary/60">·</span>
              <span className="font-label text-[9px] uppercase tracking-[0.25em] text-primary/80">{jobCount} Roles</span>
              <span className="font-label text-[9px] text-tertiary/60">·</span>
              <span className="font-label text-[9px] uppercase tracking-[0.25em] text-on-surface-variant/70">{companyCount} Startups</span>
            </>
          )}
        </motion.div>

        {/* Preload progress — sits just above the live strip */}
        {loaded < FRAME_COUNT && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 font-label text-[8px] uppercase tracking-[0.25em] text-tertiary/60 whitespace-nowrap">
            Loading Scene {Math.round((loaded / FRAME_COUNT) * 100)}%
          </div>
        )}
      </motion.div>
    </section>
  );
}

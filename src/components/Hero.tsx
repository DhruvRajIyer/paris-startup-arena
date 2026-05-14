import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'motion/react';
import { useRef, useEffect, useState } from 'react';

interface HeroProps {
  jobCount?: number;
  companyCount?: number;
}

export function Hero({ jobCount = 247, companyCount = 83 }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [loadPct, setLoadPct] = useState(0);
  const reduceMotion = useReducedMotion();

  // Direct scroll — no spring on video scrubbing.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Spring only for UI overlays.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 42,
    mass: 0.35,
    restDelta: 0.001,
  });

  const titleOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.6], ['0%', '-25%']);
  const videoOpacity = useTransform(smoothProgress, [0, 0.06, 0.88, 1], [0.7, 1, 1, 0.85]);
  const containerY = useTransform(smoothProgress, [0.8, 1], ['0%', '-5%']);

  // Mouse parallax — subtle x/y translate only.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 50, damping: 18 });
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-6, 6]), { stiffness: 50, damping: 18 });

  // Track video buffer progress for loading indicator.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onProgress = () => {
      if (!video.duration) return;
      let loaded = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        loaded = Math.max(loaded, video.buffered.end(i));
      }
      setLoadPct(Math.round((loaded / video.duration) * 100));
    };

    const markReady = () => {
      setVideoReady(true);
      setTimeout(() => setOverlayVisible(false), 400);
    };

    video.addEventListener('progress', onProgress);
    video.addEventListener('canplay', markReady);
    // Already has enough data on mount (cached)?
    if (video.readyState >= 3) {
      setVideoReady(true);
      setOverlayVisible(false);
    }

    return () => {
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('canplay', markReady);
    };
  }, []);

  // Scroll → video.currentTime via rAF. Direct, no spring.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    let targetTime = 0;

    const apply = () => {
      raf = 0;
      if (!videoReady || video.readyState < 2) return;
      const duration = video.duration || 4.1;
      video.currentTime = Math.min(duration, Math.max(0, targetTime));
    };

    const unsub = scrollYProgress.on('change', (p) => {
      if (!videoReady) return;
      const duration = video.duration || 4.1;
      targetTime = p * duration;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    return () => { unsub(); if (raf) cancelAnimationFrame(raf); };
  }, [scrollYProgress, videoReady]);

  // Mouse tracking.
  useEffect(() => {
    if (reduceMotion) return;
    const handle = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    const leave = () => { mouseX.set(0); mouseY.set(0); };
    window.addEventListener('mousemove', handle);
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', handle);
      window.removeEventListener('mouseleave', leave);
    };
  }, [mouseX, mouseY, reduceMotion]);

  return (
    <section ref={sectionRef} className="relative h-[150vh]">
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden mesh-gradient"
        style={{ y: containerY }}
      >
        {/* Native video — scrubbed by scroll, hardware decoded */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: videoOpacity,
            x: reduceMotion ? 0 : parallaxX,
            y: reduceMotion ? 0 : parallaxY,
            willChange: 'transform, opacity',
          }}
        >
          <video
            ref={videoRef}
            src="/hero/hero-scrub.mp4"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            style={{ willChange: 'contents' }}
          />
        </motion.div>

        {/* Full dark overlay — base readability layer */}
        <div className="absolute inset-0 pointer-events-none bg-surface/40" />
        {/* Oval vignette — darkens edges */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_65%_60%_at_50%_50%,_transparent_20%,_rgba(6,6,4,0.94)_100%)]" />
        {/* Centre scrim — strong dark pill behind text */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_48%_at_50%_50%,_rgba(6,6,4,0.72)_0%,_transparent_100%)]" />
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-gradient-to-b from-surface to-transparent" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-[35vh] pointer-events-none bg-gradient-to-b from-transparent via-surface/80 to-surface" />

        {/* Content block */}
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <motion.p
            className="font-label text-[10px] uppercase tracking-[0.4em] text-primary mb-6 drop-shadow-[0_1px_8px_rgba(0,0,0,1)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            Paris&nbsp;·&nbsp;Startup&nbsp;Arena&nbsp;·&nbsp;2025
          </motion.p>

          <motion.h1
            className="font-headline leading-[0.88] text-on-surface"
            style={{ fontSize: 'clamp(3.2rem, 9vw, 8rem)', letterSpacing: '0.05em', textShadow: '0 2px 4px rgba(0,0,0,1), 0 0 80px rgba(6,6,4,1), 0 4px 32px rgba(0,0,0,1)' }}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            PARIS
            <br />
            <span className="italic text-primary" style={{ fontWeight: 200, fontSize: '1.08em', letterSpacing: '0.03em', textShadow: '0 2px 4px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,1)' }}>
              Startup
            </span>
            <br />
            ARENA
          </motion.h1>

          <motion.p
            className="font-headline italic text-on-surface mt-5"
            style={{ fontSize: 'clamp(1rem, 1.8vw, 1.35rem)', textShadow: '0 1px 3px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.9)' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.36, ease: 'easeOut' }}
          >
            The curated job board for Paris's most ambitious startups.
          </motion.p>

          <motion.div
            className="w-px h-10 bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 my-8"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
          />

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
                  <span className="font-headline italic text-primary text-3xl leading-none" style={{ textShadow: '0 2px 12px rgba(0,0,0,1)' }}>∞</span>
                ) : stat.value === 0 ? (
                  <span className="w-10 h-5 rounded bg-primary/20 animate-pulse inline-block" />
                ) : (
                  <span className="font-headline italic text-primary text-3xl leading-none" style={{ textShadow: '0 2px 12px rgba(0,0,0,1)' }}>{stat.value}</span>
                )}
                <span className="font-label text-[11px] uppercase tracking-[0.25em] text-on-surface drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 pointer-events-none"
          style={{ opacity: titleOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-primary/50" />
            <span className="font-label text-[10px] uppercase tracking-[0.32em] text-on-surface/60 drop-shadow-[0_1px_6px_rgba(0,0,0,1)]">Scroll to Observe</span>
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
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface">Live</span>
          {jobCount > 0 && (
            <>
              <span className="font-label text-[10px] text-primary/50">·</span>
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary">{jobCount} Roles</span>
              <span className="font-label text-[10px] text-primary/50">·</span>
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">{companyCount} Startups</span>
            </>
          )}
        </motion.div>

        {/* Full-screen cinematic loading overlay */}
        {overlayVisible && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface"
            initial={{ opacity: 1 }}
            animate={{ opacity: videoReady ? 0 : 1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onAnimationComplete={() => { if (videoReady) setOverlayVisible(false); }}
            style={{ pointerEvents: videoReady ? 'none' : 'auto' }}
          >
            <motion.p
              className="font-label text-[9px] uppercase tracking-[0.4em] text-primary/70 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Paris&nbsp;·&nbsp;Startup&nbsp;Arena
            </motion.p>
            <div className="w-48 h-px bg-outline-variant/30 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: `${loadPct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <motion.p
              className="font-label text-[8px] uppercase tracking-[0.3em] text-tertiary/50 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {loadPct > 0 ? `${loadPct}%` : 'Loading…'}
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

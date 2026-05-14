import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'motion/react';
import { useRef, useEffect, useState } from 'react';

const FRAME_COUNT = 200;
const PRIORITY_FRAMES = 36; // Load these first before firing background loads
const FADE_MS = 35; // Cross-fade duration between frames in ms
const framePath = (i: number) =>
  `/hero-frames/frame_${String(i).padStart(3, '0')}.webp`;

interface HeroProps {
  jobCount?: number;
  companyCount?: number;
}

export function Hero({ jobCount = 247, companyCount = 83 }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  // A/B canvas pair for cross-fading between frames
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const activeCanvas = useRef<'A' | 'B'>('A');
  const fadeRaf = useRef(0);
  const [loaded, setLoaded] = useState(0);
  const reduceMotion = useReducedMotion();

  const bitmaps = useRef<(ImageBitmap | HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null)
  );
  const currentFrame = useRef(0);

  // Direct scroll — no spring on frames.
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

  // Adjusted for shorter 154vh scroll
  const titleOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.6], ['0%', '-25%']);
  const canvasOpacity = useTransform(smoothProgress, [0, 0.06, 0.88, 1], [0.7, 1, 1, 0.85]);
  const containerY = useTransform(smoothProgress, [0.8, 1], ['0%', '-5%']);

  // Mouse parallax — subtle, no tilt on canvas itself
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 50, damping: 18 });
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-8, 8]), { stiffness: 50, damping: 18 });

  // Draw bitmap onto a specific canvas, cover-fit.
  const drawTo = (canvas: HTMLCanvasElement, bmp: ImageBitmap | HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const sw = bmp instanceof ImageBitmap ? bmp.width : (bmp as HTMLImageElement).naturalWidth;
    const sh = bmp instanceof ImageBitmap ? bmp.height : (bmp as HTMLImageElement).naturalHeight;
    const scale = Math.max(cw / sw, ch / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(bmp as CanvasImageSource, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  // Resize both canvases to device pixel ratio.
  const resizeCanvases = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    [canvasARef, canvasBRef].forEach(ref => {
      const c = ref.current;
      if (!c) return;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
    });
    const bmp = bitmaps.current[currentFrame.current];
    if (bmp && canvasARef.current) drawTo(canvasARef.current, bmp);
  };

  useEffect(() => {
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    return () => window.removeEventListener('resize', resizeCanvases);
  }, []);

  // Cross-fade to a new frame: draw onto inactive canvas, animate opacity swap.
  const crossFadeTo = (idx: number) => {
    const bmp = bitmaps.current[idx];
    if (!bmp) return;
    const canvasA = canvasARef.current;
    const canvasB = canvasBRef.current;
    if (!canvasA || !canvasB) return;

    if (reduceMotion) {
      // No fade — just draw directly to active canvas
      const active = activeCanvas.current === 'A' ? canvasA : canvasB;
      drawTo(active, bmp);
      currentFrame.current = idx;
      return;
    }

    const incoming = activeCanvas.current === 'A' ? canvasB : canvasA;
    const outgoing = activeCanvas.current === 'A' ? canvasA : canvasB;

    drawTo(incoming, bmp);

    // Cancel any in-progress fade
    if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);

    const start = performance.now();
    incoming.style.opacity = '0';
    outgoing.style.opacity = '1';

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      incoming.style.opacity = String(t);
      outgoing.style.opacity = String(1 - t);
      if (t < 1) {
        fadeRaf.current = requestAnimationFrame(animate);
      } else {
        incoming.style.opacity = '1';
        outgoing.style.opacity = '0';
        activeCanvas.current = activeCanvas.current === 'A' ? 'B' : 'A';
        currentFrame.current = idx;
        fadeRaf.current = 0;
      }
    };
    fadeRaf.current = requestAnimationFrame(animate);
  };

  // Sequential priority loading: first 24 frames in order, then rest.
  useEffect(() => {
    let cancelled = false;

    const loadBitmap = async (i: number) => {
      try {
        const res = await fetch(framePath(i + 1));
        const blob = await res.blob();
        if (cancelled) return;
        let bmp: ImageBitmap | HTMLImageElement;
        if (typeof createImageBitmap !== 'undefined') {
          bmp = await createImageBitmap(blob);
        } else {
          const img = new Image();
          img.src = URL.createObjectURL(blob);
          await new Promise(r => { img.onload = img.onerror = r; });
          bmp = img;
        }
        if (cancelled) return;
        bitmaps.current[i] = bmp;
        if (i === 0 && canvasARef.current) {
          drawTo(canvasARef.current, bmp);
          canvasARef.current.style.opacity = '1';
        }
      } catch { /* silent */ }
      if (!cancelled) setLoaded(n => n + 1);
    };

    // Load priority frames sequentially (await each)
    (async () => {
      for (let i = 0; i < PRIORITY_FRAMES && !cancelled; i++) {
        await loadBitmap(i);
      }
      // Load remaining frames in parallel
      for (let i = PRIORITY_FRAMES; i < FRAME_COUNT; i++) {
        loadBitmap(i);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Scroll → frame, direct mapping, cross-fade on change.
  useEffect(() => {
    let raf = 0;
    let pending = -1;

    const apply = () => {
      raf = 0;
      if (pending < 0) return;
      const target = pending;
      pending = -1;

      if (target === currentFrame.current) return;

      if (bitmaps.current[target]) {
        crossFadeTo(target);
      } else {
        // Find nearest loaded frame
        let nearest = target;
        for (let d = 1; d < FRAME_COUNT; d++) {
          if (target - d >= 0 && bitmaps.current[target - d]) { nearest = target - d; break; }
          if (target + d < FRAME_COUNT && bitmaps.current[target + d]) { nearest = target + d; break; }
        }
        if (nearest !== currentFrame.current) crossFadeTo(nearest);
      }
    };

    const unsub = scrollYProgress.on('change', (p) => {
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(p * (FRAME_COUNT - 1))));
      pending = idx;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    return () => { unsub(); if (raf) cancelAnimationFrame(raf); };
  }, [scrollYProgress]);

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
        {/* A/B canvas layers — cross-fade between frames */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: canvasOpacity,
            x: reduceMotion ? 0 : parallaxX,
            y: reduceMotion ? 0 : parallaxY,
            willChange: 'transform, opacity',
          }}
        >
          <canvas
            ref={canvasARef}
            className="absolute inset-0 select-none pointer-events-none"
            style={{ opacity: 1, transition: 'none' }}
          />
          <canvas
            ref={canvasBRef}
            className="absolute inset-0 select-none pointer-events-none"
            style={{ opacity: 0, transition: 'none' }}
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

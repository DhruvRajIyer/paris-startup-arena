import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't render on touch-only devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    // Ring lags behind dot with lerp
    let ringX = 0;
    let ringY = 0;
    let targetX = 0;
    let targetY = 0;
    let isHovered = false;
    let isClicked = false;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ringX = lerp(ringX, targetX, 0.12);
      ringY = lerp(ringY, targetY, 0.12);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
      }
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px) scale(${isClicked ? 0.6 : 1})`;
      }
    };

    const onDown = () => {
      isClicked = true;
      if (dotRef.current) dotRef.current.style.transform = dotRef.current.style.transform.replace(/scale\([^)]+\)/, 'scale(0.6)');
    };
    const onUp = () => {
      isClicked = false;
    };

    const setHovered = (v: boolean) => {
      isHovered = v;
      if (dotRef.current) {
        dotRef.current.style.opacity = v ? '0' : '1';
      }
      if (ringRef.current) {
        ringRef.current.style.width = v ? '44px' : '40px';
        ringRef.current.style.height = v ? '44px' : '40px';
        ringRef.current.style.borderColor = v ? '#C8A96E' : 'rgba(200,169,110,0.45)';
        ringRef.current.style.background = v ? 'rgba(200,169,110,0.07)' : 'transparent';
        if (v) {
          ringRef.current.style.transform = ringRef.current.style.transform; // force repaint
        }
      }
    };

    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);

    const bindInteractables = () => {
      document.querySelectorAll('button, a, input, [data-cursor="hover"]').forEach(el => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };

    const observer = new MutationObserver(bindInteractables);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(bindInteractables, 500);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Hide on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      {/* Dot — snaps instantly to cursor */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#C8A96E',
          boxShadow: '0 0 10px rgba(200,169,110,0.8)',
          willChange: 'transform',
          transition: 'opacity 0.2s ease',
        }}
      />
      {/* Ring — lags behind with lerp */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full"
        style={{
          width: '40px',
          height: '40px',
          border: '1px solid rgba(200,169,110,0.45)',
          willChange: 'transform',
          transition: 'width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background 0.25s ease',
        }}
      />
    </>
  );
}

'use client';

/**
 * <HeroStage> — P26.5 cathedral hero.
 *
 * Full-bleed background video (`code.mp4` primary, `dataviz.mp4` fallback on
 * error) with the "Cathédrale d'intelligence numérique" JPG overlay at low
 * opacity + screen blend, a dark vignette for legibility, and a cursor-reactive
 * parallax tilt on the hero text (max 8px translation, capped, debounced via
 * rAF). Everything motion-related gates on `prefers-reduced-motion: no-preference`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function HeroStage({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState('/hero/code.mp4');
  const [poster, setPoster] = useState('/hero/code-poster.jpg');

  // Cursor-tilt parallax: pointermove -> rAF -> CSS vars on .parallax.
  useEffect(() => {
    const node = parallaxRef.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const MAX = 8; // px — cap per brief

    function onMove(e: PointerEvent) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Range -1..1, scaled to MAX px.
      pendingX = ((e.clientX / w) * 2 - 1) * MAX;
      pendingY = ((e.clientY / h) * 2 - 1) * MAX;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!node) return;
          node.style.setProperty('--tx', `${pendingX.toFixed(2)}px`);
          node.style.setProperty('--ty', `${pendingY.toFixed(2)}px`);
        });
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Fallback video on error.
  function handleError() {
    if (src.includes('code.mp4')) {
      setSrc('/hero/dataviz.mp4');
      setPoster('/hero/dataviz-poster.jpg');
    }
  }

  return (
    <section
      className="relative overflow-hidden"
      aria-label="dd-cons hero"
    >
      {/* Background video — purely decorative, aria-hidden. */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={handleError}
        aria-hidden="true"
        className="hero-breathe absolute inset-0 h-full w-full object-cover"
        data-testid="hero-video"
      />

      {/* Cathedral overlay — screen blend, low opacity. Decorative. */}
      <img
        src="/hero/cathedral.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.25, mixBlendMode: 'screen' }}
      />

      {/* Animated mesh tint for the mint+violet drift. */}
      <div aria-hidden="true" className="mesh-bg" style={{ opacity: 0.55 }} />

      {/* Vignette to keep text contrast >= 4.5:1. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in oklch, #0b0d10 35%, transparent) 0%, color-mix(in oklch, #0b0d10 55%, transparent) 45%, var(--color-bg) 100%)',
        }}
      />

      {/* Hero content — parallax tilt target. */}
      <div
        ref={parallaxRef}
        className="parallax relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-28"
        style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55)' }}
      >
        {children}
      </div>
    </section>
  );
}

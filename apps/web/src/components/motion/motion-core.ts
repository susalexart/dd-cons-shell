'use client';

/**
 * Motion core singletons — one Lenis instance + one GSAP ScrollTrigger
 * registration shared by every page. The journey scenes and the brain
 * canvas communicate through `brainState` (warp speeds up pulse traffic
 * during the core chapter).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export const brainState = { warp: 0 };

let lenis: Lenis | null = null;
let initialized = false;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function initMotion(): Lenis | null {
  if (initialized) return lenis;
  initialized = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (prefersReducedMotion()) return null;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.9,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function scrollToTarget(target: string): void {
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  }
}

export { gsap, ScrollTrigger };

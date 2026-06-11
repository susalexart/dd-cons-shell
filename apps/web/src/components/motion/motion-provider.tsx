'use client';

import { useEffect, type ReactNode } from 'react';
import { initMotion } from './motion-core';

/** Boots Lenis + ScrollTrigger once for the whole app (no-op when reduced motion). */
export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initMotion();
  }, []);
  return <>{children}</>;
}

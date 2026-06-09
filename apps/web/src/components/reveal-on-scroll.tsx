'use client';

/**
 * <RevealOnScroll> — adds `.in-view` to children when they enter viewport.
 * Reduced-motion users see content immediately (CSS handles the override).
 */
import { useEffect, useRef, type ReactNode } from 'react';

export function RevealOnScroll({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('in-view');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cast ref through any to keep the polymorphic tag simple.
  const Component = Tag as 'div';
  return (
    <Component ref={ref} className={`reveal ${className}`}>
      {children}
    </Component>
  );
}

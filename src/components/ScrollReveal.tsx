'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — adds a tasteful entrance animation when the element
 * scrolls into view. Pure CSS + IntersectionObserver, no library.
 *
 * Respects prefers-reduced-motion (globals.css disables transitions).
 */
export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  /** ms delay before the animation starts */
  delay?: number;
  /** px to travel up */
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If IO isn't available, just show it
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal ${visible ? 'revealed' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ['--reveal-y' as string]: `${y}px` }}
    >
      {children}
    </Tag>
  );
}

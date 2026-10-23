import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay in ms, applied through a CSS custom property. */
  delay?: number;
};

/**
 * Fade-up on first scroll into view. Only opacity/transform animate, and the
 * motion is disabled entirely by `prefers-reduced-motion` in index.css.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('reveal min-w-0', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

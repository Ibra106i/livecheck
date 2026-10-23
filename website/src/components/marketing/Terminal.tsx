import { useEffect, useRef, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';
import {
  SAMPLE_HOST,
  SAMPLE_ROWS,
  SAMPLE_SCORE,
  SAMPLE_SUMMARY,
  SAMPLE_URL,
  SAMPLE_VERDICT,
  type CheckStatus,
} from '../../lib/sampleAudit';

const STATUS: Record<CheckStatus, { short: string; text: string; dot: string }> = {
  pass: { short: 'PASS', text: 'text-pass', dot: 'bg-pass' },
  warn: { short: 'WARN', text: 'text-warn', dot: 'bg-warn' },
  fail: { short: 'FAIL', text: 'text-red-400', dot: 'bg-red-400' },
  skip: { short: 'SKIP', text: 'text-slate-400', dot: 'bg-slate-400' },
};

const TILT_DISABLED = '(prefers-reduced-motion: reduce)';

export function Terminal() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const body = bodyRef.current;
    if (!frame || !body) return;

    const canTilt = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia(TILT_DISABLED);

    const reset = () => {
      body.style.transform = '';
    };

    const handleMove = (event: PointerEvent) => {
      if (!canTilt.matches || reducedMotion.matches) return;
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      body.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
    };

    frame.addEventListener('pointermove', handleMove, { passive: true });
    frame.addEventListener('pointerleave', reset);
    const media = [canTilt, reducedMotion];
    media.forEach((query) => query.addEventListener('change', reset));

    return () => {
      frame.removeEventListener('pointermove', handleMove);
      frame.removeEventListener('pointerleave', reset);
      media.forEach((query) => query.removeEventListener('change', reset));
    };
  }, []);

  return (
    <div className="w-full min-w-0">
      <div ref={frameRef} className="relative [perspective:1200px]">
        <div
          ref={bodyRef}
          className="overflow-hidden rounded-xl border border-line bg-panel shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] transition-transform duration-200 ease-out will-change-transform"
        >
          <div className="flex items-center gap-2 border-b border-line bg-socket px-4 py-2.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-2 font-mono text-[12px] text-slate-400">livechecks — audit</span>
          </div>

          <div className="overflow-x-auto px-4 py-5 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <div className="min-w-0 max-w-full">
                <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-cyan-400">
                  Livecheck audit
                </p>
                <p className="mt-1 truncate font-mono text-[12px] text-slate-400">
                  {SAMPLE_HOST}{' '}
                  <span className="text-slate-400">({SAMPLE_URL})</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono leading-none">
                  <span className="text-2xl font-bold text-white">{SAMPLE_SCORE}</span>
                  <span className="text-sm text-slate-400">/100</span>
                </p>
                <p className="mt-1 font-mono text-[12px] text-pass">{SAMPLE_VERDICT}</p>
              </div>
            </div>

            <div className="my-4 h-px w-full bg-line" />

            <ul className="space-y-2">
              {SAMPLE_ROWS.map((row, index) => {
                const status = STATUS[row.status];
                return (
                  <li
                    key={row.label}
                    className="term-row flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-[12px] leading-5 sm:text-[12px]"
                    style={{ '--row-delay': `${index * 70}ms` } as CSSProperties}
                  >
                    <span className={cn('inline-flex w-[46px] shrink-0 items-center gap-1.5 font-semibold', status.text)}>
                      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.short}
                    </span>
                    <span className="w-[118px] shrink-0 text-slate-200 sm:w-[132px]">{row.label}</span>
                    <span className="min-w-0 flex-1 text-slate-400">{row.detail}</span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 font-mono text-[12px] text-slate-400">
              <span className="text-pass">{SAMPLE_SUMMARY.pass} passed</span>
              <span>{SAMPLE_SUMMARY.fail} failed</span>
              <span className="text-warn">{SAMPLE_SUMMARY.warn} warnings</span>
              <span>{SAMPLE_SUMMARY.skip} skipped</span>
              <span>{SAMPLE_SUMMARY.blocked} blocked</span>
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-[12px] text-slate-400">
        Example output — <span className="text-slate-400">npx livechecks https://livechecks.vercel.app</span>
      </p>
    </div>
  );
}

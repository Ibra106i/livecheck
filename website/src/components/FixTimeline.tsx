import { CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { FIXES } from '../lib/mockData';
import type { FixProgress } from '../lib/types';
import { cn } from '../lib/utils';

const STATUS_STYLES: Record<string, { container: string; icon: string; badge: string; line: string }> = {
  done: {
    container: 'border-primary-border bg-primary-bg',
    icon: 'text-primary',
    badge: 'bg-primary-bg text-primary border-primary-border',
    line: 'bg-primary/40',
  },
  in_progress: {
    container: 'border-accent-border bg-accent-bg',
    icon: 'text-accent',
    badge: 'bg-accent-bg text-accent border-accent-border',
    line: 'bg-accent/40',
  },
  pending: {
    container: 'border-border bg-bg-elevated/50',
    icon: 'text-fg-subtle',
    badge: 'bg-bg-elevated text-fg-subtle border-border',
    line: 'bg-border',
  },
  flagged: {
    container: 'border-warning-border bg-warning-bg',
    icon: 'text-warning',
    badge: 'bg-warning-bg text-warning border-warning-border',
    line: 'bg-warning/40',
  },
};

export function FixTimeline({ fixes }: { fixes: FixProgress[] }) {
  return (
    <div className="relative space-y-0">
      {FIXES.map((fixMeta, idx) => {
        const progress = fixes.find((f) => f.key === fixMeta.key);
        const status = progress?.status || 'pending';
        const styles = STATUS_STYLES[status];
        const Icon = status === 'done' ? CheckCircle2 : status === 'in_progress' ? Loader2 : status === 'flagged' ? AlertTriangle : Circle;
        const isLast = idx === FIXES.length - 1;

        return (
          <div key={fixMeta.key} className="relative flex gap-4 pb-8 last:pb-0 animate-in" style={{ animationDelay: `${idx * 100}ms` }}>
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px',
                  styles.line
                )}
              />
            )}
            <div
              className={cn(
                'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                styles.container
              )}
            >
              <Icon className={cn('h-5 w-5', styles.icon, status === 'in_progress' && 'animate-spin')} />
            </div>
            <div className="flex-1 pt-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-fg">{fixMeta.label}</h4>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide capitalize',
                    styles.badge
                  )}
                >
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-fg-muted">{fixMeta.description}</p>
              {progress?.note && (
                <p className="mt-2.5 rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning">
                  {progress.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
import { CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { FIXES } from '../lib/mockData';
import type { FixProgress } from '../lib/types';
import { cn } from '../lib/utils';

const STATUS_STYLES: Record<string, string> = {
  done: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  in_progress: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  pending: 'border-zinc-700 bg-zinc-900 text-zinc-600',
  flagged: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
};

export function FixTimeline({ fixes }: { fixes: FixProgress[] }) {
  return (
    <div className="relative space-y-0">
      {FIXES.map((fixMeta, idx) => {
        const progress = fixes.find((f) => f.key === fixMeta.key);
        const status = progress?.status || 'pending';
        const Icon = status === 'done' ? CheckCircle2 : status === 'in_progress' ? Loader2 : status === 'flagged' ? AlertTriangle : Circle;
        const isLast = idx === FIXES.length - 1;

        return (
          <div key={fixMeta.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px',
                  status === 'done' ? 'bg-emerald-500/40' : 'bg-zinc-800'
                )}
              />
            )}
            <div
              className={cn(
                'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                STATUS_STYLES[status]
              )}
            >
              <Icon className={cn('h-5 w-5', status === 'in_progress' && 'animate-spin')} />
            </div>
            <div className="flex-1 pt-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-zinc-100">{fixMeta.label}</h4>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                    status === 'done' && 'bg-emerald-500/10 text-emerald-400',
                    status === 'in_progress' && 'bg-blue-500/10 text-blue-400',
                    status === 'pending' && 'bg-zinc-800 text-zinc-500',
                    status === 'flagged' && 'bg-amber-500/10 text-amber-400'
                  )}
                >
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{fixMeta.description}</p>
              {progress?.note && (
                <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
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

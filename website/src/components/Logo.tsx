import { ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950 shadow-[0_0_16px_-2px_rgba(16,185,129,0.7)]">
        <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {!iconOnly && <span className="text-lg font-bold tracking-tight text-white">Livecheck</span>}
    </div>
  );
}

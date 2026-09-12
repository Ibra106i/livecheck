import { cn } from '../../lib/utils';

interface StepCardProps {
  icon: React.ElementType;
  number: number;
  title: string;
  desc: string;
  delay?: number;
}

export function StepCard({ icon: Icon, number, title, desc, delay = 0 }: StepCardProps) {
  return (
    <div
      className={cn(
        'relative animate-in',
        delay && `animate-in-delay-${Math.min(Math.floor(delay / 0.08), 5)}`
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-primary-bg text-primary">
        <Icon className="h-7 w-7" strokeWidth={2} />
        <span className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bg text-[10px] font-bold text-primary">
          {number}
        </span>
      </div>
      <div className="mt-5 text-xs font-bold uppercase tracking-wider text-fg-subtle">
        STEP {number}
      </div>
      <h3 className="mt-2 font-semibold text-fg">{title}</h3>
      <p className="mt-3 text-sm text-fg-muted leading-relaxed">{desc}</p>
    </div>
  );
}
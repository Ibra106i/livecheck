import { cn } from '../../lib/utils';

interface ProblemCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay?: number;
}

export function ProblemCard({ icon: Icon, title, desc, delay = 0 }: ProblemCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-bg-card p-6 transition-all duration-300 animate-in',
        'hover:border-danger-border hover:shadow-[0_0_40px_-10px_rgba(248,113,113,0.15)] hover:-translate-y-1',
        delay && `animate-in-delay-${Math.min(Math.floor(delay / 0.1), 5)}`
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-danger/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-danger-bg text-danger">
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>
      <h3 className="mt-4 font-semibold text-fg">{title}</h3>
      <p className="mt-2 text-sm text-fg-muted leading-relaxed">{desc}</p>
    </div>
  );
}
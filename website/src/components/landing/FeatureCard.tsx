import { cn } from '../../lib/utils';
import { Lock, Send, Smartphone, Search, Gauge } from 'lucide-react';
import type { FixItem } from '../../lib/types';

const FIX_ICONS: Record<string, React.ElementType> = {
  ssl_dns: Lock,
  form_routing: Send,
  mobile_viewport: Smartphone,
  seo_meta: Search,
  page_speed: Gauge,
};

interface FeatureCardProps {
  fix: FixItem;
  index: number;
  delay?: number;
}

export function FeatureCard({ fix, index, delay = 0 }: FeatureCardProps) {
  const Icon = FIX_ICONS[fix.key];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-bg-card p-6 transition-all duration-300 animate-in',
        'hover:border-primary-border hover:shadow-[0_0_40px_-10px_rgba(6,214,160,0.15)] hover:-translate-y-1',
        delay && `animate-in-delay-${Math.min(Math.floor(delay / 0.1), 5)}`
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg text-primary">
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
        Fix {index + 1} of 5
      </div>
      <h3 className="mt-2 font-bold text-fg">{fix.label}</h3>
      <p className="mt-3 text-sm text-fg-muted leading-relaxed">{fix.description}</p>
    </div>
  );
}
import { Clock, CheckCircle2, Gauge, DollarSign } from 'lucide-react';

const stats = [
  { value: '1,240+', label: 'AI-built sites rescued', icon: CheckCircle2 },
  { value: '80%', label: 'Auto-patched before human review', icon: Gauge },
  { value: '36 hrs', label: 'Average turnaround', icon: Clock },
  { value: '$185/hr', label: 'Clear rate beyond scope', icon: DollarSign },
];

export function StatsBar() {
  return (
    <div className="border-y border-border bg-bg-elevated/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-bg text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-fg sm:text-4xl lg:text-5xl">{stat.value}</div>
              <div className="mt-1 text-sm text-fg-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
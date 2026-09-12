import { ArrowRight, ShieldCheck, Clock, BadgeCheck, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-bg-elevated/50 to-bg py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,214,160,0.08)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-grid" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-bg px-4 py-1.5 mb-6 animate-in">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">New: Self-serve SaaS beta waitlist open</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl animate-in animate-in-delay-1">
          Stop absorbing the last mile for free.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted animate-in animate-in-delay-2">
          Run your next AI-built site through a 60-second pre-intake audit and see exactly what
          ships, what's rejected, and what it costs — before you commit a single billable hour.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-in animate-in-delay-3">
          <Link to="/audit">
            <Button size="lg" className="w-full sm:w-auto">
              Start a Free Pre-Intake Audit <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/white-label">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore White-Label Program
            </Button>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 animate-in animate-in-delay-4">
          {[
            { icon: Clock, title: '60-second audit', desc: 'Instant accept/reject verdict' },
            { icon: BadgeCheck, title: 'Fixed $300 scope', desc: 'No surprises, no scope creep' },
            { icon: TrendingUp, title: 'Your margin', desc: 'Resell at $425–$550+' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-card p-5 transition-all duration-300 hover:border-primary-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-bg text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-fg">{item.title}</div>
              <div className="text-xs text-fg-muted text-center">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
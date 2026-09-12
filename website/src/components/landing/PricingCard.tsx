import { Check } from 'lucide-react';
import { FIXES, PACKAGE_PRICE, CUSTOM_HOURLY_RATE } from '../../lib/mockData';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PricingCard() {
  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="relative overflow-hidden rounded-2xl border border-primary-border bg-gradient-to-b from-primary/5 to-transparent p-8">
          <Badge variant="primary" className="w-fit mb-5">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Flat-Fee Package
            </span>
          </Badge>
          <div className="mb-5 flex items-end gap-1">
            <span className="text-5xl font-bold text-fg">${PACKAGE_PRICE}</span>
            <span className="pb-1 text-fg-muted">/ site</span>
          </div>
          <p className="mb-6 text-sm text-fg-muted">24–48 hour turnaround. One invoice, zero surprises.</p>
          <ul className="mb-8 space-y-3">
            {FIXES.map((f) => (
              <li key={f.key} className="flex items-start gap-2.5 text-sm text-fg-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f.label}
              </li>
            ))}
            <li className="flex items-start gap-2.5 text-sm text-fg-muted">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> White-label completion certificate for your client
            </li>
          </ul>
          <Link to="/audit">
            <Button className="w-full" size="lg">
              Start Pre-Intake Audit <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Button>
          </Link>
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="flex h-full flex-col justify-center rounded-2xl border border-warning-border bg-warning/5 p-8">
          <div className="flex items-center gap-2 text-warning">
            <Ban className="h-5 w-5" />
            <h3 className="text-lg font-semibold">A hard boundary, on purpose</h3>
          </div>
          <p className="mt-3 text-sm text-fg-muted">
            The $300 package covers exactly the five fixes above — nothing else. The moment a
            project needs custom backend work or a complex third-party API integration (payment
            gateways, CRMs, booking engines, inventory sync), it automatically triggers a separate
            scoped engagement at our hourly rate.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-bg text-warning">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-fg">${CUSTOM_HOURLY_RATE}/hr</div>
              <div className="text-xs text-fg-muted">Custom backend & API integration work, quoted upfront in writing</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-fg-subtle">
            This is why our pre-intake audit auto-rejects messy sites instead of letting a human
            quote them by hand — no unprofitable rewrites, no scope creep, no margin surprises.
          </p>
        </div>
      </div>
    </div>
  );
}
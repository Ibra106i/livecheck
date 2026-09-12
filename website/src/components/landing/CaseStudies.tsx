import { cn } from '../../lib/utils';
import { ArrowRight, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface CaseStudy {
  id: string;
  client: string;
  url: string;
  builder: string;
  complexity: number;
  status: 'delivered' | 'rejected';
  hoursSaved: number;
  turnaround: number;
  markup?: number;
  fixes: string[];
  highlights: string[];
}

const caseStudies: CaseStudy[] = [
  {
    id: 'LC-1001',
    client: 'Northbay Dental Group',
    url: 'northbaydentalgroup.com',
    builder: 'Framer AI',
    complexity: 22,
    status: 'delivered',
    hoursSaved: 24,
    turnaround: 30,
    markup: 450,
    fixes: ['SSL & DNS', 'Form Routing', 'SEO Meta', 'Page Speed'],
    highlights: ['Client launch Monday — prioritized', 'White-label certificate delivered', 'Zero client complaints'],
  },
  {
    id: 'LC-1002',
    client: 'Summit Gear Co.',
    url: 'summitgearco.com',
    builder: '10Web',
    complexity: 34,
    status: 'delivered',
    hoursSaved: 19,
    turnaround: 26,
    fixes: ['SSL & DNS', 'Form Routing', 'Mobile Viewport', 'SEO Meta'],
    highlights: ['Hero video flagged for manual review', 'Client-approved compression', 'Delivered under budget'],
  },
  {
    id: 'LC-1003',
    client: 'Verdant Yoga Studio',
    url: 'verdantyogastudio.com',
    builder: 'Wix ADI',
    complexity: 28,
    status: 'delivered',
    hoursSaved: 22,
    turnaround: 34,
    markup: 475,
    fixes: ['SSL & DNS', 'Form Routing', 'Mobile Viewport', 'SEO Meta', 'Page Speed'],
    highlights: ['White-label at $475', 'Mobile breakpoints fully rebuilt', '5/5 fixes verified'],
  },
  {
    id: 'LC-1004',
    client: 'Trailhead Outfitters',
    url: 'trailheadoutfittersshop.com',
    builder: 'Shopify AI',
    complexity: 82,
    status: 'rejected',
    hoursSaved: 0,
    turnaround: 0,
    fixes: [],
    highlights: ['Live Shopify checkout detected', 'Custom inventory API integration', 'Auto-rejected before human review'],
  },
];

export function CaseStudies() {
  return (
    <section id="case-studies" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mx-auto mb-4">
            <CheckCircle2 className="h-3 w-3" /> Case Studies
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            From AI export to client-ready — every time.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Real projects. Real complexity scores. Real outcomes.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
          {caseStudies.map((c, i) => (
            <Card
              key={c.id}
              className={cn(
                'overflow-hidden transition-all duration-300 animate-in',
                'hover:border-primary-border hover:shadow-[0_0_40px_-10px_rgba(6,214,160,0.15)]',
                `animate-in-delay-${Math.min(i + 1, 5)}`
              )}
              style={{ animationDelay: `${(i + 1) * 0.1}s` }}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-fg-muted">
                      <span className="font-mono text-primary">{c.id}</span>
                      <span>·</span>
                      <span>{c.builder}</span>
                    </div>
                    <h3 className="mt-2 font-bold text-fg">{c.client}</h3>
                    <p className="mt-1 text-sm text-fg-muted">{c.url}</p>
                  </div>
                  <Badge variant={c.status === 'delivered' ? 'success' : 'danger'} size="lg">
                    {c.status === 'delivered' ? 'Delivered' : 'Rejected — Custom Scope'}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-bg-elevated/50 p-4 text-center">
                    <div className="text-2xl font-bold text-fg">{c.complexity}/100</div>
                    <div className="text-xs text-fg-muted">Complexity</div>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-elevated/50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-primary">
                      <Clock className="h-4 w-4" /> {c.turnaround || '—'}h
                    </div>
                    <div className="text-xs text-fg-muted">Turnaround</div>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-elevated/50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-success">
                      <CheckCircle2 className="h-4 w-4" /> {c.hoursSaved || '—'}h
                    </div>
                    <div className="text-xs text-fg-muted">Hours Saved</div>
                  </div>
                </div>

                {c.markup && (
                  <div className="mt-4 rounded-xl border border-primary-border bg-primary-bg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">White-Label Margin</span>
                      <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
                        <DollarSign className="h-5 w-5" /> ${c.markup - 300}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  {c.fixes.map((fix) => (
                    <Badge key={fix} variant="outline" className="text-xs">
                      {fix}
                    </Badge>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  {c.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-2.5 text-sm text-fg-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {h}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                    View full project timeline <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
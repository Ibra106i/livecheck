import { cn } from '../../lib/utils';
import { Star } from 'lucide-react';
import { Badge } from '../ui/badge';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  results?: string;
}

export function TestimonialCard({ testimonial, delay = 0 }: { testimonial: Testimonial; delay?: number }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-bg-card p-6 transition-all duration-300 animate-in',
        'hover:border-primary-border hover:shadow-[0_0_40px_-10px_rgba(6,214,160,0.15)]',
        delay && `animate-in-delay-${Math.min(Math.floor(delay / 0.1), 5)}`
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-fg-muted leading-relaxed">"{testimonial.quote}"</p>
      {testimonial.results && (
        <div className="mt-4 rounded-lg border border-primary-border bg-primary-bg p-3">
          <p className="text-xs font-semibold text-primary">{testimonial.results}</p>
        </div>
      )}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
          {testimonial.author.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-fg">{testimonial.author}</div>
          <div className="text-xs text-fg-muted">{testimonial.role}, {testimonial.company}</div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const testimonials = [
    {
      quote: "Livecheck saved our team 3 weeks of debugging on a Framer AI export. The SSL and form fixes alone were worth 10x the price. We've now baked it into every client handoff.",
      author: "Sarah Chen",
      role: "Technical Director",
      company: "Northlight Digital",
      results: "24 hrs saved per project • $450 resale margin",
    },
    {
      quote: "The pre-intake audit is the game-changer. It auto-rejected a Shopify AI build that would've been a nightmare. We didn't waste a single billable hour scoping it.",
      author: "Marcus Rivera",
      role: "Founder",
      company: "Framewright Studio",
      results: "3 rejected scopes • $12k saved in wasted dev time",
    },
    {
      quote: "White-label certificates make us look like heroes. Clients get a branded SLA doc showing every fix verified. We mark up $300 to $500 and they're thrilled.",
      author: "Priya Patel",
      role: "Partner",
      company: "Launchpad Collective",
      results: "12 projects delivered • 42% avg margin",
    },
    {
      quote: "Before Livecheck, our senior devs dreaded Friday afternoon 'the site is broken' calls. Now the patch script handles 80% before we even look at it.",
      author: "James Okonkwo",
      role: "Lead Engineer",
      company: "Bractive Agency",
      results: "Zero weekend emergencies • 28 hrs reclaimed/project",
    },
    {
      quote: "The boundary is brilliant. We used to scope custom API work into fixed fees and lose money. Now the audit draws a hard line and we quote custom work properly.",
      author: "Elena Volkov",
      role: "Operations Director",
      company: "Ironview Consulting",
      results: "5 custom engagements • $85k additional revenue",
    },
    {
      quote: "We've run 40+ sites through Livecheck. The consistency is unmatched — same 5 fixes, same 36hr turnaround, same client-facing certificate every time.",
      author: "David Kim",
      role: "CEO",
      company: "Solstice Creative",
      results: "40+ rescues • 36hr avg turnaround",
    },
  ];

  return (
    <section id="proof" className="border-t border-border bg-bg-elevated/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mx-auto mb-4">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Agency Partners
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            Agencies don't just use Livecheck. They build their handoff process around it.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Real agencies. Real margins. Real hours saved.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.author} testimonial={t} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}
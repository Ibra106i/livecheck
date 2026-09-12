import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What exactly does the $300 package include?',
    answer: 'The fixed package covers exactly five predefined technical fixes: SSL & DNS configuration, form action routing, mobile viewport fixes, core SEO meta tags, and page speed optimization. Each fix has a clear definition and acceptance criteria. Nothing else is included — no custom backend, no third-party API integrations, no design changes, no content updates.',
    category: 'Pricing',
  },
  {
    question: 'How does the pre-intake audit work?',
    answer: 'You submit the site URL and a few details. Our automated engine scans the site against 40+ checkpoints across the five fix categories, plus complexity flags (custom backend, e-commerce, hand-coded, multi-language). It returns a complexity score (0-100) and an instant accept/reject verdict. Sites scoring under 50 are auto-approved. Over 50 are auto-rejected with specific reasons. This happens in under 60 seconds — no human review required.',
    category: 'Process',
  },
  {
    question: 'What happens if my site gets rejected?',
    answer: 'Rejection means the site falls outside the fixed package scope — typically due to live payment processing, custom backend APIs, heavy hand-coding, or complex third-party integrations. You receive a detailed rejection report with specific reasons. You can then request a custom scoped engagement at our hourly rate ($185/hr), quoted in writing before any work begins. We never do open-ended "fix my site" work.',
    category: 'Process',
  },
  {
    question: 'How does white-labeling work?',
    answer: 'You configure your agency name, logo, accent color, and resale price once in the White-Label settings. Every certificate, status page, and client-facing touchpoint automatically inherits your branding. Livecheck never appears. Most partners resell the $300 base package at $425–$550, keeping the margin. Certificates are generated instantly on delivery with your branding.',
    category: 'White-Label',
  },
  {
    question: 'What\'s the typical turnaround time?',
    answer: '24–48 hours from audit approval to signed-off delivery. The automated patch script resolves ~80% of common issues within minutes. A rescue engineer then verifies the remaining edge cases and signs off. You get real-time progress updates in the dashboard. Complex sites at the upper end of the complexity range (40-50) may take the full 48 hours.',
    category: 'Timeline',
  },
  {
    question: 'Can I run audits myself without waiting for your team?',
    answer: 'Yes — our SaaS beta (coming soon) will give high-volume agencies self-serve access to the pre-intake scoring engine and automated patch scripts. You\'ll run audits and patches on-demand, generate white-label certificates in bulk, and manage team seats — all without our queue. Join the waitlist to get early access.',
    category: 'SaaS',
  },
  {
    question: 'What if the automated patch breaks something?',
    answer: 'The patch script only touches the five predefined fix areas. It never modifies business logic, custom code, or third-party integrations. Every change is verified by a human rescue engineer before sign-off. If anything regresses, we roll back and fix it within the same engagement — no extra charge. Our SLA covers the five fixes, period.',
    category: 'Quality',
  },
  {
    question: 'Do you work with DIY site owners or only agencies?',
    answer: 'Only agencies and AI dev shops. Livecheck is built for teams that build sites for clients — not for end clients directly. If you\'re a business owner with an AI-built site, ask your agency about Livecheck. If you\'re an agency, you\'re in the right place.',
    category: 'Partnership',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border bg-bg-elevated/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mx-auto mb-4">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            Everything you need to know before your first audit.
          </h2>
        </div>
        <div className="mx-auto mt-14 max-w-3xl space-y-4">
          {faqs.map((faq, i) => (
            <Card
              key={faq.question}
              className={cn(
                'overflow-hidden transition-all duration-300 animate-in',
                'hover:border-primary-border',
                `animate-in-delay-${Math.min(i + 1, 5)}`
              )}
              style={{ animationDelay: `${(i + 1) * 0.05}s` }}
            >
              <CardContent className="p-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left focus-ring"
                  aria-expanded={openIndex === i}
                >
                  <div className="flex-1 text-left">
                    {faq.category && (
                      <Badge variant="secondary" size="sm" className="mb-2">
                        {faq.category}
                      </Badge>
                    )}
                    <span className="font-semibold text-fg">{faq.question}</span>
                  </div>
                  {openIndex === i ? (
                    <ChevronUp className="h-5 w-5 text-primary transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-fg-subtle transition-transform duration-200" />
                  )}
                </button>
                {openIndex === i && (
                  <div className="border-t border-border px-6 pb-6 animate-in animate-in-delay-1">
                    <p className="text-fg-muted leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
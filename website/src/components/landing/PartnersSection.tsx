import { Building2, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PARTNER_NAMES = [
  'Northlight Digital',
  'Framewright Studio',
  'Launchpad Collective',
  'Bractive Agency',
  'Ironview Consulting',
  'Solstice Creative',
];

const benefits = [
  { title: 'Your brand, every touchpoint', desc: 'Logo, agency name, and accent color on every certificate and status update your client sees.' },
  { title: 'Set your own markup', desc: 'Most partners resell the $300 package at $425–$550 and keep the difference as pure margin.' },
  { title: 'Direct partnerships, not ads', desc: 'We work with AI dev shops and agencies directly — no public marketplace, no race to the bottom on price.' },
];

export function PartnersSection() {
  return (
    <section id="partners" className="border-b border-border bg-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="outline" className="mx-auto mb-4">
            <Building2 className="h-3 w-3" /> Partner Program
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            Resell the rescue. Keep the relationship.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            We stay invisible. Agencies and AI dev shops white-label Livecheck, mark up the $300
            package, and hand their client a branded completion certificate — never our name.
          </p>
        </motion.div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-bg text-primary">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-fg">{b.title}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{b.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-fg-subtle">Trusted by agencies & AI dev shops including</p>
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-50 transition-all duration-300 hover:opacity-100">
            {PARTNER_NAMES.map((name) => (
              <span key={name} className="text-sm font-semibold text-fg-muted transition-colors hover:text-fg">
                {name}
              </span>
            ))}
          </div>
          <Link to="/white-label" className="mt-8 inline-block">
            <Button variant="outline" size="lg">
              Explore the White-Label Program <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
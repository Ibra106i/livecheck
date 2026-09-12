import { Clock, BadgeCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { motion } from 'framer-motion';

export function ValueSection() {
  const benefits = [
    { icon: Clock, title: 'Hours back on the clock', desc: 'Agencies report reclaiming 18–30 hours of senior dev time per rescued site.' },
    { icon: BadgeCheck, title: 'Zero client headaches', desc: 'Clients get a clean, working site and a certificate — never a technical postmortem.' },
    { icon: TrendingUp, title: 'Margin, not overhead', desc: 'White-label markup turns a $300 cost center into a profitable line item on every project.' },
  ];

  return (
    <section className="border-b border-border bg-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
              We don't sell debugging. We sell back your billable hours.
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              Your team's time is worth more doing strategy, design, and client work than untangling
              a broken contact form at 6pm on a Friday. Livecheck exists so your senior devs never
              touch last-mile AI cleanup again.
            </p>
            <div className="mt-8 space-y-5">
              {benefits.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-fg">{item.title}</h4>
                    <p className="mt-0.5 text-sm text-fg-muted">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-primary-border bg-primary/5">
              <CardContent className="p-8">
                <div className="text-xs font-semibold uppercase tracking-widest text-fg-subtle">Sample agency math</div>
                <div className="mt-5 space-y-4">
                  {[
                    { label: 'Senior dev hourly rate', value: '$140/hr' },
                    { label: 'Avg. hours to manually rescue a site', value: '~22 hrs' },
                    { label: 'Manual cost to your agency', value: '$3,080' },
                    { label: 'Livecheck flat-fee package', value: '$300' },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0">
                      <span className="text-fg-muted">{r.label}</span>
                      <span className="font-semibold text-fg">{r.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-lg bg-primary-bg px-4 py-3">
                    <span className="text-sm font-medium text-primary">Hours saved, redeployed to billable work</span>
                    <span className="text-lg font-bold text-primary">$2,780</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
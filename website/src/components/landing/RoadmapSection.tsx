import { Gauge, Sparkles, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const plannedFeatures = [
  'Audit engine API access',
  'Unlimited automated patch runs',
  'Bulk white-label certificate export',
  'Team seats for your whole studio',
];

export function RoadmapSection() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [waitlistError, setWaitlistError] = useState('');

  const submitWaitlist = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail)) {
      setWaitlistError('Enter a valid work email to join the beta list.');
      return;
    }
    setWaitlistError('');
    setWaitlistState('loading');
    window.setTimeout(() => setWaitlistState('done'), 900);
  };

  return (
    <section id="roadmap" className="border-b border-border bg-bg-elevated/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-3 w-3" /> Coming Next
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
              From done-for-you service to a SaaS your team runs itself.
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              Today, our rescue engineers run the checklist for you. Next, we're productizing the
              exact same pre-intake scoring engine and patch scripts into a subscription tool — so
              high-volume agencies can run audits and auto-patches themselves, on-demand, without
              waiting on our queue.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-fg-muted">
              {[
                'Self-serve pre-intake scoring for unlimited sites',
                'One-click automated patch runs, no queue',
                'White-label certificates generated instantly, in bulk',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8" onClick={() => setWaitlistOpen(true)}>
              Join the SaaS Beta Waitlist
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-primary-border bg-primary/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-bg text-primary">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-fg">Livecheck SaaS — Self-Serve Console</div>
                    <div className="text-xs text-fg-muted">Private beta, invite-only for current partners</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {plannedFeatures.map((f) => (
                    <div key={f} className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-4 py-3 text-sm text-fg-muted">
                      {f} <Badge variant="secondary">Planned</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join the Livecheck SaaS beta</DialogTitle>
            <DialogDescription>
              We're onboarding a limited group of agency partners before public launch.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {waitlistState === 'done' ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-primary-border bg-primary-bg py-8 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-bg">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <p className="text-sm text-fg-muted">
                  You're on the list. We'll reach out at{' '}
                  <span className="font-medium text-fg">{waitlistEmail}</span> as
                  beta seats open up.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                  <Input
                    type="email"
                    placeholder="you@agency.com"
                    className="pl-9"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                  />
                </div>
                {waitlistError && <p className="text-xs text-danger">{waitlistError}</p>}
                <Button className="w-full" onClick={submitWaitlist} disabled={waitlistState === 'loading'}>
                  {waitlistState === 'loading' ? 'Submitting…' : 'Join the Waitlist'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Send,
  Smartphone,
  Search,
  Gauge,
  Sparkles,
  ScanSearch,
  Wrench,
  CircleUserRound,
  FileCheck2,
  Building2,
  TrendingUp,
  BadgeCheck,
  Clock,
  DollarSign,
  Ban,
  Mail,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { FIXES, PACKAGE_PRICE, CUSTOM_HOURLY_RATE } from '../lib/mockData';

const FIX_ICONS: Record<string, React.ElementType> = {
  ssl_dns: Lock,
  form_routing: Send,
  mobile_viewport: Smartphone,
  seo_meta: Search,
  page_speed: Gauge,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

const PARTNER_NAMES = [
  'Northlight Digital',
  'Framewright Studio',
  'Launchpad Collective',
  'Bractive Agency',
  'Ironview Consulting',
  'Solstice Creative',
];

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 15%, rgba(16,185,129,0.18), transparent 45%), radial-gradient(circle at 85% 0%, rgba(16,185,129,0.12), transparent 40%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto max-w-3xl text-center">
            <Badge className="mx-auto mb-6" variant="outline">
              <Building2 className="h-3 w-3" /> Built for agencies &amp; freelance dev shops, not DIY owners
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Your AI website builder gets you <span className="text-emerald-400">80% there.</span>
              <br />
              We close the last mile.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Livecheck is the productized rescue layer agencies plug in before handoff — five fixed
              technical fixes, an automation script that auto-patches most of it before a human ever
              looks, and a white-label SLA your clients never see you sweat over.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/audit">
                <Button size="lg" className="w-full sm:w-auto">
                  Start a Free Pre-Intake Audit <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See Agency Dashboard
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              No spec calls. No open-ended scoping. Instant automated accept/reject in under a minute.
            </p>
          </motion.div>

          <Reveal delay={0.15} className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '1,240+', label: 'AI-built sites rescued' },
              { value: '80%', label: 'Auto-patched before a human touches it' },
              { value: '36 hrs', label: 'Average turnaround' },
              { value: '$185/hr', label: 'Clear rate beyond scope' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-zinc-800 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AI ships the site. Your team eats the last 20%.
            </h2>
            <p className="mt-4 text-zinc-400">
              Every AI builder leaves the same handful of landmines behind — and they land on your
              billable hours, not the client's. It's unpredictable, unbudgeted work your team didn't
              price into the project.
            </p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: 'SSL warnings on launch day', desc: 'Client screenshots a "Not Secure" badge to you five minutes before their launch email goes out.' },
              { icon: Send, title: 'Forms that go nowhere', desc: 'The AI builder wired the contact form to a dead endpoint. Leads have been vanishing for weeks.' },
              { icon: Smartphone, title: 'Broken on mobile', desc: 'Looks perfect on the builder\'s desktop preview. Overflows and stacks wrong on an actual iPhone.' },
              { icon: Search, title: 'Invisible to Google', desc: 'No title tags, no meta descriptions, no Open Graph data. The site doesn\'t exist in search.' },
              { icon: Gauge, title: 'Slow, bloated pages', desc: 'Uncompressed hero images and unused scripts tank Core Web Vitals before the client even sees it.' },
              { icon: Clock, title: 'Un-billable firefighting', desc: 'Your devs burn hours on one-off fixes that were never scoped, quoted, or margin-positive.' },
            ].map((item) => (
              <Reveal key={item.title}>
                <Card className="h-full border-zinc-800 bg-zinc-900/40 transition-colors hover:border-zinc-700">
                  <CardContent className="p-6">
                    <item.icon className="h-8 w-8 text-red-400/80" />
                    <h3 className="mt-4 font-semibold text-zinc-100">{item.title}</h3>
                    <p className="mt-2 text-sm text-zinc-500">{item.desc}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THE FIX */}
      <section id="the-fix" className="border-b border-zinc-800 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mx-auto mb-4">
              <ShieldCheck className="h-3 w-3" /> The Rescue Package
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              One productized package. Five fixes. No scope creep.
            </h2>
            <p className="mt-4 text-zinc-400">
              We don't do open-ended "fix my site" engagements anymore. Livecheck covers exactly five
              predefined technical fixes — quoted, scoped, and delivered the same way every time.
            </p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {FIXES.map((fix, idx) => {
              const Icon = FIX_ICONS[fix.key];
              return (
                <Reveal key={fix.key} delay={idx * 0.05}>
                  <Card className="h-full border-zinc-800 bg-zinc-900/60">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                        Fix {idx + 1} of 5
                      </div>
                      <h3 className="mt-1 font-semibold text-zinc-100">{fix.label}</h3>
                      <p className="mt-2 text-sm text-zinc-500">{fix.description}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-zinc-800 bg-zinc-900/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From submission to signed-off deliverable
            </h2>
            <p className="mt-4 text-zinc-400">
              Automated where it can be. Human where it matters. Every project follows the same
              four-stage pipeline.
            </p>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-4">
            {[
              { icon: ScanSearch, title: 'Pre-Intake Audit', desc: 'Submit the URL. Our scoring engine instantly flags sites with custom backends, live payments, or hand-coded chaos — and rejects them before anyone wastes an hour.' },
              { icon: Wrench, title: 'Automated Patch Script', desc: 'For everything that qualifies, our script auto-resolves roughly 80% of the common AI deployment errors within minutes — SSL, redirects, meta tags, compression, and more.' },
              { icon: CircleUserRound, title: 'Human QA Sign-Off', desc: 'A rescue engineer verifies the remaining edge cases, confirms nothing regressed, and signs off on the deliverable.' },
              { icon: FileCheck2, title: 'White-Label SLA', desc: 'You receive a client-ready completion certificate under your own brand — proof of work, warranty terms, and zero technical explaining required.' },
            ].map((step, idx) => (
              <Reveal key={step.title} delay={idx * 0.08} className="relative">
                <div className="flex flex-col items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-xs font-bold text-zinc-600">STEP {idx + 1}</div>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-100">{step.title}</h3>
                  <p className="mt-2 text-sm text-zinc-500">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING / BOUNDARY */}
      <section id="pricing" className="border-b border-zinc-800 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            <Reveal className="lg:col-span-2">
              <Card className="h-full border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.07] to-transparent">
                <CardContent className="flex h-full flex-col p-8">
                  <Badge className="w-fit"><Sparkles className="h-3 w-3" /> Flat-Fee Package</Badge>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-5xl font-bold text-white">${PACKAGE_PRICE}</span>
                    <span className="pb-1 text-zinc-500">/ site</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">24–48 hour turnaround. One invoice, zero surprises.</p>
                  <ul className="mt-6 space-y-3">
                    {FIXES.map((f) => (
                      <li key={f.key} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {f.label}
                      </li>
                    ))}
                    <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> White-label completion
                      certificate for your client
                    </li>
                  </ul>
                  <Link to="/audit" className="mt-8">
                    <Button className="w-full" size="lg">
                      Start Pre-Intake Audit <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-3">
              <div className="flex h-full flex-col justify-center rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-8">
                <div className="flex items-center gap-2 text-amber-400">
                  <Ban className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">A hard boundary, on purpose</h3>
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  The $300 package covers exactly the five fixes above — nothing else. The moment a
                  project needs custom backend work or a complex third-party API integration (payment
                  gateways, CRMs, booking engines, inventory sync), it automatically triggers a separate
                  scoped engagement at our hourly rate.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <DollarSign className="h-8 w-8 text-amber-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">${CUSTOM_HOURLY_RATE}/hr</div>
                    <div className="text-xs text-zinc-500">Custom backend &amp; API integration work, quoted upfront in writing</div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-zinc-600">
                  This is why our pre-intake audit auto-rejects messy sites instead of letting a human
                  quote them by hand — no unprofitable rewrites, no scope creep, no margin surprises.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MESSAGING: HOURS SAVED */}
      <section className="border-b border-zinc-800 bg-zinc-900/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                We don't sell debugging. We sell back your billable hours.
              </h2>
              <p className="mt-4 text-zinc-400">
                Your team's time is worth more doing strategy, design, and client work than untangling
                a broken contact form at 6pm on a Friday. Livecheck exists so your senior devs never
                touch last-mile AI cleanup again.
              </p>
              <div className="mt-8 space-y-5">
                {[
                  { icon: Clock, title: 'Hours back on the clock', desc: 'Agencies report reclaiming 18–30 hours of senior dev time per rescued site.' },
                  { icon: BadgeCheck, title: 'Zero client headaches', desc: 'Clients get a clean, working site and a certificate — never a technical postmortem.' },
                  { icon: TrendingUp, title: 'Margin, not overhead', desc: 'White-label markup turns a $300 cost center into a profitable line item on every project.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-100">{item.title}</h4>
                      <p className="mt-0.5 text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardContent className="p-8">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sample agency math</div>
                  <div className="mt-5 space-y-4">
                    {[
                      { label: 'Senior dev hourly rate', value: '$140/hr' },
                      { label: 'Avg. hours to manually rescue a site', value: '~22 hrs' },
                      { label: 'Manual cost to your agency', value: '$3,080' },
                      { label: 'Livecheck flat-fee package', value: '$300' },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between border-b border-zinc-800 pb-3 text-sm last:border-0">
                        <span className="text-zinc-500">{r.label}</span>
                        <span className="font-semibold text-zinc-200">{r.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-4 py-3">
                      <span className="text-sm font-medium text-emerald-300">Hours saved, redeployed to billable work</span>
                      <span className="text-lg font-bold text-emerald-400">$2,780</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHITE LABEL / PARTNERS */}
      <section id="partners" className="border-b border-zinc-800 bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mx-auto mb-4">
              <Building2 className="h-3 w-3" /> Partner Program
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Resell the rescue. Keep the relationship.
            </h2>
            <p className="mt-4 text-zinc-400">
              We stay invisible. Agencies and AI dev shops white-label Livecheck, mark up the $300
              package, and hand their client a branded completion certificate — never our name.
            </p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              { title: 'Your brand, every touchpoint', desc: 'Logo, agency name, and accent color on every certificate and status update your client sees.' },
              { title: 'Set your own markup', desc: 'Most partners resell the $300 package at $425–$550 and keep the difference as pure margin.' },
              { title: 'Direct partnerships, not ads', desc: 'We work with AI dev shops and agencies directly — no public marketplace, no race to the bottom on price.' },
            ].map((b) => (
              <Reveal key={b.title}>
                <Card className="h-full border-zinc-800 bg-zinc-900/40">
                  <CardContent className="p-6">
                    <BadgeCheck className="h-6 w-6 text-emerald-400" />
                    <h3 className="mt-3 font-semibold text-zinc-100">{b.title}</h3>
                    <p className="mt-2 text-sm text-zinc-500">{b.desc}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15} className="mt-14 text-center">
            <p className="text-xs uppercase tracking-widest text-zinc-600">Trusted by agencies &amp; AI dev shops including</p>
            <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
              {PARTNER_NAMES.map((name) => (
                <span key={name} className="text-sm font-semibold text-zinc-500">{name}</span>
              ))}
            </div>
            <Link to="/white-label" className="mt-8 inline-block">
              <Button variant="outline" size="lg">
                Explore the White-Label Program <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="border-b border-zinc-800 bg-zinc-900/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <Badge variant="outline" className="mb-4"><Sparkles className="h-3 w-3" /> Coming Next</Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                From done-for-you service to a SaaS your team runs itself.
              </h2>
              <p className="mt-4 text-zinc-400">
                Today, our rescue engineers run the checklist for you. Next, we're productizing the
                exact same pre-intake scoring engine and patch scripts into a subscription tool — so
                high-volume agencies can run audits and auto-patches themselves, on-demand, without
                waiting on our queue.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Self-serve pre-intake scoring for unlimited sites</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> One-click automated patch runs, no queue</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> White-label certificates generated instantly, in bulk</li>
              </ul>
              <Button size="lg" className="mt-8" onClick={() => setWaitlistOpen(true)}>
                Join the SaaS Beta Waitlist
              </Button>
            </Reveal>
            <Reveal delay={0.1}>
              <Card className="border-zinc-800 bg-zinc-900/60">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Gauge className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">Livecheck SaaS — Self-Serve Console</div>
                      <div className="text-xs text-zinc-500">Private beta, invite-only for current partners</div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {['Audit engine API access', 'Unlimited automated patch runs', 'Bulk white-label certificate export', 'Team seats for your whole studio'].map((f) => (
                      <div key={f} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
                        {f} <Badge variant="secondary">Planned</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stop absorbing the last mile for free.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Run your next AI-built site through a 60-second pre-intake audit and see exactly what
              ships, what's rejected, and what it costs — before you commit a single billable hour.
            </p>
            <Link to="/audit" className="mt-8 inline-block">
              <Button size="lg">
                Start a Free Pre-Intake Audit <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />

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
              <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 py-8 text-center">
                <BadgeCheck className="h-8 w-8 text-emerald-400" />
                <p className="text-sm text-zinc-300">
                  You're on the list. We'll reach out at <span className="font-medium text-white">{waitlistEmail}</span> as
                  beta seats open up.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="email"
                    placeholder="you@agency.com"
                    className="pl-9"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                  />
                </div>
                {waitlistError && <p className="text-xs text-red-400">{waitlistError}</p>}
                <Button className="w-full" onClick={submitWaitlist} disabled={waitlistState === 'loading'}>
                  {waitlistState === 'loading' ? 'Submitting\u2026' : 'Join the Waitlist'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

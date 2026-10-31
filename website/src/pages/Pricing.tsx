import { Link } from 'react-router-dom';
import { Check, Smartphone, ShieldCheck, Star } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface Offering {
  name: string;
  price: string;
  cadence?: string;
  blurb: string;
  perks: string[];
  featured?: boolean;
}

interface Group {
  eyebrow: string;
  title: string;
  items: Offering[];
}

const GROUPS: Group[] = [
  {
    eyebrow: 'Pay as you go',
    title: 'Scan credits',
    items: [
      {
        name: 'Single scan',
        price: '$9.99',
        blurb: 'One technical audit of a live URL.',
        perks: ['Full 0–100 report', 'DNS, SSL, SEO, headers, mobile, speed', 'Shareable report link'],
      },
      {
        name: '5 scans',
        price: '$29.99',
        blurb: 'A small pack for an agency or a launch.',
        perks: ['5 credits, never expire', 'Infrastructure failures auto-refund', 'Best for occasional checks'],
        featured: true,
      },
      {
        name: '20 scans',
        price: '$99.99',
        blurb: 'Volume for client work.',
        perks: ['20 credits, never expire', 'Lowest cost per scan', 'Report history on your org'],
      },
    ],
  },
  {
    eyebrow: 'Continuous monitoring',
    title: 'Subscriptions',
    items: [
      {
        name: 'Weekly',
        price: '$19.99',
        cadence: '/mo',
        blurb: 'Watch up to 5 sites once a week.',
        perks: ['5 sites', 'Weekly scheduled scans', 'Drift alerts on score drops'],
      },
      {
        name: 'Daily',
        price: '$79.99',
        cadence: '/mo',
        blurb: 'Watch up to 25 sites every day.',
        perks: ['25 sites', 'Daily scheduled scans', 'Drift alerts and full history'],
      },
    ],
  },
  {
    eyebrow: 'Human review',
    title: 'Expert reports',
    items: [
      {
        name: 'Standard',
        price: '$149',
        blurb: 'One URL, reviewed and annotated by a specialist.',
        perks: ['Per-check notes and fix guidance', 'Delivered in 5 business days', 'Analysis only — no remediation'],
      },
      {
        name: 'Priority',
        price: '$249',
        blurb: 'The same review, turned around faster.',
        perks: ['Per-check notes and fix guidance', 'Delivered in 2 business days', 'Refundable before review starts'],
      },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-ink text-slate-200">
      <Navbar />
      <main id="main" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] text-cyan">
            <Star className="h-3.5 w-3.5" aria-hidden="true" /> Free first scan
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">Launch-ready reports for client sites</h1>
          <p className="mt-4 text-[15px] leading-7 text-slate-400">
            Every audit is a real technical scan, not a checklist you fill in by hand. Buy credits, monitor continuously,
            or have a specialist review a site — then share the report with your client.
          </p>
        </header>

        <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-cyan/25 bg-cyan/[0.05] px-4 py-3 text-sm text-slate-300">
          <Smartphone className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
          <p>
            Purchases happen in the Livecheck Android app through Google Play. The website is a viewer — there is no
            checkout here.
          </p>
        </div>

        {GROUPS.map((group) => (
          <section key={group.title} className="mt-14">
            <div className="mb-6">
              <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-500">{group.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{group.title}</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {group.items.map((item) => (
                <article
                  key={item.name}
                  className={`flex flex-col rounded-2xl border bg-panel p-6 ${
                    item.featured ? 'border-cyan/40 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]' : 'border-line'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.blurb}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{item.price}</span>
                    {item.cadence && <span className="text-sm text-slate-500">{item.cadence}</span>}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {item.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-16 rounded-2xl border border-line bg-panel p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-white">How buying works</h2>
              <ul className="mt-3 space-y-2 text-[14px] leading-6 text-slate-400">
                <li>
                  Credits never expire. A scan uses one credit; if a scan fails because of our infrastructure the credit
                  is refunded automatically. An unreachable or bot-blocked site still produces a valid failure report and
                  uses the credit.
                </li>
                <li>
                  Unused credits and expert reviews are refundable before the work starts. Read the{' '}
                  <Link to="/legal/refunds" className="text-cyan hover:underline">refund policy</Link>.
                </li>
                <li>
                  Expert review covers one URL and the standard check groups — analysis and written guidance only, never
                  remediation. Turnaround is defined in the{' '}
                  <Link to="/legal/sla" className="text-cyan hover:underline">SLA</Link>.
                </li>
                <li>
                  Monitoring subscriptions renew through Google Play; canceling disables scheduled scans but keeps your
                  history.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

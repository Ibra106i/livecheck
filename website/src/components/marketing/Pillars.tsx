import type { ReactNode } from 'react';
import { Check, Globe, Gauge, Lock, Search, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Reveal } from './Reveal';
import {
  DNS_ROWS,
  HEADER_CHECKS,
  MOBILE_FACTS,
  SEO_CHECKS,
  SPEED_METRICS,
  SSL_FACTS,
} from '../../lib/sampleAudit';

type PillarCardProps = {
  title: string;
  accent: string;
  glow: string;
  icon: ReactNode;
  summary: string;
  children: ReactNode;
  className?: string;
  delay?: number;
};

function PillarCard({ title, accent, glow, icon, summary, children, className, delay = 0 }: PillarCardProps) {
  return (
    <Reveal className={className} delay={delay}>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel p-5 transition-colors duration-300 hover:border-white/20 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glow }}
        />
        <div className="relative flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-socket"
            style={{ color: accent }}
          >
            {icon}
          </span>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        </div>
        <p className="relative mt-3 text-sm leading-6 text-slate-300">{summary}</p>
        <div className="relative mt-5 flex-1">{children}</div>
      </article>
    </Reveal>
  );
}

function StatusIcon({ status }: { status: 'pass' | 'warn' | 'fail' | 'skip' }) {
  if (status === 'pass') {
    return <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-pass" />;
  }
  if (status === 'skip') {
    return <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />;
  }
  return (
    <TriangleAlert
      aria-hidden="true"
      className={cn('h-3.5 w-3.5 shrink-0', status === 'warn' ? 'text-warn' : 'text-red-400')}
    />
  );
}

const DNS_ACCENT = '#22d3ee';
const SSL_ACCENT = '#34d399';
const HEADERS_ACCENT = '#fbbf24';
const SPEED_ACCENT = '#00f2fe';
const MOBILE_ACCENT = '#c084fc';
const SEO_ACCENT = '#818cf8';

export function Pillars() {
  return (
    <section id="pillars" className="scroll-mt-24 border-b border-line bg-ink-alt py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-cyan-400">Diagnostics</p>
          <h2 className="mt-3 text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-white sm:text-[40px] sm:leading-[48px]">
            Six things that break quietly after a deploy.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Every group returns individual checks marked PASS, WARN, FAIL, SKIP or BLOCKED. Passing
            checks earn full weight, warnings earn half, and skipped checks are excluded — the total
            is normalised to a 0–100 score.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          <PillarCard
            title="DNS & Domain"
            accent={DNS_ACCENT}
            glow="radial-gradient(120% 100% at 0% 0%, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0) 60%)"
            icon={<Globe className="h-4 w-4" />}
            summary="Resolves the A and AAAA records behind the hostname, then checks whether the www subdomain answers as well."
            className="md:col-span-2"
          >
            <ul className="space-y-2">
              {DNS_ROWS.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-2 rounded-lg border border-line bg-socket px-3 py-2 font-mono text-[12px]"
                >
                  <span className="text-slate-400">{row.record}</span>
                  <span className="text-slate-300">{row.label}</span>
                  <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: DNS_ACCENT }} />
                </li>
              ))}
            </ul>
          </PillarCard>

          <PillarCard
            title="SSL / TLS"
            accent={SSL_ACCENT}
            glow="radial-gradient(120% 100% at 100% 0%, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0) 60%)"
            icon={<Lock className="h-4 w-4" />}
            summary="Opens a real TLS handshake, validates the presented chain against public trust stores, and reads the expiry date."
            className="md:col-span-4"
            delay={60}
          >
            <div className="rounded-lg border border-line bg-socket p-3">
              <div className="flex items-center justify-between font-mono text-[12px]">
                <span className="text-slate-400">certificate expiry</span>
                <span className="text-slate-200">
                  {SSL_FACTS.expiryDays} days left
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round((SSL_FACTS.expiryDays / 90) * 100)}%`, background: SSL_ACCENT }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[12px] text-slate-400">
                <span>handshake ok</span>
                <span className="text-warn">warn under {SSL_FACTS.warnBelowDays} days</span>
              </div>
            </div>
          </PillarCard>

          <PillarCard
            title="Security Headers"
            accent={HEADERS_ACCENT}
            glow="radial-gradient(120% 100% at 50% 0%, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0) 60%)"
            icon={<ShieldCheck className="h-4 w-4" />}
            summary="Reads the response headers for HSTS, nosniff, CSP, clickjacking protection and compression."
            className="md:col-span-3"
            delay={120}
          >
            <ul className="space-y-1.5">
              {HEADER_CHECKS.map((header) => (
                <li key={header.name} className="flex items-center gap-2 font-mono text-[12px]">
                  <StatusIcon status={header.status} />
                  <span className="min-w-0 flex-1 truncate text-slate-300">{header.name}</span>
                  <span className={cn('shrink-0', header.status === 'pass' ? 'text-slate-400' : 'text-warn')}>
                    {header.value}
                  </span>
                </li>
              ))}
            </ul>
          </PillarCard>

          <PillarCard
            title="Speed"
            accent={SPEED_ACCENT}
            glow="radial-gradient(120% 100% at 50% 0%, rgba(0,242,254,0.10) 0%, rgba(0,242,254,0) 60%)"
            icon={<Gauge className="h-4 w-4" />}
            summary="Measures time to first byte, full page load and total transfer size in Chromium. Add --lighthouse for a Lighthouse score."
            className="md:col-span-3"
            delay={180}
          >
            <div className="space-y-2">
              {SPEED_METRICS.map((metric) => (
                <div key={metric.label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                  <span className="font-mono text-[12px] text-slate-400">{metric.label}</span>
                  <span className="font-mono text-[13px] text-white">{metric.value}</span>
                  <span className="font-mono text-[12px] text-slate-400">{metric.note}</span>
                </div>
              ))}
            </div>
          </PillarCard>

          <PillarCard
            title="Mobile Layout"
            accent={MOBILE_ACCENT}
            glow="radial-gradient(120% 100% at 0% 0%, rgba(192,132,252,0.14) 0%, rgba(192,132,252,0) 60%)"
            icon={<Smartphone className="h-4 w-4" />}
            summary="Loads the page at 375 px in an iPhone profile, checks width=device-width and measures horizontal overflow."
            className="md:col-span-2"
            delay={240}
          >
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-[88px] w-[50px] shrink-0 items-center justify-center rounded-[10px] border bg-socket p-1"
                style={{ borderColor: 'rgba(192,132,252,0.45)' }}
              >
                <div
                  className="h-full w-full rounded-[7px] border border-dashed"
                  style={{ borderColor: 'rgba(192,132,252,0.35)' }}
                />
              </div>
              <div className="space-y-1 font-mono text-[12px]">
                <p className="text-slate-400">viewport 375 × 667</p>
                <p className="text-pass">{MOBILE_FACTS.overflowPx} px overflow</p>
                <p className="text-slate-400">width=device-width</p>
              </div>
            </div>
          </PillarCard>

          <PillarCard
            title="SEO & Metadata"
            accent={SEO_ACCENT}
            glow="radial-gradient(120% 100% at 100% 0%, rgba(129,140,248,0.12) 0%, rgba(129,140,248,0) 60%)"
            icon={<Search className="h-4 w-4" />}
            summary="Checks title length, meta description, og:title and og:image, a single h1, the html lang attribute and the favicon."
            className="md:col-span-4"
            delay={300}
          >
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SEO_CHECKS.map((check) => (
                <li
                  key={check}
                  className="flex items-center gap-2 rounded-lg border border-line bg-socket px-3 py-2 font-mono text-[12px] text-slate-300"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: SEO_ACCENT }}
                  />
                  {check}
                </li>
              ))}
            </ul>
          </PillarCard>
        </div>

        <Reveal className="mt-6" delay={60}>
          <p className="text-sm leading-6 text-slate-400">
            There is also a Forms group — submission targets, submit controls and field labeling — plus
            an opt-in submission probe with{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-slate-200">--probe-forms</code>,
            off unless you ask for it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

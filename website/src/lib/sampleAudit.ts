/**
 * Real output captured from `node dist/cli.js https://livechecks.vercel.app`
 * on 23 Oct 2026 (v0.3.0, Chromium installed). The marketing site labels this
 * as example output; nothing here is aspirational.
 */

export const SAMPLE_HOST = 'livechecks.vercel.app';
export const SAMPLE_URL = 'https://livechecks.vercel.app/';
export const SAMPLE_SCORE = 90;
export const SAMPLE_VERDICT = 'Launch-ready';
export const SAMPLE_SUMMARY = { pass: 16, fail: 0, warn: 5, skip: 1, blocked: 0 };

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

export type TerminalRow = {
  label: string;
  status: CheckStatus;
  detail: string;
};

/** One row per check group, in the order `renderTerminal()` prints them. */
export const SAMPLE_ROWS: TerminalRow[] = [
  { label: 'DNS & Domain', status: 'pass', detail: 'A/AAAA resolves · www resolves' },
  { label: 'SSL / TLS', status: 'pass', detail: 'Trusted chain · expires in 35 days' },
  { label: 'HTTP Headers', status: 'warn', detail: '2 passed · 3 warnings' },
  { label: 'SEO & Metadata', status: 'warn', detail: '4 passed · 2 warnings' },
  { label: 'Mobile', status: 'pass', detail: 'Viewport ok · 0px overflow at 375px' },
  { label: 'Speed', status: 'pass', detail: 'TTFB 308 ms · load 805 ms · 422 KB' },
];

export const HEADER_CHECKS: Array<{ name: string; status: CheckStatus; value: string }> = [
  { name: 'HSTS', status: 'pass', value: 'max-age=63072000' },
  { name: 'X-Content-Type-Options', status: 'warn', value: 'not set' },
  { name: 'Content-Security-Policy', status: 'warn', value: 'not set' },
  { name: 'Clickjacking', status: 'warn', value: 'not set' },
  { name: 'Compression', status: 'pass', value: 'br' },
];

export const SPEED_METRICS: Array<{ label: string; value: string; note: string }> = [
  { label: 'TTFB', value: '308 ms', note: 'pass under 800 ms' },
  { label: 'Full load', value: '805 ms', note: 'pass under 3 s' },
  { label: 'Transfer', value: '422 KB', note: '35 requests' },
];

export const SEO_CHECKS = [
  'title length',
  'meta description',
  'og:title + og:image',
  'single <h1>',
  'html lang',
  'favicon',
];

export const DNS_ROWS = [
  { record: 'A / AAAA', label: 'domain resolves' },
  { record: 'A / AAAA', label: 'www subdomain resolves' },
];

export const SSL_FACTS = {
  expiryDays: 35,
  warnBelowDays: 14,
  issuer: 'Public trust store chain',
};

export const MOBILE_FACTS = {
  viewport: 'width=device-width, initial-scale=1.0',
  width: 375,
  overflowPx: 0,
};

import { describe, expect, it } from 'vitest';
import { analyzeHtml } from '../src/checks/seo';

const GOOD_HTML = `<!doctype html>
<html lang="en">
<head>
  <title>Acme Plumbing - Emergency Repairs in Austin</title>
  <meta name="description" content="24/7 emergency plumbing repairs in Austin TX. Licensed plumbers, upfront pricing, and a two-hour response guarantee.">
  <meta property="og:title" content="Acme Plumbing">
  <meta property="og:image" content="https://acme.example/og.png">
  <link rel="icon" href="/favicon.ico">
</head>
<body><h1>Emergency plumbing in Austin</h1></body>
</html>`;

const BAD_HTML = `<!doctype html>
<html>
<head><title>x</title></head>
<body><h1>One</h1><h1>Two</h1></body>
</html>`;

describe('analyzeHtml', () => {
  it('passes a well-formed page', () => {
    const results = analyzeHtml(GOOD_HTML);
    const byId = new Map(results.map((r) => [r.id, r]));
    expect(byId.get('seo-title')).toMatchObject({ status: 'pass' });
    expect(byId.get('seo-description')).toMatchObject({ status: 'pass' });
    expect(byId.get('seo-social')).toMatchObject({ status: 'pass' });
    expect(byId.get('seo-h1')).toMatchObject({ status: 'pass' });
    expect(byId.get('seo-lang')).toMatchObject({ status: 'pass' });
    expect(byId.get('seo-favicon')).toMatchObject({ status: 'pass' });
  });

  it('flags a short title as a warning', () => {
    const title = analyzeHtml(BAD_HTML).find((r) => r.id === 'seo-title');
    expect(title?.status).toBe('warn');
  });

  it('warns on missing meta description', () => {
    const description = analyzeHtml(BAD_HTML).find((r) => r.id === 'seo-description');
    expect(description?.status).toBe('warn');
  });

  it('warns on missing social tags', () => {
    const social = analyzeHtml(BAD_HTML).find((r) => r.id === 'seo-social');
    expect(social?.status).toBe('warn');
    expect(social?.detail).toContain('og:title');
    expect(social?.detail).toContain('og:image');
  });

  it('warns on multiple h1 elements', () => {
    const h1 = analyzeHtml(BAD_HTML).find((r) => r.id === 'seo-h1');
    expect(h1?.status).toBe('warn');
    expect(h1?.detail).toContain('2 <h1>');
  });

  it('warns on missing lang attribute and favicon', () => {
    const results = analyzeHtml(BAD_HTML);
    expect(results.find((r) => r.id === 'seo-lang')?.status).toBe('warn');
    expect(results.find((r) => r.id === 'seo-favicon')?.status).toBe('warn');
  });
});

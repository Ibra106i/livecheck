import dns from 'dns';
import https from 'https';
import http from 'http';
import { load as cheerioLoad } from 'cheerio';

export interface ScanResult {
  ssl: {
    valid: boolean;
    issuer?: string;
    expiresAt?: string;
    daysUntilExpiry?: number;
    error?: string;
  };
  dns: {
    resolved: boolean;
    records?: string[];
    error?: string;
  };
  seo: {
    hasTitle: boolean;
    titleLength: number;
    hasMetaDescription: boolean;
    metaDescriptionLength: number;
    hasCanonical: boolean;
    hasOgTags: boolean;
    hasRobotsTxt: boolean;
    issues: string[];
  };
  viewport: {
    hasViewportMeta: boolean;
    content?: string;
    issues: string[];
  };
  performance: {
    loadTimeMs?: number;
    totalSizeBytes?: number;
    resourceCount?: number;
    issues: string[];
  };
 _forms: {
    formCount: number;
    formsWithAction: number;
    deadEndpoints: string[];
    issues: string[];
  };
}

function checkSSL(url: string): Promise<ScanResult['ssl']> {
  return new Promise((resolve) => {
    const hostname = new URL(url).hostname;
    const req = https.request(
      {
        hostname,
        port: 443,
        method: 'HEAD',
        timeout: 10000,
        rejectUnauthorized: false,
      },
      (res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cert = (res.socket as any)?.getPeerCertificate?.();
        if (!cert || !cert.valid_from) {
          resolve({ valid: false, error: 'No certificate returned' });
          return;
        }
        const expiresAt = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        resolve({
          valid: res.statusCode !== undefined && res.statusCode < 400,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
          expiresAt: expiresAt.toISOString(),
          daysUntilExpiry,
        });
      }
    );
    req.on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: false, error: 'Connection timed out' });
    });
    req.end();
  });
}

function checkDNS(url: string): Promise<ScanResult['dns']> {
  return new Promise((resolve) => {
    const hostname = new URL(url).hostname;
    dns.resolve4(hostname, (err, addresses) => {
      if (err) {
        resolve({ resolved: false, error: err.message });
        return;
      }
      resolve({ resolved: true, records: addresses });
    });
  });
}

function fetchHtml(url: string): Promise<{ html: string; loadTimeMs: number; totalSizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'LivecheckBot/1.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf-8');
        resolve({
          html,
          loadTimeMs: Date.now() - startTime,
          totalSizeBytes: Buffer.byteLength(html),
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

function checkSEO(html: string): ScanResult['seo'] {
  const $ = cheerioLoad(html);
  const issues: string[] = [];

  const title = $('title').first().text().trim();
  const hasTitle = title.length > 0;
  const titleLength = title.length;
  if (!hasTitle) issues.push('Missing <title> tag');
  else if (titleLength < 30) issues.push('Title tag is too short (under 30 chars)');
  else if (titleLength > 60) issues.push('Title tag is too long (over 60 chars)');

  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
  const hasMetaDescription = metaDesc.length > 0;
  const metaDescriptionLength = metaDesc.length;
  if (!hasMetaDescription) issues.push('Missing meta description');
  else if (metaDescriptionLength < 70) issues.push('Meta description is too short (under 70 chars)');
  else if (metaDescriptionLength > 160) issues.push('Meta description is too long (over 160 chars)');

  const canonical = $('link[rel="canonical"]').attr('href');
  const hasCanonical = !!canonical;
  if (!hasCanonical) issues.push('Missing canonical tag');

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const hasOgTags = !!(ogTitle && ogDesc && ogImage);
  if (!hasOgTags) {
    const missing = [];
    if (!ogTitle) missing.push('og:title');
    if (!ogDesc) missing.push('og:description');
    if (!ogImage) missing.push('og:image');
    issues.push(`Missing Open Graph tags: ${missing.join(', ')}`);
  }

  const h1Count = $('h1').length;
  if (h1Count === 0) issues.push('Missing H1 tag');
  else if (h1Count > 1) issues.push(`Multiple H1 tags found (${h1Count})`);

  return {
    hasTitle,
    titleLength,
    hasMetaDescription,
    metaDescriptionLength,
    hasCanonical,
    hasOgTags,
    hasRobotsTxt: false, // checked separately
    issues,
  };
}

function checkViewport(html: string): ScanResult['viewport'] {
  const $ = cheerioLoad(html);
  const viewportMeta = $('meta[name="viewport"]').attr('content');
  const issues: string[] = [];

  if (!viewportMeta) {
    issues.push('Missing viewport meta tag');
    return { hasViewportMeta: false, issues };
  }

  if (!viewportMeta.includes('width=device-width')) {
    issues.push('Viewport does not set width=device-width');
  }
  if (!viewportMeta.includes('initial-scale=1')) {
    issues.push('Viewport does not set initial-scale=1');
  }

  return { hasViewportMeta: true, content: viewportMeta, issues };
}

function checkForms(html: string): ScanResult['_forms'] {
  const $ = cheerioLoad(html);
  const forms = $('form');
  const issues: string[] = [];
  const deadEndpoints: string[] = [];
  let formsWithAction = 0;

  forms.each((_, el) => {
    const action = $(el).attr('action');
    if (action && action !== '#' && action !== '' && !action.startsWith('javascript:')) {
      formsWithAction++;
    } else if (!action || action === '#' || action === '') {
      deadEndpoints.push(action || '(no action)');
    }
  });

  if (forms.length > 0 && formsWithAction === 0) {
    issues.push('All forms have missing or dead action endpoints');
  }

  return {
    formCount: forms.length,
    formsWithAction,
    deadEndpoints,
    issues,
  };
}

async function checkPerformance(url: string, html: string): Promise<ScanResult['performance']> {
  const $ = cheerioLoad(html);
  const issues: string[] = [];

  const scripts = $('script[src]').length;
  const stylesheets = $('link[rel="stylesheet"]').length;
  const images = $('img').length;
  const resourceCount = scripts + stylesheets + images;

  if (scripts > 10) issues.push(`High script count: ${scripts} external scripts`);
  if (images > 20) issues.push(`High image count: ${images} images`);

  const unoptimizedImages = $('img:not([loading="lazy"])').length;
  if (unoptimizedImages > 3) issues.push(`${unoptimizedImages} images missing lazy loading`);

  const renderBlocking = $('link[rel="stylesheet"]:not([media="print"])').length +
    $('script:not([async]):not([defer])').length;
  if (renderBlocking > 3) issues.push(`${renderBlocking} potentially render-blocking resources`);

  return {
    resourceCount,
    issues,
  };
}

export async function scanWebsite(url: string): Promise<ScanResult> {
  if (!url.startsWith('http')) url = 'https://' + url;

  const [ssl, dnsResult] = await Promise.all([checkSSL(url), checkDNS(url)]);

  let seo: ScanResult['seo'] = { hasTitle: false, titleLength: 0, hasMetaDescription: false, metaDescriptionLength: 0, hasCanonical: false, hasOgTags: false, hasRobotsTxt: false, issues: ['Failed to fetch page'] };
  let viewport: ScanResult['viewport'] = { hasViewportMeta: false, issues: ['Failed to fetch page'] };
  let performance: ScanResult['performance'] = { issues: ['Failed to fetch page'] };
  let _forms: ScanResult['_forms'] = { formCount: 0, formsWithAction: 0, deadEndpoints: [], issues: [] };

  try {
    const { html, loadTimeMs, totalSizeBytes } = await fetchHtml(url);
    seo = checkSEO(html);
    viewport = checkViewport(html);
    _forms = checkForms(html);
    performance = await checkPerformance(url, html);
    performance.loadTimeMs = loadTimeMs;
    performance.totalSizeBytes = totalSizeBytes;

    if (loadTimeMs > 3000) performance.issues.push(`Slow initial load: ${loadTimeMs}ms`);
    if (totalSizeBytes > 500000) performance.issues.push(`Large page size: ${(totalSizeBytes / 1024).toFixed(0)}KB`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    performance.issues.push(`Failed to fetch: ${message}`);
  }

  try {
    const robotsController = new AbortController();
    const robotsTimeout = setTimeout(() => robotsController.abort(), 5000);
    const robotsRes = await fetch('https://' + new URL(url).hostname + '/robots.txt', { signal: robotsController.signal });
    clearTimeout(robotsTimeout);
    seo.hasRobotsTxt = robotsRes.ok;
  } catch {
    seo.hasRobotsTxt = false;
  }

  return { ssl, dns: dnsResult, seo, viewport, performance, _forms };
}

export function calculateScore(result: ScanResult): number {
  let score = 0;
  const checks = [
    { pass: result.ssl.valid, weight: 20 },
    { pass: result.dns.resolved, weight: 15 },
    { pass: result.seo.hasTitle, weight: 10 },
    { pass: result.seo.titleLength >= 30 && result.seo.titleLength <= 60, weight: 5 },
    { pass: result.seo.hasMetaDescription, weight: 10 },
    { pass: result.seo.metaDescriptionLength >= 70 && result.seo.metaDescriptionLength <= 160, weight: 5 },
    { pass: result.seo.hasCanonical, weight: 5 },
    { pass: result.seo.hasOgTags, weight: 5 },
    { pass: result.seo.hasRobotsTxt, weight: 5 },
    { pass: result.viewport.hasViewportMeta, weight: 10 },
    { pass: result.performance.loadTimeMs !== undefined && result.performance.loadTimeMs < 3000, weight: 5 },
    { pass: result._forms.deadEndpoints.length === 0, weight: 5 },
  ];

  for (const check of checks) {
    if (check.pass) score += check.weight;
  }

  return Math.min(100, score);
}

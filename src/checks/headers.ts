import type { Check, CheckContext, CheckResult } from '../core/types';

export function analyzeHeaders(headers: Headers): CheckResult[] {
  const results: CheckResult[] = [];

  const hsts = headers.get('strict-transport-security');
  results.push({
    id: 'headers-hsts',
    title: 'HSTS',
    group: 'headers',
    status: hsts ? 'pass' : 'warn',
    detail: hsts ?? 'Browsers may be downgraded to plain HTTP on repeat visits',
  });

  const xcto = (headers.get('x-content-type-options') ?? '').toLowerCase();
  results.push({
    id: 'headers-xcto',
    title: 'X-Content-Type-Options',
    group: 'headers',
    status: xcto === 'nosniff' ? 'pass' : 'warn',
    detail:
      xcto === 'nosniff'
        ? 'nosniff set'
        : 'MIME-sniffing not disabled — browsers may reinterpret file types',
  });

  const csp = headers.get('content-security-policy');
  results.push({
    id: 'headers-csp',
    title: 'Content-Security-Policy',
    group: 'headers',
    status: csp ? 'pass' : 'warn',
    detail: csp ?? 'No CSP header — injected scripts execute without restriction',
  });

  const frameOptions = (headers.get('x-frame-options') ?? '').toUpperCase();
  const cspFrame = (csp ?? '').toLowerCase().includes('frame-ancestors');
  results.push({
    id: 'headers-framing',
    title: 'Clickjacking protection',
    group: 'headers',
    status: frameOptions || cspFrame ? 'pass' : 'warn',
    detail:
      frameOptions || cspFrame
        ? frameOptions || 'frame-ancestors directive set'
        : 'Site can be embedded in third-party iframes',
  });

  const encoding = (headers.get('content-encoding') ?? '').toLowerCase();
  const compressed = /gzip|br|deflate|zstd/.test(encoding);
  results.push({
    id: 'headers-compression',
    title: 'Response compression',
    group: 'headers',
    status: compressed ? 'pass' : 'warn',
    detail: compressed
      ? `Content served with ${encoding}`
      : 'Uncompressed responses waste mobile data and slow first paint',
  });

  return results;
}

export const headersCheck: Check = {
  id: 'headers',
  title: 'HTTP Headers',
  group: 'headers',
  requiresBrowser: false,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    if (ctx.page.status === 0) {
      return [
        {
          id: 'headers-skipped',
          title: 'HTTP Headers',
          group: 'headers',
          status: 'skip',
          detail: 'No response headers captured',
        },
      ];
    }
    return analyzeHeaders(ctx.page.headers);
  },
};

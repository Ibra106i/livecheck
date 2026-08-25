import { describe, expect, it } from 'vitest';
import { analyzeHeaders } from '../src/checks/headers';

function headersFrom(record: Record<string, string>): Headers {
  return new Headers(record);
}

describe('analyzeHeaders', () => {
  it('passes a fully secured response', () => {
    const results = analyzeHeaders(
      headersFrom({
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'self'",
        'x-frame-options': 'DENY',
        'content-encoding': 'br',
      })
    );
    expect(results.every((r) => r.status === 'pass')).toBe(true);
  });

  it('warns when security headers are absent', () => {
    const results = analyzeHeaders(headersFrom({ 'content-type': 'text/html' }));
    expect(results.find((r) => r.id === 'headers-hsts')?.status).toBe('warn');
    expect(results.find((r) => r.id === 'headers-xcto')?.status).toBe('warn');
    expect(results.find((r) => r.id === 'headers-csp')?.status).toBe('warn');
    expect(results.find((r) => r.id === 'headers-framing')?.status).toBe('warn');
    expect(results.find((r) => r.id === 'headers-compression')?.status).toBe('warn');
  });

  it('accepts CSP frame-ancestors as clickjacking protection', () => {
    const results = analyzeHeaders(
      headersFrom({ 'content-security-policy': "frame-ancestors 'none'" })
    );
    expect(results.find((r) => r.id === 'headers-framing')?.status).toBe('pass');
  });
});

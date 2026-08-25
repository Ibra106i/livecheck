import { describe, expect, it } from 'vitest';
import { runAudit } from '../src/core/runner';

const enabled = process.env.LIVECHECK_SMOKE === '1';

describe.skipIf(!enabled)('smoke: live audit', () => {
  it('audits example.com end to end', { timeout: 120000 }, async () => {
    const report = await runAudit('https://example.com', {
      probeForms: false,
      useLighthouse: false,
      timeoutMs: 30000,
    });

    expect(report.url).toBe('https://example.com/');
    expect(report.score).toBeGreaterThan(0);
    expect(report.results.length).toBeGreaterThan(5);

    const reachability = report.results.find((r) => r.id === 'site-reachable');
    expect(reachability?.status).toBe('pass');

    const dns = report.results.find((r) => r.id === 'dns-resolves');
    expect(dns?.status).toBe('pass');
  });
});

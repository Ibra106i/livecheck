import type { Check, CheckContext, CheckResult } from '../core/types';

interface SpeedMetrics {
  ttfbMs: number;
  loadMs: number;
  transferKb: number;
  requests: number;
}

async function lighthousePerformanceScore(url: string): Promise<number | null> {
  try {
    const lhName = 'lighthouse';
    const clName = 'chrome-launcher';
    const lh = (await import(lhName)) as {
      default: (
        target: string,
        opts: Record<string, unknown>
      ) => Promise<{ lhr?: { categories?: { performance?: { score?: number | null } } } }>;
    };
    const cl = (await import(clName)) as {
      default: {
        launch(opts: Record<string, unknown>): Promise<{ port: number; kill(): Promise<void> }>;
      };
    };
    const chrome = await cl.default.launch({ chromeFlags: ['--headless=new'] });
    try {
      const result = await lh.default(url, {
        port: chrome.port,
        onlyCategories: ['performance'],
        output: 'json',
        logLevel: 'error',
      });
      const score = result.lhr?.categories?.performance?.score;
      return typeof score === 'number' ? Math.round(score * 100) : null;
    } finally {
      await chrome.kill();
    }
  } catch {
    return null;
  }
}

export const speedCheck: Check = {
  id: 'speed',
  title: 'Speed',
  group: 'speed',
  requiresBrowser: true,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    if (!ctx.browser) {
      return [
        {
          id: 'speed-skipped',
          title: 'Load performance',
          group: 'speed',
          status: 'skip',
          detail: 'Chromium unavailable — run: npx playwright install chromium',
        },
      ];
    }

    const context = await ctx.browser.newContext();
    const page = await context.newPage();
    try {
      const started = Date.now();
      try {
        await page.goto(ctx.url.toString(), { waitUntil: 'networkidle', timeout: ctx.timeoutMs });
      } catch {
        await page.goto(ctx.url.toString(), { waitUntil: 'load', timeout: ctx.timeoutMs });
      }
      const wallClockLoadMs = Date.now() - started;

      const metrics = (await page.evaluate(() => {
        const entries = performance.getEntriesByType(
          'navigation'
        ) as PerformanceNavigationTiming[];
        const resources = performance.getEntriesByType(
          'resource'
        ) as PerformanceResourceTiming[];
        const nav = entries[0];
        const transferBytes =
          resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) +
          (nav?.transferSize || 0);
        return {
          ttfbMs: nav ? Math.round(nav.responseStart) : 0,
          loadMs: nav && nav.loadEventEnd > 0 ? Math.round(nav.loadEventEnd) : 0,
          transferKb: Math.round(transferBytes / 1024),
          requests: resources.length + 1,
        };
      })) as SpeedMetrics;

      if (!metrics.loadMs) metrics.loadMs = wallClockLoadMs;

      const results: CheckResult[] = [
        {
          id: 'speed-ttfb',
          title: 'Time to first byte',
          group: 'speed',
          status: metrics.ttfbMs < 800 ? 'pass' : metrics.ttfbMs < 1800 ? 'warn' : 'fail',
          weight: 2,
          detail:
            metrics.ttfbMs > 0
              ? `${metrics.ttfbMs} ms`
              : `Timing API unavailable; full load measured at ${metrics.loadMs} ms`,
        },
        {
          id: 'speed-load',
          title: 'Full page load',
          group: 'speed',
          status: metrics.loadMs < 3000 ? 'pass' : metrics.loadMs < 6000 ? 'warn' : 'fail',
          detail: `${metrics.loadMs} ms`,
        },
        {
          id: 'speed-weight',
          title: 'Page weight',
          group: 'speed',
          status:
            metrics.transferKb < 2500 ? 'pass' : metrics.transferKb < 6000 ? 'warn' : 'fail',
          detail: `${metrics.transferKb} KB transferred across ${metrics.requests} request(s)`,
        },
      ];

      if (ctx.useLighthouse) {
        const score = await lighthousePerformanceScore(ctx.url.toString());
        results.push(
          score === null
            ? {
                id: 'speed-lighthouse',
                title: 'Lighthouse performance',
                group: 'speed',
                status: 'skip',
                detail: 'Install lighthouse to enable: npm i -D lighthouse chrome-launcher',
              }
            : {
                id: 'speed-lighthouse',
                title: 'Lighthouse performance',
                group: 'speed',
                status: score >= 90 ? 'pass' : score >= 50 ? 'warn' : 'fail',
                weight: 2,
                detail: `Performance score ${score}/100`,
              }
        );
      }

      return results;
    } finally {
      await context.close();
    }
  },
};

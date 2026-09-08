import dns from 'node:dns/promises';
import net from 'node:net';
import type { Check, CheckContext, CheckResult, PageLike } from '../core/types';
import { isRestrictedIpv4, isRestrictedIpv6 } from '../core/ssrf';

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

interface BrowserContextWithRoute {
  route(pattern: string, handler: (route: { request: () => { url: () => string }; abort: (errorCode?: string) => void; continue: () => void }) => Promise<void>): Promise<void>;
}

export async function openMobilePage(ctx: CheckContext): Promise<PageLike | null> {
  if (!ctx.browser) return null;
  const context = await ctx.browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: MOBILE_USER_AGENT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await setupSsrfRouteBlocking(context);
  return context.newPage();
}

export async function setupSsrfRouteBlocking(context: BrowserContextWithRoute) {
  await context.route('**/*', async (route) => {
    const target = new URL(route.request().url());
    const hostname = target.hostname.startsWith('[') && target.hostname.endsWith(']')
      ? target.hostname.slice(1, -1)
      : target.hostname;
    if (net.isIP(hostname)) {
      const restricted = net.isIP(hostname) === 6
        ? isRestrictedIpv6(hostname)
        : isRestrictedIpv4(hostname);
      if (restricted) {
        return route.abort('blockedbyclient');
      }
    }
    try {
      const addresses = await dns.lookup(target.hostname, { all: true, verbatim: true });
      const allRestricted = addresses.every((a) =>
        a.family === 4 ? isRestrictedIpv4(a.address) : isRestrictedIpv6(a.address)
      );
      if (allRestricted) {
        return route.abort('blockedbyclient');
      }
    } catch {
      return route.abort('failed');
    }
    return route.continue();
  });
}

export const mobileCheck: Check = {
  id: 'mobile',
  title: 'Mobile',
  group: 'mobile',
  requiresBrowser: true,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    if (ctx.page.isBlocked) {
      return [
        {
          id: 'mobile-blocked',
          title: 'Mobile',
          group: 'mobile',
          status: 'blocked',
          detail: 'Scan incomplete — anti-bot protection detected, content checks skipped.',
        },
      ];
    }

    if (!ctx.browser) {
      return [
        {
          id: 'mobile-skipped',
          title: 'Mobile responsiveness',
          group: 'mobile',
          status: 'skip',
          detail: 'Chromium unavailable — run: npx playwright install chromium',
        },
      ];
    }

    const page = await openMobilePage(ctx);
    if (!page) {
      return [
        { id: 'mobile-skipped', title: 'Mobile responsiveness', group: 'mobile', status: 'skip' },
      ];
    }

    try {
      await load(page, ctx.url.toString(), ctx.timeoutMs);

      const viewportMeta = await page.evaluate(() => {
        return (
          document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? ''
        );
      });
      const hasDeviceWidth = viewportMeta.includes('width=device-width');

      const overflowPx = await page.evaluate(() => {
        const scrolling = document.scrollingElement ?? document.documentElement;
        const bodyWidth = document.body ? document.body.scrollWidth : 0;
        return Math.max(scrolling.scrollWidth, bodyWidth) - window.innerWidth;
      });

      const results: CheckResult[] = [
        {
          id: 'mobile-viewport',
          title: 'Viewport meta tag',
          group: 'mobile',
          status: hasDeviceWidth ? 'pass' : 'fail',
          weight: 2,
          detail: hasDeviceWidth
            ? viewportMeta
            : 'Missing width=device-width — phones render a zoomed-out desktop layout',
        },
        {
          id: 'mobile-overflow',
          title: 'No horizontal overflow at 375px',
          group: 'mobile',
          status: overflowPx <= 8 ? 'pass' : overflowPx <= 40 ? 'warn' : 'fail',
          weight: 2,
          detail:
            overflowPx <= 8
              ? `Content fits the viewport (${overflowPx}px slack)`
              : `Content overflows by ${overflowPx}px — users must scroll sideways`,
        },
      ];
      return results;
    } finally {
      await page.close();
    }
  },
};

async function load(page: PageLike, url: string, timeoutMs: number): Promise<void> {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
  }
}

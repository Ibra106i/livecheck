import type { Check, CheckContext, CheckResult, PageLike } from '../core/types';

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export async function openMobilePage(ctx: CheckContext): Promise<PageLike | null> {
  if (!ctx.browser) return null;
  const context = await ctx.browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: MOBILE_USER_AGENT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  return context.newPage();
}

export const mobileCheck: Check = {
  id: 'mobile',
  title: 'Mobile',
  group: 'mobile',
  requiresBrowser: true,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
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

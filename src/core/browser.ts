import type { BrowserLike } from './types';

export async function launchBrowser(): Promise<BrowserLike | null> {
  try {
    const specifier = 'playwright';
    const playwright = (await import(specifier)) as {
      chromium: { launch(options?: Record<string, unknown>): Promise<BrowserLike> };
    };
    return await playwright.chromium.launch({ headless: true });
  } catch {
    return null;
  }
}

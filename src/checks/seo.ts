import * as cheerio from 'cheerio';
import type { Check, CheckContext, CheckResult } from '../core/types';

export function analyzeHtml(html: string): CheckResult[] {
  const $ = cheerio.load(html);
  const results: CheckResult[] = [];

  const title = $('head title').first().text().trim();
  if (!title) {
    results.push({
      id: 'seo-title',
      title: 'Page title',
      group: 'seo',
      status: 'fail',
      weight: 2,
      detail: 'No <title> element found',
    });
  } else if (title.length < 15 || title.length > 65) {
    results.push({
      id: 'seo-title',
      title: 'Page title',
      group: 'seo',
      status: 'warn',
      detail: `"${title}" is ${title.length} characters (ideal range is 15–65)`,
    });
  } else {
    results.push({
      id: 'seo-title',
      title: 'Page title',
      group: 'seo',
      status: 'pass',
      detail: `"${title}"`,
    });
  }

  const description = ($('meta[name="description"]').attr('content') ?? '').trim();
  if (!description) {
    results.push({
      id: 'seo-description',
      title: 'Meta description',
      group: 'seo',
      status: 'warn',
      detail: 'Search engines will invent their own snippet for this page',
    });
  } else if (description.length > 160) {
    results.push({
      id: 'seo-description',
      title: 'Meta description',
      group: 'seo',
      status: 'warn',
      detail: `${description.length} characters — search engines truncate around 160`,
    });
  } else {
    results.push({
      id: 'seo-description',
      title: 'Meta description',
      group: 'seo',
      status: 'pass',
      detail: description,
    });
  }

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const missing: string[] = [];
  if (!ogTitle) missing.push('og:title');
  if (!ogImage) missing.push('og:image');
  results.push({
    id: 'seo-social',
    title: 'Social share tags',
    group: 'seo',
    status: missing.length === 0 ? 'pass' : 'warn',
    detail:
      missing.length === 0
        ? 'og:title and og:image present'
        : `Links shared on social apps render as bare URLs (missing ${missing.join(', ')})`,
  });

  const h1Count = $('h1').length;
  results.push({
    id: 'seo-h1',
    title: 'Single <h1>',
    group: 'seo',
    status: h1Count === 1 ? 'pass' : 'warn',
    detail:
      h1Count === 0
        ? 'No <h1> heading found'
        : h1Count === 1
          ? $('h1').first().text().trim()
          : `${h1Count} <h1> elements dilute heading hierarchy`,
  });

  const lang = $('html').attr('lang');
  results.push({
    id: 'seo-lang',
    title: 'Document language',
    group: 'seo',
    status: lang ? 'pass' : 'warn',
    detail: lang ? `lang="${lang}"` : '<html> has no lang attribute — screen readers guess',
  });

  const favicon =
    $('link[rel~="icon"]').attr('href') ?? $('link[rel="shortcut icon"]').attr('href');
  results.push({
    id: 'seo-favicon',
    title: 'Favicon',
    group: 'seo',
    status: favicon ? 'pass' : 'warn',
    detail: favicon ? favicon : 'No favicon declared — browser tabs show a blank icon',
  });

  return results;
}

export const seoCheck: Check = {
  id: 'seo',
  title: 'SEO & Metadata',
  group: 'seo',
  requiresBrowser: false,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    if (!ctx.page.html.trim()) {
      return [
        {
          id: 'seo-skipped',
          title: 'SEO & Metadata',
          group: 'seo',
          status: 'skip',
          detail: 'Page HTML unavailable',
        },
      ];
    }
    return analyzeHtml(ctx.page.html);
  },
};

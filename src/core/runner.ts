import { dnsCheck } from '../checks/dns';
import { formsCheck } from '../checks/forms';
import { headersCheck } from '../checks/headers';
import { mobileCheck } from '../checks/mobile';
import { seoCheck } from '../checks/seo';
import { speedCheck } from '../checks/speed';
import { sslCheck } from '../checks/ssl';
import { launchBrowser } from './browser';
import { fetchPage, normalizeUrl } from './http';
import { computeScore, summarize } from './scoring';
import type {
  AuditOptions,
  AuditReport,
  Check,
  CheckContext,
  CheckResult,
  FetchedPage,
} from './types';

const CHECKS: Check[] = [
  dnsCheck,
  sslCheck,
  headersCheck,
  seoCheck,
  mobileCheck,
  formsCheck,
  speedCheck,
];

export async function runAudit(rawUrl: string, opts: AuditOptions): Promise<AuditReport> {
  const url = normalizeUrl(rawUrl);
  const startedAt = new Date();

  const browser = await launchBrowser();
  const page = await safeFetch(url, opts.timeoutMs);

  const ctx: CheckContext = {
    url,
    timeoutMs: opts.timeoutMs,
    probeForms: opts.probeForms,
    useLighthouse: opts.useLighthouse,
    browser,
    page,
  };

  const results: CheckResult[] = [reachabilityResult(url.toString(), page)];

  try {
    for (const check of CHECKS) {
      try {
        results.push(...(await check.run(ctx)));
      } catch (error) {
        results.push({
          id: `${check.id}-crashed`,
          title: check.title,
          group: check.group,
          status: 'warn',
          detail: `Check could not complete: ${errorMessage(error)}`,
        });
      }
    }
  } finally {
    await browser?.close();
  }

  return {
    url: url.toString(),
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    score: computeScore(results),
    summary: summarize(results),
    results,
  };
}

async function safeFetch(url: URL, timeoutMs: number): Promise<FetchedPage> {
  try {
    return await fetchPage(url, timeoutMs);
  } catch {
    return { status: 0, headers: new Headers(), html: '', ttfbMs: 0 };
  }
}

function reachabilityResult(url: string, page: FetchedPage): CheckResult {
  if (page.status === 0) {
    return {
      id: 'site-reachable',
      title: 'Site reachable',
      group: 'general',
      status: 'fail',
      weight: 2,
      detail: `${url} did not respond`,
    };
  }
  return {
    id: 'site-reachable',
    title: 'Site reachable',
    group: 'general',
    status: page.status < 400 ? 'pass' : 'fail',
    detail: `${page.status} ${page.status < 400 ? '' : '— visitors see an error page'}`.trim(),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

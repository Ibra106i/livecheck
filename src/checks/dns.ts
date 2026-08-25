import { promises as dnsPromises } from 'node:dns';
import type { Check, CheckContext, CheckResult } from '../core/types';

async function tryResolve(hostname: string): Promise<string[]> {
  try {
    return await dnsPromises.resolve4(hostname);
  } catch {
    try {
      return await dnsPromises.resolve6(hostname);
    } catch {
      const fallback = await osLookup(hostname);
      return fallback ? [fallback] : [];
    }
  }
}

async function osLookup(hostname: string): Promise<string | null> {
  try {
    const result = await dnsPromises.lookup(hostname);
    return result.address;
  } catch {
    return null;
  }
}

export const dnsCheck: Check = {
  id: 'dns',
  title: 'DNS',
  group: 'dns',
  requiresBrowser: false,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const host = ctx.url.hostname;
    const records = await tryResolve(host);
    const results: CheckResult[] = [
      {
        id: 'dns-resolves',
        title: 'Domain resolves',
        group: 'dns',
        status: records.length > 0 ? 'pass' : 'fail',
        detail:
          records.length > 0
            ? `${host} -> ${records.join(', ')}`
            : `${host} has no A or AAAA records`,
      },
    ];
    if (!host.startsWith('www.')) {
      const wwwRecords = await tryResolve(`www.${host}`);
      results.push({
        id: 'dns-www',
        title: 'www subdomain resolves',
        group: 'dns',
        status: wwwRecords.length > 0 ? 'pass' : 'warn',
        detail:
          wwwRecords.length > 0
            ? `www.${host} -> ${wwwRecords.join(', ')}`
            : `www.${host} does not resolve — visitors typing "www." hit a dead end`,
      });
    }
    return results;
  },
};

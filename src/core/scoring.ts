import type { CheckResult, ReportSummary } from './types';

export function computeScore(results: CheckResult[]): number {
  let earned = 0;
  let possible = 0;
  for (const result of results) {
    if (result.status === 'skip') continue;
    const weight = result.weight ?? 1;
    possible += weight;
    if (result.status === 'pass') earned += weight;
    else if (result.status === 'warn') earned += weight * 0.5;
  }
  if (possible === 0) return 100;
  return Math.round((earned / possible) * 100);
}

export function summarize(results: CheckResult[]): ReportSummary {
  const summary: ReportSummary = { pass: 0, fail: 0, warn: 0, skip: 0 };
  for (const result of results) summary[result.status] += 1;
  return summary;
}

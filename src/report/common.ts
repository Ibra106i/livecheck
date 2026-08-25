import type { AuditReport, CheckGroup, CheckResult } from '../core/types';

export const GROUP_LABELS: Record<CheckGroup, string> = {
  general: 'General',
  dns: 'DNS & Domain',
  ssl: 'SSL / TLS',
  headers: 'HTTP Headers',
  seo: 'SEO & Metadata',
  mobile: 'Mobile',
  forms: 'Forms',
  speed: 'Speed',
};

const GROUP_ORDER: CheckGroup[] = [
  'general',
  'dns',
  'ssl',
  'headers',
  'seo',
  'mobile',
  'forms',
  'speed',
];

export function groupResults(report: AuditReport): Array<[CheckGroup, CheckResult[]]> {
  const grouped = new Map<CheckGroup, CheckResult[]>();
  for (const result of report.results) {
    const bucket = grouped.get(result.group) ?? [];
    bucket.push(result);
    grouped.set(result.group, bucket);
  }
  return GROUP_ORDER.filter((group) => grouped.has(group)).map(
    (group) => [group, grouped.get(group) as CheckResult[]] as [CheckGroup, CheckResult[]]
  );
}

export function scoreVerdict(score: number): string {
  if (score >= 90) return 'Launch-ready';
  if (score >= 70) return 'Minor issues before launch';
  if (score >= 50) return 'Needs work before launch';
  return 'Not ready for visitors';
}

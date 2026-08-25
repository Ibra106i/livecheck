import type { AuditReport } from '../core/types';

export function renderJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

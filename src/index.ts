// Programmatic engine export so the website worker runs the exact same scan as
// the CLI (plan sections 7 and 12: single engine, guaranteed score parity).
// Form probing is intentionally OFF here — the app never actively submits forms.

import { runAudit } from './core/runner';
import type { AuditOptions, AuditReport } from './core/types';

export { runAudit };
export type { AuditOptions, AuditReport };
export type {
  CheckStatus,
  CheckGroup,
  CheckResult,
  ReportSummary,
} from './core/types';

export const DEFAULT_ENGINE_OPTIONS: AuditOptions = {
  probeForms: false,
  useLighthouse: false,
  timeoutMs: 20000,
};

/** Run a standard Livecheck scan against a URL with the CLI's default options. */
export async function scanWebsite(url: string, overrides?: Partial<AuditOptions>): Promise<AuditReport> {
  return runAudit(url, { ...DEFAULT_ENGINE_OPTIONS, ...overrides });
}

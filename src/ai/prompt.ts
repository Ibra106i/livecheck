import type { AuditReport, CheckResult } from '../core/types';

export interface PromptBundle {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = [
  'You are the report analyst for Livecheck, a website audit tool.',
  'You explain technical audit results to non-technical site owners.',
  '',
  'OUTPUT FORMAT - follow this markdown template exactly, section by section:',
  '',
  '# Livecheck Audit Report',
  '',
  '## Summary',
  'Two or three sentences describing overall site health and the single biggest risk.',
  '',
  '## Issues Found',
  'One subsection per finding, using the exact titles and numbering given in the input:',
  '',
  '### <number>. <check title> [CRITICAL or WARNING]',
  "**What's wrong:** one or two sentences.",
  '**Why it matters:** business impact in plain language.',
  '**How to fix:** concrete numbered steps. Include short code snippets or exact settings where useful.',
  '',
  '## What Passed',
  'A plain bullet list, one line per passing check, no elaboration.',
  '',
  '## Priority Action Plan',
  'A numbered checklist of the issues, most important first.',
  '',
  'HARD RULES:',
  '- Cover EVERY finding from the input, in the given order and numbering. Skip none.',
  '- Never invent issues that are not in the input.',
  '- The severity tag must match the input status exactly: FAIL means [CRITICAL], WARN means [WARNING]. Never escalate.',
  '- No markdown tables. No emojis. Headings and bullet lists only.',
  '- Maximum 120 words per issue.',
].join('\n');

const GROUP_ORDER: Record<string, number> = {
  general: 0,
  dns: 1,
  ssl: 2,
  headers: 3,
  seo: 4,
  mobile: 5,
  forms: 6,
  speed: 7,
};

const STATUS_RANK: Record<string, number> = {
  fail: 0,
  warn: 1,
};

export function sortFindings(results: CheckResult[]): CheckResult[] {
  return results
    .filter((r) => r.status === 'fail' || r.status === 'warn')
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        (b.weight ?? 1) - (a.weight ?? 1) ||
        (GROUP_ORDER[a.group] ?? 99) - (GROUP_ORDER[b.group] ?? 99)
    );
}

export function buildPrompt(report: AuditReport): PromptBundle {
  const findings = sortFindings(report.results);

  const findingsBlock = findings.length
    ? findings
        .map((result, index) => {
          const severity = result.status === 'fail' ? 'CRITICAL' : 'WARNING';
          const detail = result.detail ? `: ${result.detail}` : '';
          return `${index + 1}. [${severity}] ${result.title}${detail}`;
        })
        .join('\n')
    : '(none - every check passed)';

  const passed = report.results.filter((r) => r.status === 'pass');
  const passedBlock = passed.length
    ? passed.map((r) => `- ${r.title}`).join('\n')
    : '(nothing passed)';

  const user = [
    `Site: ${report.url}`,
    `Overall score: ${report.score}/100`,
    `Summary counts: ${report.summary.pass} passed, ${report.summary.fail} failed, ${report.summary.warn} warnings.`,
    '',
    'Findings, already ordered by priority - keep this order and numbering:',
    findingsBlock,
    '',
    'Checks that passed:',
    passedBlock,
    '',
    'Write the report now using the exact template.',
  ].join('\n');

  return { system: SYSTEM_PROMPT, user };
}

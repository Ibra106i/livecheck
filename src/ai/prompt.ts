import type { AuditReport } from '../core/types';

export interface PromptBundle {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = [
  'You are the report analyst for Livecheck, a website audit tool.',
  'You explain technical audit results to non-technical site owners.',
  'Rules:',
  '- Explain ONLY issues present in the provided data; never invent findings.',
  '- For each issue state: what is wrong, why it matters in business terms, and the concrete fix.',
  '- Be specific about fixes (exact tag names, settings, or steps) but concise.',
  '- End with a short prioritized fix order.',
  '- Output GitHub-flavored markdown. No preamble, no closing pleasantries.',
].join('\n');

export function buildPrompt(report: AuditReport): PromptBundle {
  const findings = report.results
    .filter((result) => result.status === 'fail' || result.status === 'warn')
    .map(
      (result) =>
        `- [${result.status.toUpperCase()}] ${result.title}${result.detail ? `: ${result.detail}` : ''}`
    )
    .join('\n');

  const skipped = report.results.filter((r) => r.status === 'skip').length;

  const user = [
    `Site: ${report.url}`,
    `Overall score: ${report.score}/100`,
    `Summary: ${report.summary.pass} passed, ${report.summary.fail} failed, ${report.summary.warn} warnings${skipped > 0 ? `, ${skipped} skipped` : ''}`,
    '',
    'Findings needing explanation:',
    findings || '(none - everything checked passed)',
    '',
    'Write the analysis.',
  ].join('\n');

  return { system: SYSTEM_PROMPT, user };
}

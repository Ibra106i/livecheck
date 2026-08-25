import pc from 'picocolors';
import type { AuditReport, CheckResult, CheckStatus } from '../core/types';
import { GROUP_LABELS, groupResults, scoreVerdict } from './common';

function statusLabel(status: CheckStatus): string {
  switch (status) {
    case 'pass':
      return pc.green('PASS');
    case 'fail':
      return pc.red('FAIL');
    case 'warn':
      return pc.yellow('WARN');
    case 'skip':
      return pc.dim('SKIP');
  }
}

export function renderTerminal(report: AuditReport): string[] {
  const lines: string[] = [];
  const host = safeHost(report.url);

  lines.push('');
  lines.push(pc.bold(`  LIVECHECK AUDIT`));
  lines.push(pc.dim(`  ${host}  (${report.url})`));
  lines.push('');

  const scoreColor =
    report.score >= 90 ? pc.green : report.score >= 50 ? pc.yellow : pc.red;
  lines.push(
    `  Score: ${scoreColor(`${report.score}/100`)} ${pc.dim('—')} ${scoreVerdict(report.score)}`
  );
  lines.push('');

  for (const [group, results] of groupResults(report)) {
    lines.push(pc.bold(pc.cyan(`  ${GROUP_LABELS[group]}`)));
    for (const result of results) {
      const title = result.title.padEnd(Math.max(28, result.title.length + 1));
      lines.push(`    ${statusLabel(result.status)}  ${title}${pc.dim(result.detail ?? '')}`);
    }
    lines.push('');
  }

  const { pass, fail, warn, skip } = report.summary;
  lines.push(
    `  ${pc.green(`${pass} passed`)}  ${pc.red(`${fail} failed`)}  ${pc.yellow(`${warn} warnings`)}  ${pc.dim(`${skip} skipped`)}`
  );
  lines.push(pc.dim(`  Checked ${report.startedAt}`));
  lines.push('');
  return lines;
}

export function renderPlain(report: AuditReport): string[] {
  const lines: string[] = [];
  for (const [, results] of groupResults(report)) {
    for (const result of results) {
      lines.push(formatPlain(result));
    }
  }
  lines.push(`Score ${report.score}/100 — ${safeHost(report.url)}`);
  return lines;
}

function formatPlain(result: CheckResult): string {
  const symbol =
    result.status === 'pass'
      ? '\u2713'
      : result.status === 'fail'
        ? '\u2717'
        : result.status === 'warn'
          ? '\u26A0'
          : '-';
  const detail = result.detail ? ` — ${result.detail}` : '';
  return `  ${symbol} ${result.title}${detail}`;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

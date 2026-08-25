import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import { runAudit } from './core/runner';
import { renderJson } from './report/json';
import { renderMarkdown } from './report/markdown';
import { renderTerminal } from './report/terminal';
import type { AuditReport } from './core/types';

export const VERSION = '0.1.0';

interface CliOptions {
  json?: boolean;
  out?: string;
  probeForms?: boolean;
  lighthouse?: boolean;
  timeout?: string;
}

const program = new Command();

program
  .name('livecheck')
  .description('Audit a deployed website against the Livecheck technical checklist.')
  .version(VERSION)
  .argument('<url>', 'URL of the site to audit')
  .option('--json', 'print the report as JSON instead of the terminal view')
  .option('-o, --out <dir>', 'save markdown and JSON reports to this directory')
  .option('--probe-forms', 'actively submit the first form found (default: passive analysis)')
  .option('--lighthouse', 'include a Lighthouse performance score if lighthouse is installed')
  .option('-t, --timeout <ms>', 'per-check timeout in milliseconds', '20000')
  .action(async (urlArg: string, options: CliOptions) => {
    const timeoutMs = Number(options.timeout ?? 20000);
    try {
      const report = await runAudit(urlArg, {
        probeForms: options.probeForms ?? false,
        useLighthouse: options.lighthouse ?? false,
        timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000,
      });

      let savedPaths: string[] = [];
      if (options.out) {
        savedPaths = saveReports(report, options.out);
      }

      if (options.json) {
        process.stdout.write(renderJson(report) + '\n');
      } else {
        for (const line of renderTerminal(report)) console.log(line);
        for (const saved of savedPaths) console.log(pc.dim(`  Report saved: ${saved}`));
      }

      const hasFailures = report.results.some((result) => result.status === 'fail');
      process.exitCode = hasFailures ? 1 : 0;
    } catch (error) {
      console.error(pc.red(`livecheck: ${errorMessage(error)}`));
      process.exitCode = 2;
    }
  });

function saveReports(report: AuditReport, outDir: string): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const host = safeHost(report.url).replace(/[^a-z0-9.-]/gi, '_');
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const base = path.join(outDir, `livecheck-${host}-${stamp}`);
  const mdPath = `${base}.md`;
  const jsonPath = `${base}.json`;
  fs.writeFileSync(mdPath, renderMarkdown(report), 'utf8');
  fs.writeFileSync(jsonPath, renderJson(report), 'utf8');
  return [mdPath, jsonPath];
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

await program.parseAsync(process.argv);

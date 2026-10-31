// Standalone scan worker (plan section 7). Imports the exact engine the CLI
// uses, so a worker scan and a CLI scan on the same site produce the same
// score. Deployed as one always-on container (Fly.io / Cloud Run / Railway);
// N concurrent claim loops bound throughput, with a hard per-job timeout.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { scanWebsite, type AuditReport } from 'livechecks';
import { sendPush, sendEmail } from './notify';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 2);
const POLL_MS = Number(process.env.WORKER_POLL_MS || 3000);
const JOB_TIMEOUT_MS = Number(process.env.WORKER_JOB_TIMEOUT_MS || 90_000);
const MAX_ATTEMPTS = Number(process.env.WORKER_MAX_ATTEMPTS || 2);

let supabase: SupabaseClient;

interface ScanJob {
  id: string;
  organization_id: string;
  user_id: string;
  site_id: string | null;
  url: string;
  attempts: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`scan timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function claimJob(): Promise<ScanJob | null> {
  const { data, error } = await supabase.rpc('claim_scan_job');
  if (error) {
    console.error('claim_scan_job failed:', error.message);
    return null;
  }
  const rows = (data as ScanJob[]) || [];
  return rows[0] || null;
}

async function recordReport(job: ScanJob, report: AuditReport): Promise<string | null> {
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: job.user_id,
      organization_id: job.organization_id,
      site_id: job.site_id,
      scan_job_id: job.id,
      token,
      url: report.url,
      score: report.score,
      summary: `Livecheck score ${report.score}/100`,
      results: report,
      generated_by: 'worker',
      visibility: 'private',
    })
    .select('token')
    .single();
  if (error) {
    console.error('report insert failed:', error.message);
    return null;
  }
  return (data?.token as string) ?? token;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

async function getDeviceTokens(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('device_tokens').select('token').eq('user_id', userId);
  if (error) {
    console.error('device token lookup failed:', error.message);
    return [];
  }
  return ((data as { token: string }[]) || []).map((row) => row.token);
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  return (data?.email as string) || null;
}

function failedCheckIds(report: AuditReport): string[] {
  return report.results.filter((r) => r.status === 'fail').map((r) => r.id);
}

async function detectDrift(job: ScanJob, report: AuditReport): Promise<void> {
  if (!job.site_id) return;
  const { data: prevRows } = await supabase
    .from('scan_jobs')
    .select('id, score, result')
    .eq('site_id', job.site_id)
    .eq('status', 'done')
    .neq('id', job.id)
    .order('finished_at', { ascending: false })
    .limit(1);
  const prev = prevRows?.[0] as { score: number | null; result: AuditReport | null } | undefined;
  if (!prev) return;

  const scoreDrop = (prev.score ?? 0) - report.score;
  const prevFails = prev.result ? new Set(failedCheckIds(prev.result)) : new Set<string>();
  const newFailures = failedCheckIds(report).filter((id) => !prevFails.has(id));

  if (scoreDrop >= 5 || newFailures.length > 0) {
    const { data: inserted, error } = await supabase
      .from('drift_events')
      .insert({
        site_id: job.site_id,
        previous_score: prev.score,
        current_score: report.score,
        new_failures: newFailures,
      })
      .select('id')
      .single();
    if (error) {
      console.error('drift insert failed:', error.message);
      return;
    }
    await alertDrift(job, hostOf(report.url), prev.score ?? 0, report.score, newFailures);
    if (inserted?.id) {
      await supabase.from('drift_events').update({ notified_at: new Date().toISOString() }).eq('id', inserted.id);
    }
  }
}

async function alertDrift(
  job: ScanJob,
  host: string,
  previousScore: number,
  currentScore: number,
  newFailures: string[]
): Promise<void> {
  const reason =
    currentScore < previousScore
      ? `score dropped from ${previousScore} to ${currentScore}`
      : `${newFailures.length} new check${newFailures.length === 1 ? '' : 's'} failing`;

  const tokens = await getDeviceTokens(job.user_id);
  if (tokens.length) {
    await sendPush(tokens, {
      title: 'Drift alert',
      body: `${host}: ${reason}`,
      data: { type: 'drift', site_id: job.site_id ?? '', url: job.url },
    });
  }

  const email = await getUserEmail(job.user_id);
  if (email) {
    await sendEmail({
      to: email,
      subject: `Livecheck drift alert: ${host}`,
      html: `<p>A scheduled scan of <strong>${host}</strong> detected a change: ${reason}.</p>` +
        `<p>Open Livecheck to review the updated report.</p>`,
    });
  }
}

async function releaseCredit(job: ScanJob): Promise<void> {
  const { data: existing } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('scan_job_id', job.id)
    .eq('reason', 'scan_refund')
    .maybeSingle();
  if (existing) return;
  await supabase.from('credit_ledger').insert({
    organization_id: job.organization_id,
    user_id: job.user_id,
    delta: 1,
    reason: 'scan_refund',
    scan_job_id: job.id,
  });
}

async function processJob(job: ScanJob): Promise<void> {
  try {
    const report = await withTimeout(scanWebsite(job.url, { timeoutMs: JOB_TIMEOUT_MS }), JOB_TIMEOUT_MS + 5000);
    await supabase
      .from('scan_jobs')
      .update({ status: 'done', score: report.score, result: report, finished_at: new Date().toISOString() })
      .eq('id', job.id);
    const reportToken = await recordReport(job, report);
    await detectDrift(job, report);

    const tokens = await getDeviceTokens(job.user_id);
    if (tokens.length) {
      await sendPush(tokens, {
        title: 'Scan complete',
        body: `${hostOf(job.url)} scored ${report.score}/100`,
        data: { type: 'scan_done', report_token: reportToken ?? '', score: String(report.score), url: job.url },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'scan failed';
    const retryable = job.attempts < MAX_ATTEMPTS;
    if (retryable) {
      await supabase
        .from('scan_jobs')
        .update({ status: 'queued', error: message, scheduled_for: new Date(Date.now() + 30_000).toISOString(), started_at: null })
        .eq('id', job.id);
    } else {
      await supabase
        .from('scan_jobs')
        .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
        .eq('id', job.id);
      await releaseCredit(job);
    }
    console.error(`job ${job.id} failed (attempt ${job.attempts}):`, message);
  }
}

async function workerLoop(): Promise<void> {
  while (true) {
    const job = await claimJob();
    if (!job) {
      await sleep(POLL_MS);
      continue;
    }
    await processJob(job);
  }
}

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  console.log(`livecheck worker up: concurrency=${CONCURRENCY} poll=${POLL_MS}ms timeout=${JOB_TIMEOUT_MS}ms`);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => workerLoop()));
}

main().catch((err) => {
  console.error('worker crashed:', err);
  process.exit(1);
});

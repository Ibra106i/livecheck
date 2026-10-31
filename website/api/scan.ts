import { scanWebsite, calculateScore } from './scanner.js';
import { supabase, corsHeaders, jsonError, requirePermission } from './_clerk.js';
import { getTenantContext } from './_tenant.js';
import { checkRateLimit, rateLimitHeaders, getClientIP } from './_ratelimit.js';
import {
  getEntitlements,
  reserveScanJob,
  refundScanJob,
  grantFreeScan,
} from './_entitlements.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, headers);
  }

  const tenant = await getTenantContext(req);
  if (!tenant) {
    return jsonError('Unauthorized — no organization context', 401, headers);
  }

  if (!requirePermission(tenant, 'projects:write')) {
    return jsonError('Permission denied', 403, headers);
  }

  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, 'scan', { windowMs: 60_000, maxRequests: 5 });
  if (!rl.allowed) {
    return jsonError('Too many scan requests, try again later', 429, { ...headers, ...rateLimitHeaders(rl) });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  try {
    const body = await req.json();
    const { url, clientName, clientEmail, builderTool, agencyNotes, knownIssues } = body;

    if (!url || !clientName || !clientEmail) {
      return jsonError('Missing required fields: url, clientName, clientEmail', 400, headers);
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
    try {
      new URL(normalizedUrl);
    } catch {
      return jsonError('Invalid URL format', 400, headers);
    }

    // Upsert the tracked site for this org.
    const { data: site } = await supabase
      .from('sites')
      .upsert(
        { organization_id: tenant.orgId, url: normalizedUrl, name: clientName },
        { onConflict: 'organization_id,url' }
      )
      .select('id')
      .single();
    const siteId = site?.id as string | undefined;

    // Credit gate: spend a reserved credit, or the one free scan per account.
    let entitlements = await getEntitlements(tenant.orgId);
    if (entitlements.credits < 1) {
      await grantFreeScan(tenant.orgId, tenant.userId);
      entitlements = await getEntitlements(tenant.orgId);
    }
    if (entitlements.credits < 1) {
      return jsonError('Insufficient credits — buy a scan pack in the app', 402, headers);
    }

    const { data: job, error: jobError } = await supabase
      .from('scan_jobs')
      .insert({
        organization_id: tenant.orgId,
        user_id: tenant.userId,
        site_id: siteId,
        url: normalizedUrl,
        trigger: 'manual',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (jobError || !job) throw jobError || new Error('Failed to create scan job');
    const jobId = job.id as string;

    await reserveScanJob(tenant.orgId, tenant.userId, jobId);

    try {
      const scanResult = await scanWebsite(normalizedUrl);
      const score = calculateScore(scanResult);

      const projectId = `lc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      await supabase.from('scan_jobs').update({
        status: 'done',
        score,
        result: scanResult,
        finished_at: new Date().toISOString(),
      }).eq('id', jobId);

      await supabase.from('reports').insert({
        user_id: tenant.userId,
        organization_id: tenant.orgId,
        site_id: siteId,
        scan_job_id: jobId,
        token: crypto.randomUUID(),
        url: normalizedUrl,
        score,
        summary: `Livecheck score ${score}/100`,
        results: scanResult,
        generated_by: 'web',
        visibility: 'private',
      });

      // Kept for the existing agency dashboard.
      if (supabase) {
        const { error } = await supabase.from('projects').insert({
          id: projectId,
          user_id: tenant.userId,
          organization_id: tenant.orgId,
          site_url: normalizedUrl,
          client_name: clientName,
          client_email: clientEmail,
          builder_tool: builderTool || 'Unknown',
          agency_notes: agencyNotes || null,
          status: 'scanned',
          complexity_score: score,
          scan_result: scanResult,
          known_issues: knownIssues || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) console.error('Supabase project insert error:', error);
      }

      return new Response(JSON.stringify({
        projectId,
        jobId,
        score,
        scanResult,
        message: 'Scan complete',
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...headers } });
    } catch (scanErr: unknown) {
      // Infrastructure failure releases the reservation (plan section 7).
      await refundScanJob(tenant.orgId, tenant.userId, jobId);
      const msg = scanErr instanceof Error ? scanErr.message : 'scan failed';
      await supabase.from('scan_jobs').update({ status: 'failed', error: msg, finished_at: new Date().toISOString() }).eq('id', jobId);
      throw scanErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Scan error:', err);
    return jsonError('Scan failed: ' + message, 500, headers);
  }
}

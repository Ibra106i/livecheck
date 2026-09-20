import { scanWebsite, calculateScore } from './scanner.js';
import { supabase, corsHeaders, jsonError, requirePermission } from './_clerk.js';
import { getTenantContext } from './_tenant.js';
import { checkRateLimit, rateLimitHeaders, getClientIP } from './_ratelimit.js';

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

    const scanResult = await scanWebsite(normalizedUrl);
    const score = calculateScore(scanResult);

    const projectId = `lc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const project = {
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
    };

    if (supabase) {
      const { error } = await supabase.from('projects').insert(project);
      if (error) {
        console.error('Supabase insert error:', error);
      }
    }

    return new Response(JSON.stringify({
      projectId,
      score,
      scanResult,
      message: 'Scan complete',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Scan error:', err);
    return jsonError('Scan failed: ' + message, 500, headers);
  }
}

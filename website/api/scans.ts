import { supabase, corsHeaders, jsonError, jsonResponse } from './_clerk.js';
import { getTenantContext } from './_tenant.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'GET') return jsonError('Method not allowed', 405, headers);
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const tenant = await getTenantContext(req);
  if (!tenant) return jsonError('Unauthorized', 401, headers);

  const pathParts = new URL(req.url).pathname.split('/').filter(Boolean);
  const jobId = pathParts.length >= 3 ? pathParts[2] : null;

  if (jobId) {
    const { data, error } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('organization_id', tenant.orgId)
      .maybeSingle();
    if (error) return jsonError(error.message, 500, headers);
    if (!data) return jsonError('Scan not found', 404, headers);
    return jsonResponse(data, 200, headers);
  }

  const { data, error } = await supabase
    .from('scan_jobs')
    .select('id, url, site_id, trigger, status, score, error, scheduled_for, started_at, finished_at, created_at')
    .eq('organization_id', tenant.orgId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return jsonError(error.message, 500, headers);
  return jsonResponse({ scans: data || [] }, 200, headers);
}

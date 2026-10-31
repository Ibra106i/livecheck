import { supabase, corsHeaders, jsonError, jsonResponse } from './_clerk.js';
import { getTenantContext } from './_tenant.js';
import { getEntitlements } from './_entitlements.js';

// Scan scheduling / monitoring (plan section 8). Available only with an active
// monitoring subscription; cadence and site count follow the plan tier.
const MAX_SITES: Record<string, number> = { monitor_5_weekly: 5, monitor_25_daily: 25 };

function intervalMs(cadence: string): number {
  return cadence === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
}

async function requireSite(orgId: string, url: string, name?: string): Promise<string | null> {
  const { data } = await supabase!
    .from('sites')
    .upsert({ organization_id: orgId, url, name: name || null }, { onConflict: 'organization_id,url' })
    .select('id')
    .single();
  return (data?.id as string) || null;
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const tenant = await getTenantContext(req);
  if (!tenant) return jsonError('Unauthorized', 401, headers);

  const { subscription } = await getEntitlements(tenant.orgId);
  if (!subscription) {
    return jsonError('An active monitoring subscription is required', 402, headers);
  }
  const plan = subscription.product_id;
  const maxSites = MAX_SITES[plan] ?? 5;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('scan_schedules')
        .select('id, site_id, cadence, next_run_at, active, sites(url)')
        .eq('organization_id', tenant.orgId);
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ schedules: data || [] }, 200, headers);
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as { url?: string; siteId?: string; cadence?: string; name?: string };
      const cadence = body.cadence;
      if (cadence !== 'daily' && cadence !== 'weekly') return jsonError("cadence must be 'daily' or 'weekly'", 400, headers);
      if (cadence === 'daily' && plan !== 'monitor_25_daily') {
        return jsonError('Daily scans require the monitor_25_daily plan', 402, headers);
      }
      if (!body.url && !body.siteId) return jsonError('url or siteId is required', 400, headers);

      const url = (body.url || '').trim();
      const siteId = body.siteId || (url ? await requireSite(tenant.orgId, url, body.name) : null);
      if (!siteId) return jsonError('Could not resolve site', 400, headers);

      const { count } = await supabase
        .from('scan_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', tenant.orgId)
        .eq('active', true);
      const { data: dup } = await supabase
        .from('scan_schedules')
        .select('id')
        .eq('site_id', siteId)
        .eq('cadence', cadence)
        .maybeSingle();
      if (!dup && (count ?? 0) >= maxSites) {
        return jsonError(`Plan limit reached (${maxSites} sites)`, 409, headers);
      }

      const nextRunAt = new Date(Date.now() + intervalMs(cadence)).toISOString();

      if (dup) {
        const { data, error } = await supabase
          .from('scan_schedules')
          .update({ active: true, next_run_at: nextRunAt })
          .eq('id', dup.id as string)
          .select('id, site_id, cadence, next_run_at, active')
          .single();
        if (error) return jsonError(error.message, 500, headers);
        return jsonResponse({ schedule: data }, 200, headers);
      }

      const { data, error } = await supabase
        .from('scan_schedules')
        .insert({ site_id: siteId, organization_id: tenant.orgId, cadence, next_run_at: nextRunAt, active: true })
        .select('id, site_id, cadence, next_run_at, active')
        .single();
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ schedule: data }, 201, headers);
    }

    if (req.method === 'DELETE') {
      const id = new URL(req.url).searchParams.get('id');
      if (!id) return jsonError('id is required', 400, headers);
      const { error } = await supabase
        .from('scan_schedules')
        .delete()
        .eq('id', id)
        .eq('organization_id', tenant.orgId);
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ ok: true }, 200, headers);
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('schedules API error:', err);
    return jsonError(message, 500, headers);
  }
}

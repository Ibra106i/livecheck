import { supabase, corsHeaders, jsonError, requirePermission } from './_clerk.js';
import { getTenantContext } from './_tenant.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  const tenant = await getTenantContext(req);
  if (!tenant) {
    return jsonError('Unauthorized — no organization context', 401, headers);
  }

  if (!requirePermission(tenant, 'projects:read')) {
    return jsonError('Permission denied', 403, headers);
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const projectId = url.searchParams.get('id');

      if (projectId) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('organization_id', tenant.orgId)
          .single();

        if (error || !data) {
          return jsonError('Project not found', 404, headers);
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...headers },
        });
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', tenant.orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    if (req.method === 'POST') {
      if (!requirePermission(tenant, 'projects:write')) {
        return jsonError('Permission denied', 403, headers);
      }

      const body = await req.json();

      const allowedFields = {
        site_url: body.site_url || body.siteUrl,
        client_name: body.client_name || body.clientName,
        client_email: body.client_email || body.clientEmail,
        builder_tool: body.builder_tool || body.builderTool || 'Unknown',
        agency_notes: body.agency_notes || body.agencyNotes || null,
        status: body.status || 'pending',
        complexity_score: body.complexity_score || body.complexityScore || 0,
        scan_result: body.scan_result || body.scanResult || null,
        known_issues: body.known_issues || body.knownIssues || [],
        white_label: body.white_label ?? false,
        markup_price: body.markup_price ?? null,
      };

      if (!allowedFields.site_url || !allowedFields.client_name || !allowedFields.client_email) {
        return jsonError('Missing required fields: site_url, client_name, client_email', 400, headers);
      }

      const project = {
        id: body.id || `lc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: tenant.userId,
        organization_id: tenant.orgId,
        ...allowedFields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Projects API error:', err);
    return jsonError(message, 500, headers);
  }
}

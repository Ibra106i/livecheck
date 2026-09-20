import { supabase, corsHeaders, jsonError } from './_clerk.js';
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
    return jsonError('Unauthorized', 401, headers);
  }

  if (req.method !== 'GET') {
    return jsonError('Method not allowed', 405, headers);
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('user_id');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', tenant.orgId);

    if (action) {
      query = query.eq('action', action);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Enrich with user emails
    const userIds = [...new Set((logs || []).map(l => l.user_id).filter(Boolean))];
    let userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (users) {
        userMap = Object.fromEntries(users.map(u => [u.id, u.email]));
      }
    }

    const enrichedLogs = (logs || []).map(log => ({
      ...log,
      user_email: log.user_id ? userMap[log.user_id] || 'Unknown' : 'System',
    }));

    return new Response(JSON.stringify({
      logs: enrichedLogs,
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Audit logs API error:', err);
    return jsonError(message, 500, headers);
  }
}

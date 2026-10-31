import { supabase, corsHeaders, jsonError, getDefaultPermissions } from './_clerk.js';
import { resolveUser, ensurePersonalOrg } from './_identity.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  const user = await resolveUser(req);
  if (!user) {
    return jsonError('Unauthorized', 401, headers);
  }

  const url = new URL(req.url);

  // GET /api/auth — return user's organizations
  if (req.method === 'GET' && url.pathname === '/api/auth') {
    try {
      await ensurePersonalOrg(user.userId);

      const { data: memberships } = await supabase
        .from('memberships')
        .select('role, permissions, organizations(id, name, slug)')
        .eq('user_id', user.userId);

      const organizations = (memberships || []).map((m) => {
        const org = m.organizations as unknown as { id: string; name: string; slug: string };
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: m.role,
        };
      });

      return new Response(JSON.stringify({ organizations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Auth fetch error:', err);
      return jsonError(message, 500, headers);
    }
  }

  // POST /api/auth/switch-org — return membership info for a specific org
  if (req.method === 'POST' && url.pathname === '/api/auth/switch-org') {
    try {
      const body = await req.json();
      const { org_id } = body;

      if (!org_id) {
        return jsonError('org_id is required', 400, headers);
      }

      const { data: membership } = await supabase
        .from('memberships')
        .select('role, permissions, organizations(id, name, slug)')
        .eq('user_id', user.userId)
        .eq('organization_id', org_id)
        .single();

      if (!membership) {
        return jsonError('Not a member of this organization', 403, headers);
      }

      const org = membership.organizations as unknown as { id: string; name: string; slug: string };
      const permissions = membership.permissions?.length > 0
        ? membership.permissions
        : getDefaultPermissions(membership.role);

      return new Response(JSON.stringify({
        organization: { id: org.id, name: org.name, slug: org.slug, role: membership.role },
        permissions,
        message: 'Organization switched',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Switch org error:', err);
      return jsonError(message, 500, headers);
    }
  }

  return jsonError('Not found', 404, headers);
}


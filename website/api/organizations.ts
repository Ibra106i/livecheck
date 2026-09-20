import { supabase, corsHeaders, jsonError, requirePermission } from './_clerk.js';
import { getTenantContext } from './_tenant.js';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  // Route nested paths: /api/organizations/:id/members
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 4 && pathParts[0] === 'api' && pathParts[1] === 'organizations') {
    const orgId = pathParts[2];
    const sub = pathParts[3];
    if (sub === 'members') return handleMembers(req, orgId);
  }

  const tenant = await getTenantContext(req);
  if (!tenant) {
    return jsonError('Unauthorized — no organization context', 401, headers);
  }

  try {
    // GET /api/organizations — list user's organizations
    if (req.method === 'GET') {
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select('role, organizations(id, name, slug, created_at)')
        .eq('user_id', tenant.userId);

      if (error) throw error;

      const organizations = (memberships || []).map((m) => {
        const org = m.organizations as unknown as { id: string; name: string; slug: string; created_at: string };
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: m.role,
          created_at: org.created_at,
        };
      });

      return new Response(JSON.stringify({ organizations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // POST /api/organizations — create new organization
    if (req.method === 'POST') {
      const body = await req.json();
      const { name } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return jsonError('Organization name is required', 400, headers);
      }

      if (name.length > 100) {
        return jsonError('Organization name must be 100 characters or less', 400, headers);
      }

      const slug = generateSlug(name) + '-' + Math.random().toString(36).slice(2, 6);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: name.trim(), slug })
        .select('id, name, slug, created_at')
        .single();

      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from('memberships')
        .insert({
          user_id: tenant.userId,
          organization_id: orgData.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      const { error: rolesError } = await supabase.from('roles').insert([
        { organization_id: orgData.id, name: 'admin', permissions: ['projects:read', 'projects:write', 'members:read', 'members:manage', 'settings:read', 'settings:write'] },
        { organization_id: orgData.id, name: 'member', permissions: ['projects:read', 'projects:write'], is_default: true },
      ]);
      if (rolesError) console.error('Failed to create default roles:', rolesError);

      await supabase.from('audit_logs').insert({
        organization_id: orgData.id,
        user_id: tenant.userId,
        action: 'organization.created',
        metadata: { name: name.trim(), slug },
      });

      return new Response(JSON.stringify({
        organization: { ...orgData, role: 'owner' },
        message: 'Organization created',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Organizations API error:', err);
    return jsonError(message, 500, headers);
  }
}

// ============================================================
// Members sub-handler
// ============================================================

export async function handleMembers(req: Request, organizationId: string): Promise<Response> {
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

  if (tenant.orgId !== organizationId) {
    return jsonError('Access denied', 403, headers);
  }

  try {
    // GET — list members
    if (req.method === 'GET') {
      if (!requirePermission(tenant, 'members:read')) {
        return jsonError('Permission denied: members:read', 403, headers);
      }

      const { data: memberships, error } = await supabase
        .from('memberships')
        .select('id, role, permissions, joined_at, user_id, users(id, email, agency_name)')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const members = (memberships || []).map((m) => {
        const user = m.users as unknown as { id: string; email: string; agency_name: string | null };
        return {
          membership_id: m.id,
          user_id: m.user_id,
          email: user?.email,
          agency_name: user?.agency_name,
          role: m.role,
          permissions: m.permissions,
          joined_at: m.joined_at,
        };
      });

      return new Response(JSON.stringify({ members }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // POST — add member (direct add by email)
    if (req.method === 'POST') {
      if (!requirePermission(tenant, 'members:manage')) {
        return jsonError('Permission denied: members:manage', 403, headers);
      }

      const body = await req.json();
      const { email, role } = body;

      if (!email || typeof email !== 'string') {
        return jsonError('Email is required', 400, headers);
      }

      const validRole = role || 'member';
      if (!['admin', 'member'].includes(validRole)) {
        return jsonError('Role must be "admin" or "member"', 400, headers);
      }

      // Find user by email (look for clerk_id since Clerk manages auth)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !user) {
        return jsonError('User not found — they must sign up first', 404, headers);
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single();

      if (existing) {
        return jsonError('User is already a member of this organization', 409, headers);
      }

      const { error: memberError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          role: validRole,
        });

      if (memberError) throw memberError;

      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: tenant.userId,
        action: 'member.added',
        metadata: { added_user_id: user.id, email: user.email, role: validRole },
      });

      return new Response(JSON.stringify({
        member: { user_id: user.id, email: user.email, role: validRole },
        message: 'Member added',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // DELETE — remove member
    if (req.method === 'DELETE') {
      if (!requirePermission(tenant, 'members:manage')) {
        return jsonError('Permission denied: members:manage', 403, headers);
      }

      const url = new URL(req.url);
      const targetUserId = url.searchParams.get('user_id');

      if (!targetUserId) {
        return jsonError('user_id is required', 400, headers);
      }

      if (targetUserId === tenant.userId) {
        return jsonError('Cannot remove yourself', 400, headers);
      }

      const { data: membership } = await supabase
        .from('memberships')
        .select('id, role')
        .eq('user_id', targetUserId)
        .eq('organization_id', organizationId)
        .single();

      if (!membership) {
        return jsonError('User is not a member', 404, headers);
      }

      if (membership.role === 'owner') {
        return jsonError('Cannot remove an owner', 403, headers);
      }

      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membership.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: tenant.userId,
        action: 'member.removed',
        metadata: { removed_user_id: targetUserId },
      });

      return new Response(JSON.stringify({ message: 'Member removed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Members API error:', err);
    return jsonError(message, 500, headers);
  }
}

import { createClient } from '@supabase/supabase-js';
import { verifySession, corsHeaders, jsonError } from './_auth.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface TenantContext {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
  permissions: string[];
}

/**
 * Extract tenant context from request.
 * Verifies JWT and resolves organization membership.
 * Uses x-org-id header or org_id from JWT payload.
 */
export async function getTenantContext(req: Request): Promise<TenantContext | null> {
  if (!supabase) return null;

  const session = await verifySession(req);
  if (!session) return null;

  // Get org_id from header or JWT payload
  const orgId = req.headers.get('x-org-id') || session.org_id;

  if (orgId) {
    // Validate membership for specific org
    const { data: membership } = await supabase
      .from('memberships')
      .select('role, permissions, organization_id, organizations(name, slug)')
      .eq('user_id', session.sub)
      .eq('organization_id', orgId)
      .single();

    if (membership) {
      const org = membership.organizations as unknown as { name: string; slug: string };
      return {
        userId: session.sub,
        email: session.email,
        organizationId: membership.organization_id,
        organizationName: org.name,
        organizationSlug: org.slug,
        role: membership.role,
        permissions: membership.permissions || getDefaultPermissions(membership.role),
      };
    }
  }

  // No specific org — find first membership (auto-select for single-org users)
  const { data: membership } = await supabase
    .from('memberships')
    .select('role, permissions, organization_id, organizations(name, slug)')
    .eq('user_id', session.sub)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (membership) {
    const org = membership.organizations as unknown as { name: string; slug: string };
    return {
      userId: session.sub,
      email: session.email,
      organizationId: membership.organization_id,
      organizationName: org.name,
      organizationSlug: org.slug,
      role: membership.role,
      permissions: membership.permissions || getDefaultPermissions(membership.role),
    };
  }

  // User has no organizations
  return null;
}

/**
 * Returns default permissions for a role.
 */
function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'owner':
      return ['*'];
    case 'admin':
      return ['projects:read', 'projects:write', 'members:read', 'members:manage', 'settings:read', 'settings:write'];
    case 'member':
      return ['projects:read', 'projects:write'];
    default:
      return [];
  }
}

/**
 * Check if tenant context has a specific permission.
 */
export function hasPermission(tenant: TenantContext, permission: string): boolean {
  if (tenant.permissions.includes('*')) return true;
  return tenant.permissions.includes(permission);
}

/**
 * Require a specific permission. Returns error response if not authorized.
 */
export function requirePermission(
  tenant: TenantContext | null,
  permission: string
): Response | null {
  if (!tenant) {
    return jsonError('Unauthorized — no organization context', 401, corsHeaders());
  }
  if (!hasPermission(tenant, permission)) {
    return jsonError(`Insufficient permissions — requires: ${permission}`, 403, corsHeaders());
  }
  return null;
}

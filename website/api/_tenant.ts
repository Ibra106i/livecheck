import { verifyClerkToken, supabase, type TenantContext } from './_clerk.js';

export type { TenantContext };

export async function getTenantContext(req: Request): Promise<TenantContext | null> {
  const auth = await verifyClerkToken(req);
  if (!auth) return null;

  const orgId = req.headers.get('x-org-id');
  if (!orgId) return null;

  if (!supabase) return null;

  // Find user by clerk_id
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', auth.userId)
    .single();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('role, permissions')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single();

  if (!membership) return null;

  return {
    userId: user.id,
    orgId,
    role: membership.role,
    permissions: membership.permissions || [],
  };
}

export function requirePermission(tenant: TenantContext | null, permission: string): boolean {
  if (!tenant) return false;
  if (tenant.permissions.includes('*')) return true;
  return tenant.permissions.includes(permission);
}

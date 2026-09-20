import { verifyClerkToken, supabase, type TenantContext } from './_clerk.js';

export type { TenantContext };

export async function getTenantContext(req: Request): Promise<TenantContext | null> {
  const auth = await verifyClerkToken(req);
  if (!auth) return null;

  const orgId = req.headers.get('x-org-id');
  if (!orgId) return null;

  if (!supabase) return null;

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

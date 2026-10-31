import { supabase, getDefaultPermissions, type TenantContext } from './_clerk.js';
import { resolveUser, ensurePersonalOrg } from './_identity.js';

export type { TenantContext };

export async function getTenantContext(req: Request): Promise<TenantContext | null> {
  const user = await resolveUser(req);
  if (!user || !supabase) return null;

  let orgId = req.headers.get('x-org-id');

  // v1 has no org-switching UI yet, so a request without an org resolves to the
  // caller's personal organization, provisioning it on first login.
  if (!orgId) {
    const org = await ensurePersonalOrg(user.userId);
    if (!org) return null;
    orgId = org.id;
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role, permissions')
    .eq('user_id', user.userId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!membership) return null;

  const permissions =
    membership.permissions && membership.permissions.length > 0
      ? membership.permissions
      : getDefaultPermissions(membership.role);

  return {
    userId: user.userId,
    orgId,
    role: membership.role,
    permissions,
  };
}

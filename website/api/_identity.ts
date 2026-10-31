import { supabase, verifyClerkToken } from './_clerk.js';

export interface ResolvedUser {
  userId: string;
  email: string;
}

export interface PersonalOrg {
  id: string;
  name: string;
  slug: string;
}

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Find the local user for a Clerk subject, creating or linking one when needed.
 * Returns null when provisioning is impossible (missing DB or missing email).
 */
export async function ensureUser(
  clerkId: string,
  email: string,
  name?: string
): Promise<ResolvedUser | null> {
  if (!supabase) return null;

  const normalizedEmail = email.trim().toLowerCase();

  const { data: byClerk } = await supabase
    .from('users')
    .select('id, email')
    .eq('clerk_id', clerkId)
    .maybeSingle();
  if (byClerk) return { userId: byClerk.id, email: byClerk.email };

  if (normalizedEmail) {
    const { data: byEmail } = await supabase
      .from('users')
      .select('id, email, clerk_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (byEmail) {
      if (!byEmail.clerk_id) {
        await supabase.from('users').update({ clerk_id: clerkId }).eq('id', byEmail.id);
      }
      return { userId: byEmail.id, email: byEmail.email };
    }
  }

  if (!normalizedEmail) return null;

  const { data: created, error } = await supabase
    .from('users')
    .insert({ id: newId(), clerk_id: clerkId, email: normalizedEmail, agency_name: name || null })
    .select('id, email')
    .single();

  if (error || !created) {
    console.error('ensureUser insert failed:', error?.message);
    return null;
  }
  return { userId: created.id, email: created.email };
}

/**
 * Ensure the user belongs to at least one organization. In v1 every user gets
 * exactly one personal organization so the product works without any org UI.
 * Returns the user's first (personal) org, creating it when none exists.
 */
export async function ensurePersonalOrg(
  userId: string,
  displayName?: string
): Promise<PersonalOrg | null> {
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from('memberships')
    .select('organization_id, organizations(id, name, slug)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existing?.organizations) {
    const org = existing.organizations as unknown as PersonalOrg;
    return { id: org.id, name: org.name, slug: org.slug };
  }

  const name = (displayName && displayName.trim()) || 'My Workspace';
  const slug = `personal-${userId}`;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select('id, name, slug')
    .single();

  if (orgError || !org) {
    console.error('ensurePersonalOrg insert failed:', orgError?.message);
    return null;
  }

  const { error: memberError } = await supabase
    .from('memberships')
    .insert({ user_id: userId, organization_id: org.id, role: 'owner' });

  if (memberError) {
    console.error('ensurePersonalOrg membership failed:', memberError.message);
    return null;
  }

  await supabase.from('roles').insert([
    {
      organization_id: org.id,
      name: 'admin',
      permissions: ['projects:read', 'projects:write', 'members:read', 'members:manage', 'settings:read', 'settings:write'],
    },
    { organization_id: org.id, name: 'member', permissions: ['projects:read', 'projects:write'], is_default: true },
  ]);

  return org;
}

/**
 * Resolve the caller to a provisioned local user from a verified Clerk token.
 * Email comes from the JWT claim when present, else the client-provided
 * `x-user-email` header (Clerk's JS SDK knows the address on the client).
 */
export async function resolveUser(req: Request): Promise<ResolvedUser | null> {
  const auth = await verifyClerkToken(req);
  if (!auth) return null;

  const email = auth.email || req.headers.get('x-user-email') || '';
  const name = req.headers.get('x-user-name') || undefined;

  return ensureUser(auth.userId, email, name);
}

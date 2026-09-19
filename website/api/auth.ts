import { createClient } from '@supabase/supabase-js';
import { hash, compare } from 'bcryptjs';
import { signToken, corsHeaders, jsonError } from './_auth.js';
import { checkRateLimit, rateLimitHeaders, getClientIP } from './_ratelimit.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, headers);
  }

  if (!supabase) {
    return jsonError('Auth not configured', 503, headers);
  }

  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, 'auth', { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) {
    return jsonError('Too many requests, try again later', 429, { ...headers, ...rateLimitHeaders(rl) });
  }

  try {
    const body = await req.json();
    const { action, email, password, agencyName, org_id } = body;

    // Actions that don't require email/password
    if (action === 'switch-org') {
      return await handleSwitchOrgInternal(req, org_id);
    }

    if (!email || !password) {
      return jsonError('Email and password are required', 400, headers);
    }

    if (action === 'signup') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        return jsonError(passwordError, 400, headers);
      }

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      // Always return generic message to prevent email enumeration
      if (existing) {
        return new Response(JSON.stringify({ message: 'If this email is not already registered, check your inbox for confirmation.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...headers },
        });
      }

      const hashedPassword = await hash(password, BCRYPT_ROUNDS);

      // Create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          agency_name: agencyName || null,
        })
        .select('id, email, agency_name')
        .single();

      if (userError) throw userError;

      // Create default organization
      const orgName = agencyName || `${email.split('@')[0]}'s Organization`;
      const orgSlug = generateSlug(orgName) + '-' + Math.random().toString(36).slice(2, 6);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgSlug,
        })
        .select('id, name, slug')
        .single();

      if (orgError) throw orgError;

      // Create membership with owner role
      const { error: memberError } = await supabase
        .from('memberships')
        .insert({
          user_id: userData.id,
          organization_id: orgData.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Create default roles for organization (non-critical, log but don't fail)
      const { error: rolesError } = await supabase.from('roles').insert([
        { organization_id: orgData.id, name: 'admin', permissions: ['projects:read', 'projects:write', 'members:read', 'members:manage', 'settings:read', 'settings:write'] },
        { organization_id: orgData.id, name: 'member', permissions: ['projects:read', 'projects:write'], is_default: true },
      ]);
      if (rolesError) console.error('Failed to create default roles:', rolesError);

      // Generate token with org context
      const token = await signToken({
        sub: userData.id,
        email: userData.email,
        agency_name: userData.agency_name,
        org_id: orgData.id,
        org_slug: orgData.slug,
        roles: ['owner'],
        permissions: ['*'],
      });

      return new Response(JSON.stringify({
        user: userData,
        organization: orgData,
        organizations: [{ ...orgData, role: 'owner' }],
        token,
        message: 'Account created',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    if (action === 'login') {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email, agency_name, password_hash')
        .eq('email', email.toLowerCase())
        .single();

      if (fetchError || !user) {
        return jsonError('Invalid email or password', 401, headers);
      }

      const valid = await compare(password, user.password_hash);

      if (!valid) {
        return jsonError('Invalid email or password', 401, headers);
      }

      // Update last_login_at
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      // Fetch user's organizations
      const { data: memberships } = await supabase
        .from('memberships')
        .select('role, organizations(id, name, slug)')
        .eq('user_id', user.id);

      const organizations = (memberships || []).map((m) => {
        const org = m.organizations as unknown as { id: string; name: string; slug: string };
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: m.role,
        };
      });

      // Default to first organization
      const defaultOrg = organizations[0];

      // Generate token with org context
      const token = await signToken({
        sub: user.id,
        email: user.email,
        agency_name: user.agency_name,
        org_id: defaultOrg?.id,
        org_slug: defaultOrg?.slug,
        roles: defaultOrg ? [defaultOrg.role] : [],
        permissions: getDefaultPermissions(defaultOrg?.role || 'member'),
      });

      return new Response(JSON.stringify({
        user: { id: user.id, email: user.email, agency_name: user.agency_name },
        organization: defaultOrg || null,
        organizations,
        token,
        message: 'Login successful',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Invalid action', 400, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Auth error:', err);
    return jsonError('Auth failed: ' + message, 500, headers);
  }
}

// ============================================================
// Additional auth endpoints (organizations, switch-org)
// ============================================================

export async function handleOrganizations(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Auth not configured', 503, headers);
  }

  // Import verifySession dynamically to avoid circular deps
  const { verifySession } = await import('./_auth.js');
  const session = await verifySession(req);
  if (!session) {
    return jsonError('Unauthorized', 401, headers);
  }

  try {
    // Fetch user's organizations
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('role, organizations(id, name, slug)')
      .eq('user_id', session.sub);

    if (error) throw error;

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
    console.error('Organizations fetch error:', err);
    return jsonError(message, 500, headers);
  }
}

export async function handleSwitchOrg(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, headers);
  }

  if (!supabase) {
    return jsonError('Auth not configured', 503, headers);
  }

  const { verifySession } = await import('./_auth.js');
  const session = await verifySession(req);
  if (!session) {
    return jsonError('Unauthorized', 401, headers);
  }

  const body = await req.json();
  return handleSwitchOrgInternal(req, body.org_id);
}

async function handleSwitchOrgInternal(req: Request, org_id: string): Promise<Response> {
  const headers = corsHeaders();

  if (!supabase) {
    return jsonError('Auth not configured', 503, headers);
  }

  const { verifySession } = await import('./_auth.js');
  const session = await verifySession(req);
  if (!session) {
    return jsonError('Unauthorized', 401, headers);
  }

  if (!org_id) {
    return jsonError('org_id is required', 400, headers);
  }

  try {
    // Validate membership and get permissions from DB
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('role, permissions, organizations(id, name, slug)')
      .eq('user_id', session.sub)
      .eq('organization_id', org_id)
      .single();

    if (error || !membership) {
      return jsonError('Not a member of this organization', 403, headers);
    }

    const org = membership.organizations as unknown as { id: string; name: string; slug: string };
    const permissions = membership.permissions?.length > 0
      ? membership.permissions
      : getDefaultPermissions(membership.role);

    // Generate new token with org context
    const token = await signToken({
      sub: session.sub,
      email: session.email,
      agency_name: (session as Record<string, unknown>).agency_name as string | undefined,
      org_id: org.id,
      org_slug: org.slug,
      roles: [membership.role],
      permissions,
    });

    return new Response(JSON.stringify({
      organization: { id: org.id, name: org.name, slug: org.slug, role: membership.role },
      token,
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

import { createClient } from '@supabase/supabase-js';
import { corsHeaders, jsonError } from './_auth.js';
import { getTenantContext, requirePermission } from './_tenant.js';
import {
  getSSOProvidersForOrg,
  parseSAMLMetadata,
  encryptSecret,
  decryptSecret,
  SSO_APP_URL,
} from './_sso.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: name.trim(),
          slug,
        })
        .select('id, name, slug, created_at')
        .single();

      if (orgError) throw orgError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('memberships')
        .insert({
          user_id: tenant.userId,
          organization_id: orgData.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Create default roles (non-critical, log but don't fail)
      const { error: rolesError } = await supabase.from('roles').insert([
        { organization_id: orgData.id, name: 'admin', permissions: ['projects:read', 'projects:write', 'members:read', 'members:manage', 'settings:read', 'settings:write'] },
        { organization_id: orgData.id, name: 'member', permissions: ['projects:read', 'projects:write'], is_default: true },
      ]);
      if (rolesError) console.error('Failed to create default roles:', rolesError);

      // Audit log
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

  // Verify user is member of this org
  if (tenant.organizationId !== organizationId) {
    return jsonError('Access denied', 403, headers);
  }

  try {
    // GET — list members
    if (req.method === 'GET') {
      const permError = requirePermission(tenant, 'members:read');
      if (permError) return permError;

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
      const permError = requirePermission(tenant, 'members:manage');
      if (permError) return permError;

      const body = await req.json();
      const { email, role } = body;

      if (!email || typeof email !== 'string') {
        return jsonError('Email is required', 400, headers);
      }

      const validRole = role || 'member';
      if (!['admin', 'member'].includes(validRole)) {
        return jsonError('Role must be "admin" or "member"', 400, headers);
      }

      // Find user by email
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

      // Add membership
      const { error: memberError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          role: validRole,
        });

      if (memberError) throw memberError;

      // Audit log
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

    // DELETE — remove member (pass user_id in body)
    if (req.method === 'DELETE') {
      const permError = requirePermission(tenant, 'members:manage');
      if (permError) return permError;

      const url = new URL(req.url);
      const targetUserId = url.searchParams.get('user_id');

      if (!targetUserId) {
        return jsonError('user_id is required', 400, headers);
      }

      // Cannot remove yourself (owner)
      if (targetUserId === tenant.userId) {
        return jsonError('Cannot remove yourself', 400, headers);
      }

      // Check target is a member
      const { data: membership } = await supabase
        .from('memberships')
        .select('id, role')
        .eq('user_id', targetUserId)
        .eq('organization_id', organizationId)
        .single();

      if (!membership) {
        return jsonError('User is not a member', 404, headers);
      }

      // Cannot remove other owners
      if (membership.role === 'owner') {
        return jsonError('Cannot remove an owner', 403, headers);
      }

      // Delete membership
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membership.id);

      if (error) throw error;

      // Audit log
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

// ============================================================
// SSO Configuration sub-handler
// ============================================================

export async function handleSSOConfig(req: Request, organizationId: string): Promise<Response> {
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

  if (tenant.organizationId !== organizationId) {
    return jsonError('Access denied', 403, headers);
  }

  try {
    // GET — list SSO providers for org
    if (req.method === 'GET') {
      const permError = requirePermission(tenant, 'settings:read');
      if (permError) return permError;

      const providers = await getSSOProvidersForOrg(organizationId);

      // Mask secrets
      const safe = providers.map(p => ({
        ...p,
        oidc_client_secret_encrypted: p.oidc_client_secret_encrypted ? '[ENCRYPTED]' : null,
        idp_certificate: p.idp_certificate ? '[SET]' : null,
      }));

      return new Response(JSON.stringify({ providers: safe }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // POST — create SSO provider
    if (req.method === 'POST') {
      const permError = requirePermission(tenant, 'settings:manage');
      if (permError) return permError;

      const body = await req.json();
      const {
        type,
        name,
        domain,
        enabled,
        sso_only,
        jit_provisioning,
        default_role,
        // SAML
        idp_metadata_url,
        idp_entity_id,
        idp_sso_url,
        idp_certificate,
        // OIDC
        oidc_issuer,
        oidc_client_id,
        oidc_client_secret,
        oidc_scopes,
      } = body;

      if (!type || !['saml', 'oidc'].includes(type)) {
        return jsonError('type must be "saml" or "oidc"', 400, headers);
      }

      if (!name || typeof name !== 'string') {
        return jsonError('name is required', 400, headers);
      }

      if (!domain || typeof domain !== 'string') {
        return jsonError('domain is required', 400, headers);
      }

      const normalizedDomain = domain.toLowerCase().trim();

      // Check domain is verified
      const { data: verifiedDomain } = await supabase
        .from('domain_verifications')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('domain', normalizedDomain)
        .eq('verified', true)
        .single();

      if (!verifiedDomain) {
        return jsonError('Domain must be verified before configuring SSO', 400, headers);
      }

      // Check if domain already has SSO
      const { data: existingSSO } = await supabase
        .from('sso_providers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('domain', normalizedDomain)
        .single();

      if (existingSSO) {
        return jsonError('SSO already configured for this domain. Update or delete the existing configuration.', 409, headers);
      }

      let samlConfig: Record<string, string | null> = {};
      let oidcConfig: Record<string, unknown> = {};

      if (type === 'saml') {
        // Parse SAML metadata if provided
        let finalIdpMetadataUrl = idp_metadata_url || null;
        let finalIdpEntityId = idp_entity_id || null;
        let finalIdpSsoUrl = idp_sso_url || null;
        let finalIdpCertificate = idp_certificate || null;

        if (finalIdpMetadataUrl) {
          try {
            const metadata = await parseSAMLMetadata(finalIdpMetadataUrl);
            finalIdpEntityId = finalIdpEntityId || metadata.entityID;
            finalIdpSsoUrl = finalIdpSsoUrl || metadata.ssoURL;
            finalIdpCertificate = finalIdpCertificate || metadata.certificate;
          } catch (e) {
            console.warn('Failed to parse SAML metadata:', e);
          }
        }

        if (!finalIdpSsoUrl) {
          return jsonError('SAML requires idp_sso_url or idp_metadata_url', 400, headers);
        }

        samlConfig = {
          idp_metadata_url: finalIdpMetadataUrl,
          idp_entity_id: finalIdpEntityId,
          idp_sso_url: finalIdpSsoUrl,
          idp_certificate: finalIdpCertificate,
        };
      }

      if (type === 'oidc') {
        if (!oidc_issuer || !oidc_client_id || !oidc_client_secret) {
          return jsonError('OIDC requires oidc_issuer, oidc_client_id, and oidc_client_secret', 400, headers);
        }

        // Encrypt the client secret
        const encryptedSecret = await encryptSecret(oidc_client_secret);

        oidcConfig = {
          oidc_issuer: oidc_issuer,
          oidc_client_id: oidc_client_id,
          oidc_client_secret_encrypted: encryptedSecret,
          oidc_scopes: oidc_scopes || ['openid', 'email', 'profile'],
        };
      }

      const { data: ssoProvider, error: createError } = await supabase
        .from('sso_providers')
        .insert({
          organization_id: organizationId,
          type,
          name: name.trim(),
          domain: normalizedDomain,
          enabled: enabled !== false,
          sso_only: sso_only === true,
          jit_provisioning: jit_provisioning === true,
          default_role: default_role || 'member',
          ...samlConfig,
          ...oidcConfig,
          metadata: {
            callback_url: `${SSO_APP_URL}/api/auth/sso/callback`,
            sp_entity_id: SSO_APP_URL,
          },
        })
        .select('*')
        .single();

      if (createError) throw createError;

      // Audit log
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: tenant.userId,
        action: 'sso.provider_created',
        metadata: { provider_id: ssoProvider.id, type, name, domain: normalizedDomain },
      });

      // Mask secret in response
      const safeProvider = {
        ...ssoProvider,
        oidc_client_secret_encrypted: ssoProvider.oidc_client_secret_encrypted ? '[ENCRYPTED]' : null,
      };

      return new Response(JSON.stringify({
        provider: safeProvider,
        message: 'SSO provider created',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SSO config API error:', err);
    return jsonError(message, 500, headers);
  }
}

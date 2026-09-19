import { createClient } from '@supabase/supabase-js';
import { corsHeaders, jsonError } from './_auth.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const SSO_APP_URL = process.env.SSO_APP_URL || process.env.SITE_ORIGIN || 'https://livechecks.vercel.app';
export const SSO_ENCRYPTION_KEY = process.env.SSO_ENCRYPTION_KEY || '';

// ============================================================
// Encryption helpers for OIDC client secrets
// ============================================================

export async function encryptSecret(plaintext: string): Promise<string> {
  if (!SSO_ENCRYPTION_KEY) throw new Error('SSO_ENCRYPTION_KEY not configured');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SSO_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return Buffer.from(combined).toString('base64');
}

export async function decryptSecret(ciphertextBase64: string): Promise<string> {
  if (!SSO_ENCRYPTION_KEY) throw new Error('SSO_ENCRYPTION_KEY not configured');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SSO_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  const combined = Buffer.from(ciphertextBase64, 'base64');
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ============================================================
// SSO provider lookup
// ============================================================

export interface SSOProvider {
  id: string;
  organization_id: string;
  type: 'saml' | 'oidc';
  name: string;
  enabled: boolean;
  sso_only: boolean;
  jit_provisioning: boolean;
  idp_metadata_url: string | null;
  idp_entity_id: string | null;
  idp_sso_url: string | null;
  idp_certificate: string | null;
  oidc_issuer: string | null;
  oidc_client_id: string | null;
  oidc_client_secret_encrypted: string | null;
  oidc_scopes: string[];
  domain: string;
  default_role: string;
  metadata: Record<string, unknown>;
}

export async function getSSOProviderByDomain(domain: string): Promise<SSOProvider | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('sso_providers')
    .select('*')
    .eq('domain', domain)
    .eq('enabled', true)
    .single();
  return data as SSOProvider | null;
}

export async function getSSOProvidersForOrg(orgId: string): Promise<SSOProvider[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('sso_providers')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  return (data || []) as SSOProvider[];
}

// ============================================================
// SAML metadata parser (lightweight)
// ============================================================

export async function parseSAMLMetadata(metadataUrl: string): Promise<{
  entityID: string;
  ssoURL: string;
  certificate: string;
}> {
  const res = await fetch(metadataUrl);
  if (!res.ok) throw new Error('Failed to fetch IdP metadata');

  const xml = await res.text();

  // Basic XML parsing for SAML metadata
  const entityIDMatch = xml.match(/entityID="([^"]+)"/);
  const ssoURLMatch = xml.match(/<md:SingleSignOnService[^>]*Location="([^"]+)"/);
  const certMatch = xml.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/);

  if (!entityIDMatch || !ssoURLMatch) {
    throw new Error('Invalid SAML metadata — missing required fields');
  }

  return {
    entityID: entityIDMatch[1],
    ssoURL: ssoURLMatch[1],
    certificate: certMatch ? certMatch[1] : '',
  };
}

// ============================================================
// OIDC discovery
// ============================================================

export interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  claims_supported: string[];
}

export async function discoverOIDC(issuer: string): Promise<OIDCDiscovery> {
  const wellKnownUrl = issuer.replace(/\/$/, '') + '/.well-known/openid-configuration';
  const res = await fetch(wellKnownUrl);
  if (!res.ok) throw new Error('Failed to fetch OIDC discovery document');
  return res.json();
}

// ============================================================
// SAML AuthnRequest generator
// ============================================================

export function generateSAMLAuthnRequest(params: {
  ssoUrl: string;
  entityID: string;
  acsUrl: string;
  requestId: string;
}): string {
  const { ssoUrl, entityID, acsUrl, requestId } = params;
  const issueInstant = new Date().toISOString();

  const authnRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${ssoUrl}"
  AssertionConsumerServiceURL="${acsUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${escapeXml(entityID)}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
    AllowCreate="true" />
</samlp:AuthnRequest>`;

  return Buffer.from(authnRequest).toString('base64');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================
// SAML Response parser (lightweight, no library needed for basic parsing)
// ============================================================

export function parseSAMLResponse(samlResponse: string): {
  nameID: string;
  email: string;
  firstName: string;
  lastName: string;
  attributes: Record<string, string>;
  inResponseTo: string;
} {
  const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');

  const inResponseToMatch = decoded.match(/InResponseTo="([^"]+)"/);
  const nameIDMatch = decoded.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);

  if (!nameIDMatch) throw new Error('Invalid SAML response — no NameID');

  const nameID = nameIDMatch[1];
  const inResponseTo = inResponseToMatch ? inResponseToMatch[1] : '';

  // Parse attributes
  const attributes: Record<string, string> = {};
  const attrMatches = decoded.matchAll(/<saml:Attribute\s+Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g);
  for (const match of attrMatches) {
    attributes[match[1]] = match[2];
  }

  return {
    nameID,
    email: attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      || attributes['email']
      || nameID,
    firstName: attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']
      || attributes['firstName']
      || '',
    lastName: attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']
      || attributes['lastName']
      || '',
    attributes,
    inResponseTo,
  };
}

// ============================================================
// User provisioning
// ============================================================

export async function findOrCreateSSOUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  providerUserId: string;
  organizationId: string;
  defaultRole: string;
  jitProvisioning: boolean;
  clientIp?: string;
}): Promise<{
  userId: string;
  email: string;
  isNewUser: boolean;
} | null> {
  const { email, firstName, lastName, provider, providerUserId, organizationId, defaultRole, jitProvisioning, clientIp } = params;
  if (!supabase) return null;

  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing identity
  const { data: existingIdentity } = await supabase
    .from('user_identities')
    .select('user_id, users(id, email)')
    .eq('provider', provider)
    .eq('provider_user_id', providerUserId)
    .single();

  if (existingIdentity) {
    // Update last_login_at
    await supabase
      .from('user_identities')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', existingIdentity.id);

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', existingIdentity.user_id);

    return {
      userId: existingIdentity.user_id,
      email: normalizedEmail,
      isNewUser: false,
    };
  }

  // Check for existing user by email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', normalizedEmail)
    .single();

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else if (jitProvisioning) {
    // JIT provisioning — create new user without password
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: '',
        agency_name: [firstName, lastName].filter(Boolean).join(' ') || null,
        sso_provider: provider,
        password_hash_optional: true,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('JIT user creation failed:', createError);
      return null;
    }

    userId = newUser.id;
  } else {
    // No JIT — can't create user
    return null;
  }

  // Link identity
  const { error: identityError } = await supabase
    .from('user_identities')
    .insert({
      user_id: userId,
      provider,
      provider_user_id: providerUserId,
      email: normalizedEmail,
      metadata: { firstName, lastName },
    });

  if (identityError && identityError.code !== '23505') { // ignore duplicate
    console.error('Identity link failed:', identityError);
  }

  // Ensure membership exists
  const { data: existingMembership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (!existingMembership) {
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role: defaultRole,
      });

    if (memberError) {
      console.error('SSO membership creation failed:', memberError);
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    organization_id: organizationId,
    user_id: userId,
    action: 'sso.user_provisioned',
    metadata: { provider, email: normalizedEmail, isNewUser: !existingUser },
    ip_address: clientIp || null,
  });

  return {
    userId,
    email: normalizedEmail,
    isNewUser: !existingUser,
  };
}

// ============================================================
// Response helpers
// ============================================================

export { corsHeaders, jsonError } from './_auth.js';

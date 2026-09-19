import { signToken, corsHeaders, jsonError } from '../_auth.js';
import {
  supabase,
  getSSOProviderByDomain,
  findOrCreateSSOUser,
  parseSAMLResponse,
  discoverOIDC,
  decryptSecret,
  SSO_APP_URL,
} from '../_sso.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  try {
    let email: string;
    let providerUserId: string;
    let firstName = '';
    let lastName = '';
    let domain: string;
    let providerId: string;
    let organizationId: string;

    // Determine if this is a SAML POST callback or OIDC GET callback
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // SAML POST callback
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      const samlResponse = params.get('SAMLResponse');
      const relayState = params.get('RelayState');

      if (!samlResponse) {
        return jsonError('Missing SAML response', 400, headers);
      }

      // Parse relay state
      let stateData: { provider_id: string; organization_id: string; domain: string; request_id: string };
      try {
        stateData = JSON.parse(relayState || '{}');
      } catch {
        return jsonError('Invalid relay state', 400, headers);
      }

      providerId = stateData.provider_id;
      organizationId = stateData.organization_id;
      domain = stateData.domain;

      // Parse SAML response
      const parsed = parseSAMLResponse(samlResponse);
      email = parsed.email;
      providerUserId = parsed.nameID;
      firstName = parsed.firstName;
      lastName = parsed.lastName;

    } else {
      // OIDC callback (GET or POST)
      let params: URLSearchParams;

      if (req.method === 'GET') {
        const url = new URL(req.url);
        params = url.searchParams;
      } else {
        const body = await req.text();
        params = new URLSearchParams(body);
      }

      const code = params.get('code');
      const stateParam = params.get('state');

      if (!code || !stateParam) {
        return jsonError('Missing authorization code or state', 400, headers);
      }

      // Decode state
      let stateData: { provider_id: string; organization_id: string; domain: string; type: string };
      try {
        stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      } catch {
        return jsonError('Invalid state parameter', 400, headers);
      }

      providerId = stateData.provider_id;
      organizationId = stateData.organization_id;
      domain = stateData.domain;

      // Get provider config
      const provider = await getSSOProviderByDomain(domain);
      if (!provider || !provider.oidc_issuer || !provider.oidc_client_id || !provider.oidc_client_secret_encrypted) {
        return jsonError('OIDC provider not configured', 500, headers);
      }

      // Discover OIDC endpoints
      const discovery = await discoverOIDC(provider.oidc_issuer);

      // Exchange code for tokens
      const clientSecret = await decryptSecret(provider.oidc_client_secret_encrypted);
      const callbackUrl = `${SSO_APP_URL}/api/auth/sso/callback`;

      const tokenRes = await fetch(discovery.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          client_id: provider.oidc_client_id,
          client_secret: clientSecret,
        }),
      });

      if (!tokenRes.ok) {
        const error = await tokenRes.text();
        console.error('OIDC token exchange failed:', error);
        return jsonError('OIDC token exchange failed', 502, headers);
      }

      const tokens = await tokenRes.json();

      // Fetch user info
      const userInfoRes = await fetch(discovery.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoRes.ok) {
        return jsonError('Failed to fetch user info from OIDC provider', 502, headers);
      }

      const userInfo = await userInfoRes.json();

      email = userInfo.email || '';
      providerUserId = userInfo.sub || '';
      firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || '';
      lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '';

      if (!email || !providerUserId) {
        return jsonError('OIDC provider did not return required user info', 400, headers);
      }
    }

    // Get SSO provider config
    const provider = await getSSOProviderByDomain(domain);
    if (!provider) {
      return jsonError('SSO provider not found', 404, headers);
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    // Find or create user
    const result = await findOrCreateSSOUser({
      email,
      firstName,
      lastName,
      provider: provider.type,
      providerUserId,
      organizationId,
      defaultRole: provider.default_role || 'member',
      jitProvisioning: provider.jit_provisioning,
      clientIp,
    });

    if (!result) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>SSO Login Failed</title></head>
        <body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#09090b;color:#fff;">
          <div style="text-align:center;">
            <h1 style="font-size:1.5rem;margin-bottom:0.5rem;">SSO Login Failed</h1>
            <p style="color:#a1a1aa;">No account found. JIT provisioning is disabled for this organization.</p>
            <a href="/login" style="color:#34d399;margin-top:1rem;display:inline-block;">Back to Login</a>
          </div>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Fetch user's memberships for the JWT
    const { data: memberships } = await supabase
      .from('memberships')
      .select('role, permissions, organizations(id, name, slug)')
      .eq('user_id', result.userId);

    const organizations = (memberships || []).map((m) => {
      const org = m.organizations as unknown as { id: string; name: string; slug: string };
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: m.role,
      };
    });

    const currentOrg = organizations.find(o => o.id === organizationId) || organizations[0];

    // Generate JWT
    const token = await signToken({
      sub: result.userId,
      email: result.email,
      org_id: currentOrg?.id,
      org_slug: currentOrg?.slug,
      roles: currentOrg ? [currentOrg.role] : [],
      permissions: getDefaultPermissions(currentOrg?.role || 'member'),
    });

    // Redirect back to frontend with token
    const frontendUrl = SSO_APP_URL;
    const redirectUrl = `${frontendUrl}/sso-callback?token=${encodeURIComponent(token)}&org=${encodeURIComponent(JSON.stringify(currentOrg))}&orgs=${encodeURIComponent(JSON.stringify(organizations))}`;

    // Audit log
    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: result.userId,
      action: 'sso.login',
      metadata: { provider: provider.type, email: result.email, isNewUser: result.isNewUser },
      ip_address: clientIp || null,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        ...headers,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SSO callback error:', err);

    // Return error page
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>SSO Error</title></head>
      <body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#09090b;color:#fff;">
        <div style="text-align:center;">
          <h1 style="font-size:1.5rem;margin-bottom:0.5rem;">SSO Authentication Error</h1>
          <p style="color:#a1a1aa;">${message}</p>
          <a href="/login" style="color:#34d399;margin-top:1rem;display:inline-block;">Back to Login</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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

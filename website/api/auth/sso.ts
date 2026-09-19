import { getSSOProviderByDomain, generateSAMLAuthnRequest, SSO_APP_URL, corsHeaders, jsonError } from '../_sso.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, headers);
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return jsonError('Email is required', 400, headers);
    }

    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return jsonError('Invalid email', 400, headers);
    }

    // Look up SSO provider for this domain
    const provider = await getSSOProviderByDomain(domain);
    if (!provider) {
      return new Response(JSON.stringify({
        sso_available: false,
        message: 'No SSO configured for this domain',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    const requestId = '_' + crypto.randomUUID();

    // Build callback URL
    const callbackUrl = `${SSO_APP_URL}/api/auth/sso/callback`;

    if (provider.type === 'saml') {
      // SAML SP-initiated login
      if (!provider.idp_sso_url) {
        return jsonError('SAML IdP SSO URL not configured', 500, headers);
      }

      const authRequest = generateSAMLAuthnRequest({
        ssoUrl: provider.idp_sso_url,
        entityID: SSO_APP_URL,
        acsUrl: callbackUrl,
        requestId,
      });

      // Store state in a short-lived cookie
      const stateData = JSON.stringify({
        state,
        provider_id: provider.id,
        organization_id: provider.organization_id,
        domain,
        request_id: requestId,
        type: 'saml',
      });

      return new Response(JSON.stringify({
        sso_available: true,
        type: 'saml',
        redirect_url: `${provider.idp_sso_url}?SAMLRequest=${encodeURIComponent(authRequest)}&RelayState=${encodeURIComponent(stateData)}`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    if (provider.type === 'oidc') {
      // OIDC login
      if (!provider.oidc_issuer || !provider.oidc_client_id) {
        return jsonError('OIDC configuration incomplete', 500, headers);
      }

      // OIDC authorization URL
      const oidcState = Buffer.from(JSON.stringify({
        state,
        provider_id: provider.id,
        organization_id: provider.organization_id,
        domain,
        type: 'oidc',
      })).toString('base64');

      const authUrl = `${provider.oidc_issuer.replace(/\/$/, '')}/authorize?` +
        `client_id=${encodeURIComponent(provider.oidc_client_id)}` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(provider.oidc_scopes.join(' '))}` +
        `&state=${encodeURIComponent(oidcState)}` +
        `&login_hint=${encodeURIComponent(email)}`;

      return new Response(JSON.stringify({
        sso_available: true,
        type: 'oidc',
        redirect_url: authUrl,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Unknown SSO provider type', 500, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SSO initiation error:', err);
    return jsonError(message, 500, headers);
  }
}

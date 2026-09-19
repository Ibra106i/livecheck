import { corsHeaders, jsonError, SSO_APP_URL } from '../_sso.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return jsonError('Method not allowed', 405, headers);
  }

  const acsUrl = `${SSO_APP_URL}/api/auth/sso/callback`;
  const entityID = SSO_APP_URL;

  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(entityID)}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(acsUrl)}" index="1" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  return new Response(metadata, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...headers,
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

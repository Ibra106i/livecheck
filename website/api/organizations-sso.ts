import { handleSSOConfig } from './organizations.js';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  // /api/organizations/:id/sso-config
  const orgIndex = pathParts.indexOf('organizations');
  const organizationId = orgIndex >= 0 ? pathParts[orgIndex + 1] : null;

  if (!organizationId) {
    return new Response(JSON.stringify({ error: 'Organization ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return handleSSOConfig(req, organizationId);
}

import { corsHeaders, jsonError, jsonResponse } from '../_clerk.js';
import { getTenantContext } from '../_tenant.js';
import { getEntitlements } from '../_entitlements.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'GET') return jsonError('Method not allowed', 405, headers);

  const tenant = await getTenantContext(req);
  if (!tenant) return jsonError('Unauthorized', 401, headers);

  const entitlements = await getEntitlements(tenant.orgId);
  return jsonResponse(entitlements, 200, headers);
}

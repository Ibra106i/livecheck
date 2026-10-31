import { clerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface TenantContext {
  userId: string;
  orgId: string;
  role: string;
  permissions: string[];
}

export async function verifyClerkToken(req: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const verified = await clerkClient.verifyToken(token);
    return { userId: verified.sub, email: (verified.email as string) || '' };
  } catch {
    return null;
  }
}

export function hasPermission(permissions: string[], permission: string): boolean {
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export function requirePermission(tenant: TenantContext | null, permission: string): boolean {
  if (!tenant) return false;
  return hasPermission(tenant.permissions, permission);
}

export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin || process.env.SITE_ORIGIN || 'https://livechecks.vercel.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Org-Id, X-User-Email, X-User-Name',
  };
}

export function jsonError(message: string, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function jsonResponse(data: unknown, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function getDefaultPermissions(role: string): string[] {
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

export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

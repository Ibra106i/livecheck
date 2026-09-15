import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || '';

function getSecretKey() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');
  return new TextEncoder().encode(JWT_SECRET);
}

export interface SessionPayload {
  sub: string;       // user id
  email: string;
  agency_name?: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySession(req: Request): Promise<SessionPayload | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      agency_name: payload.agency_name as string | undefined,
    };
  } catch {
    return null;
  }
}

export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin || process.env.SITE_ORIGIN || 'https://livechecks.vercel.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function jsonError(message: string, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

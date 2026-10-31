import { supabase, corsHeaders, jsonError, jsonResponse } from './_clerk.js';
import { resolveUser } from './_identity.js';

// FCM device-token registration (plan section 10). Tokens are user-scoped, so
// this uses the resolved local user id directly rather than an org context.
export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const user = await resolveUser(req);
  if (!user) return jsonError('Unauthorized', 401, headers);

  try {
    if (req.method === 'POST') {
      const { token, platform } = (await req.json()) as { token?: string; platform?: string };
      if (!token || typeof token !== 'string') return jsonError('token is required', 400, headers);

      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: user.userId,
            token,
            platform: platform === 'ios' ? 'ios' : 'android',
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ ok: true }, 201, headers);
    }

    if (req.method === 'DELETE') {
      let token: string | undefined;
      if (req.headers.get('content-type')?.includes('application/json')) {
        token = ((await req.json()) as { token?: string }).token;
      }
      if (!token) token = new URL(req.url).searchParams.get('token') || undefined;
      if (!token) return jsonError('token is required', 400, headers);

      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.userId)
        .eq('token', token);
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ ok: true }, 200, headers);
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('devices API error:', err);
    return jsonError(message, 500, headers);
  }
}

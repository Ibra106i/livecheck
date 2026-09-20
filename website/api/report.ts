import { supabase, corsHeaders, jsonError } from './_clerk.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return jsonError('Method not allowed', 405, headers);
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return jsonError('Missing report token', 400, headers);
    }

    if (!supabase) {
      return jsonError('Database not configured', 503, headers);
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return jsonError('Report not found', 404, headers);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch (err: unknown) {
    console.error('Report fetch error:', err);
    return jsonError('Failed to fetch report', 500, headers);
  }
}

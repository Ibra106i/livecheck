import { createClient } from '@supabase/supabase-js';
import { corsHeaders, jsonError } from './_auth.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
    const pathParts = url.pathname.split('/');
    const token = pathParts[pathParts.length - 1];

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

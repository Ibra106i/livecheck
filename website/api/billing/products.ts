import { supabase, corsHeaders, jsonError, jsonResponse } from '../_clerk.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'GET') return jsonError('Method not allowed', 405, headers);
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const { data, error } = await supabase
    .from('play_products')
    .select('product_id, type, credits, plan')
    .eq('active', true)
    .order('product_id');

  if (error) return jsonError(error.message, 500, headers);
  return jsonResponse({ products: data || [] }, 200, headers);
}

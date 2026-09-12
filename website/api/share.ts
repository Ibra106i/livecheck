import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();

    if (!body.url || typeof body.score !== 'number' || !body.summary || !body.results) {
      return new Response(JSON.stringify({ error: 'Invalid report data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = generateToken();

    const { error } = await supabase.from('reports').insert({
      token,
      url: body.url,
      score: body.score,
      summary: body.summary,
      results: body.results,
      ai_analysis: body.aiAnalysis || null,
      generated_by: 'cli',
    });

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Token collision, please retry' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save report' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const shareUrl = `https://livechecks.vercel.app/r/${token}`;

    return new Response(JSON.stringify({ url: shareUrl, token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Share API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
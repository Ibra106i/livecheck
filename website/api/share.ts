import { createClient } from '@supabase/supabase-js';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const hmacSecret = process.env.SHARE_HMAC_SECRET || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const MAX_SUMMARY_LENGTH = 5000;
const MAX_RESULTS_LENGTH = 50000;

function generateToken(): string {
  return randomBytes(16).toString('hex');
}

function generateHmac(token: string): string {
  if (!hmacSecret) return '';
  return createHmac('sha256', hmacSecret).update(token).digest('hex');
}

function verifyHmac(token: string, signature: string): boolean {
  if (!hmacSecret || !signature) return false;
  const expected = Buffer.from(generateHmac(token));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
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

    if (!validateUrl(body.url)) {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.summary.length > MAX_SUMMARY_LENGTH) {
      return new Response(JSON.stringify({ error: 'Summary exceeds maximum length' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const serializedResults = JSON.stringify(body.results);
    if (serializedResults.length > MAX_RESULTS_LENGTH) {
      return new Response(JSON.stringify({ error: 'Results payload too large' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
      return new Response(JSON.stringify({ error: 'Score must be a number between 0 and 100' }), {
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

    const signature = generateHmac(token);
    const shareUrl = `https://livechecks.vercel.app/r/${token}`;

    return new Response(JSON.stringify({ url: shareUrl, token, signature }), {
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

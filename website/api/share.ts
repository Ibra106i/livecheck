import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { corsHeaders, jsonError } from './_auth.js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const MAX_SUMMARY_LENGTH = 5000;
const MAX_RESULTS_LENGTH = 50000;

function generateToken(): string {
  return randomBytes(16).toString('hex');
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
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, headers);
  }

  try {
    const body = await req.json();

    if (!body.url || typeof body.score !== 'number' || !body.summary || !body.results) {
      return jsonError('Invalid report data', 400, headers);
    }

    if (!validateUrl(body.url)) {
      return jsonError('Invalid URL format', 400, headers);
    }

    if (body.summary.length > MAX_SUMMARY_LENGTH) {
      return jsonError('Summary exceeds maximum length', 400, headers);
    }

    const serializedResults = JSON.stringify(body.results);
    if (serializedResults.length > MAX_RESULTS_LENGTH) {
      return jsonError('Results payload too large', 400, headers);
    }

    if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
      return jsonError('Score must be a number between 0 and 100', 400, headers);
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
        return jsonError('Token collision, please retry', 409, headers);
      }
      console.error('Supabase insert error:', error);
      return jsonError('Failed to save report', 500, headers);
    }

    const shareUrl = `https://livechecks.vercel.app/r/${token}`;

    return new Response(JSON.stringify({ url: shareUrl, token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch (err) {
    console.error('Share API error:', err);
    return jsonError('Internal server error', 500, headers);
  }
}

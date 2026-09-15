import { createClient } from '@supabase/supabase-js';
import { hash, compare } from 'bcryptjs';
import { signToken, corsHeaders, jsonError } from './_auth.js';
import { checkRateLimit, rateLimitHeaders, getClientIP } from './_ratelimit.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, headers);
  }

  if (!supabase) {
    return jsonError('Auth not configured', 503, headers);
  }

  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, 'auth', { windowMs: 60_000, maxRequests: 10 });
  if (!rl.allowed) {
    return jsonError('Too many requests, try again later', 429, { ...headers, ...rateLimitHeaders(rl) });
  }

  try {
    const body = await req.json();
    const { action, email, password, agencyName } = body;

    if (!email || !password) {
      return jsonError('Email and password are required', 400, headers);
    }

    if (action === 'signup') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        return jsonError(passwordError, 400, headers);
      }

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      // Always return generic message to prevent email enumeration
      if (existing) {
        return new Response(JSON.stringify({ message: 'If this email is not already registered, check your inbox for confirmation.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...headers },
        });
      }

      const hashedPassword = await hash(password, BCRYPT_ROUNDS);

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          agency_name: agencyName || null,
        })
        .select('id, email, agency_name')
        .single();

      if (error) throw error;

      const token = await signToken({ sub: data.id, email: data.email, agency_name: data.agency_name });

      return new Response(JSON.stringify({ user: data, token, message: 'Account created' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    if (action === 'login') {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email, agency_name, password_hash')
        .eq('email', email.toLowerCase())
        .single();

      if (fetchError || !user) {
        return jsonError('Invalid email or password', 401, headers);
      }

      const valid = await compare(password, user.password_hash);

      if (!valid) {
        return jsonError('Invalid email or password', 401, headers);
      }

      const token = await signToken({ sub: user.id, email: user.email, agency_name: user.agency_name });

      return new Response(JSON.stringify({
        user: { id: user.id, email: user.email, agency_name: user.agency_name },
        token,
        message: 'Login successful',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Invalid action', 400, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Auth error:', err);
    return jsonError('Auth failed: ' + message, 500, headers);
  }
}

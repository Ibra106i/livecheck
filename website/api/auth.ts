import { createClient } from '@supabase/supabase-js';
import { hash, compare } from 'bcryptjs';

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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Auth not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const { action, email, password, agencyName } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'signup') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        return new Response(JSON.stringify({ error: passwordError }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Email already registered' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
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

      return new Response(JSON.stringify({ user: data, message: 'Account created' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'login') {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email, agency_name, password_hash')
        .eq('email', email.toLowerCase())
        .single();

      if (fetchError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const valid = await compare(password, user.password_hash);

      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({
        user: { id: user.id, email: user.email, agency_name: user.agency_name },
        message: 'Login successful',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Auth failed: ' + message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

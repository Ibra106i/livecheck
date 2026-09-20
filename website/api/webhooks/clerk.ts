import { Webhook } from 'svix';
import { supabase } from '../_clerk.js';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not set');
    return new Response('Webhook not configured', { status: 500 });
  }

  if (!supabase) {
    return new Response('Database not configured', { status: 503 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event: { type: string; data: Record<string, unknown> };

  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(payload, headers) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = event.data as {
          id: string;
          email_addresses?: Array<{ email_address: string }>;
          first_name?: string;
          last_name?: string;
        };

        const email = email_addresses?.[0]?.email_address;
        if (!email) break;

        // Check if user already exists (migration from old auth)
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existing) {
          // Link Clerk ID to existing user
          await supabase
            .from('users')
            .update({ clerk_id: id })
            .eq('id', existing.id);
        } else {
          // Create new user
          await supabase.from('users').insert({
            id: crypto.randomUUID(),
            clerk_id: id,
            email,
            agency_name: [first_name, last_name].filter(Boolean).join(' ') || null,
          });
        }
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = event.data as {
          id: string;
          email_addresses?: Array<{ email_address: string }>;
          first_name?: string;
          last_name?: string;
        };

        const email = email_addresses?.[0]?.email_address;
        if (!email) break;

        await supabase
          .from('users')
          .update({
            email,
            agency_name: [first_name, last_name].filter(Boolean).join(' ') || null,
          })
          .eq('clerk_id', id);
        break;
      }

      case 'user.deleted': {
        const { id } = event.data as { id: string };
        await supabase.from('users').delete().eq('clerk_id', id);
        break;
      }

      case 'session.created': {
        const { user_id } = event.data as { user_id: string };
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('clerk_id', user_id);
        break;
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return new Response('Handler error', { status: 500 });
  }
}

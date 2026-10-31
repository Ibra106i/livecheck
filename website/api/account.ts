import { supabase, corsHeaders, jsonError, jsonResponse } from './_clerk.js';
import { resolveUser } from './_identity.js';

// In-app account deletion (plan sections 10 and 13; required by Play).
// Purges every organization-scoped row the user can reach, then their personal
// organizations, then the user row. Tables that cascade from users
// (memberships, device_tokens, user_identities, projects, reports) are covered.
const ORG_SCOPED = [
  'review_bookings',
  'scan_schedules',
  'scan_jobs',
  'drift_events',
  'sites',
  'reports',
  'projects',
  'subscriptions',
  'credit_ledger',
  'play_purchases',
  'invitations',
  'roles',
  'sso_providers',
  'domain_verifications',
  'audit_logs',
] as const;

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'DELETE') return jsonError('Method not allowed', 405, headers);
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const user = await resolveUser(req);
  if (!user) return jsonError('Unauthorized', 401, headers);

  try {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.userId);
    const orgIds = (memberships || []).map((m) => m.organization_id as string).filter(Boolean);

    if (orgIds.length > 0) {
      // review_annotations keys on booking_id, so drop it via the user's bookings.
      const { data: bookings } = await supabase
        .from('review_bookings')
        .select('id')
        .in('organization_id', orgIds);
      const bookingIds = (bookings || []).map((b) => b.id as string);
      if (bookingIds.length > 0) {
        await supabase.from('review_annotations').delete().in('booking_id', bookingIds);
      }

      for (const table of ORG_SCOPED) {
        const { error } = await supabase.from(table).delete().in('organization_id', orgIds);
        if (error) console.error(`delete from ${table} failed:`, error.message);
      }

      // Only drop an organization when this is its last membership.
      for (const orgId of orgIds) {
        const { count } = await supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId);
        if (!count || count <= 1) {
          await supabase.from('organizations').delete().eq('id', orgId);
        }
      }
    }

    await supabase.from('device_tokens').delete().eq('user_id', user.userId);
    const { error: userError } = await supabase.from('users').delete().eq('id', user.userId);
    if (userError) return jsonError(userError.message, 500, headers);

    return jsonResponse({ ok: true, message: 'Account deleted' }, 200, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('account deletion error:', err);
    return jsonError(message, 500, headers);
  }
}

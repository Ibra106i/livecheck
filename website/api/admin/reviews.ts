import { supabase, corsHeaders, jsonError, jsonResponse } from '../_clerk.js';
import { resolveUser } from '../_identity.js';

// Reviewer console (plan section 9). Cross-tenant, privileged surface, so it is
// gated by an explicit allowlist rather than org membership.
function reviewerAllowlist(): string[] {
  return (process.env.REVIEWER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

interface AnnotationInput {
  check_id: string;
  severity: string;
  note: string;
  fix_guidance?: string;
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const user = await resolveUser(req);
  if (!user) return jsonError('Unauthorized', 401, headers);

  const allowlist = reviewerAllowlist();
  if (allowlist.length === 0) return jsonError('Reviewer access is not configured', 403, headers);
  if (!allowlist.includes(user.email.toLowerCase())) return jsonError('Not a reviewer', 403, headers);

  try {
    if (req.method === 'GET') {
      const status = new URL(req.url).searchParams.get('status');
      let query = supabase
        .from('review_bookings')
        .select('id, organization_id, site_url, tier, status, deadline_at, assigned_to, delivered_at, created_at, organizations(name)')
        .order('deadline_at', { ascending: true });
      if (status === 'unclaimed') {
        query = query.is('assigned_to', null).in('status', ['awaiting_scan', 'queued']);
      } else if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.limit(200);
      if (error) return jsonError(error.message, 500, headers);

      // Flag bookings past deadline so the reviewer sees SLA breaches.
      const now = Date.now();
      const reviews = (data || []).map((b) => ({ ...b, overdue: !b.delivered_at && new Date(b.deadline_at).getTime() < now }));
      return jsonResponse({ reviews }, 200, headers);
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as {
        action?: string;
        bookingId?: string;
        annotations?: AnnotationInput[];
      };
      const { action, bookingId } = body;
      if (!action || !bookingId) return jsonError('action and bookingId are required', 400, headers);

      const { data: booking } = await supabase
        .from('review_bookings')
        .select('id, status, assigned_to')
        .eq('id', bookingId)
        .maybeSingle();
      if (!booking) return jsonError('Booking not found', 404, headers);
      if (booking.status === 'canceled' || booking.status === 'delivered') {
        return jsonError('Booking is closed', 409, headers);
      }

      if (action === 'claim') {
        if (booking.assigned_to && booking.assigned_to !== user.userId) {
          return jsonError('Already claimed by another reviewer', 409, headers);
        }
        const { data, error } = await supabase
          .from('review_bookings')
          .update({ assigned_to: user.userId, status: 'in_review' })
          .eq('id', bookingId)
          .select('id, status, assigned_to')
          .single();
        if (error) return jsonError(error.message, 500, headers);
        return jsonResponse({ review: data }, 200, headers);
      }

      if (action === 'annotate') {
        const annotations = Array.isArray(body.annotations) ? body.annotations : [];
        await supabase.from('review_annotations').delete().eq('booking_id', bookingId);
        if (annotations.length > 0) {
          const rows = annotations
            .filter((a) => a.check_id && a.severity && a.note)
            .map((a) => ({
              booking_id: bookingId,
              check_id: a.check_id,
              severity: a.severity,
              note: a.note,
              fix_guidance: a.fix_guidance || null,
            }));
          if (rows.length > 0) {
            const { error } = await supabase.from('review_annotations').insert(rows);
            if (error) return jsonError(error.message, 500, headers);
          }
        }
        const { data, error } = await supabase
          .from('review_bookings')
          .update({ status: 'in_review', assigned_to: user.userId })
          .eq('id', bookingId)
          .select('id, status')
          .single();
        if (error) return jsonError(error.message, 500, headers);
        return jsonResponse({ review: data, annotated: annotations.length }, 200, headers);
      }

      if (action === 'deliver') {
        const { count } = await supabase
          .from('review_annotations')
          .select('id', { count: 'exact', head: true })
          .eq('booking_id', bookingId);
        if (!count) return jsonError('Add annotations before delivering', 400, headers);

        const { data, error } = await supabase
          .from('review_bookings')
          .update({ status: 'delivered', delivered_at: new Date().toISOString() })
          .eq('id', bookingId)
          .select('id, status, delivered_at')
          .single();
        if (error) return jsonError(error.message, 500, headers);
        return jsonResponse({ review: data }, 200, headers);
      }

      return jsonError('Unknown action', 400, headers);
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('admin/reviews API error:', err);
    return jsonError(message, 500, headers);
  }
}

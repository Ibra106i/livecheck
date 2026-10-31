import { supabase, corsHeaders, jsonError, jsonResponse } from './_clerk.js';
import { getTenantContext } from './_tenant.js';

// Expert-reviewed report bookings (plan section 9). "Booking" = a review queue
// entry with a deadline tier, not a live appointment. Tier comes from the
// review product actually purchased.
const TIER_BUSINESS_DAYS: Record<string, number> = { review_standard: 5, review_priority: 2 };
const TIER_NAME: Record<string, 'standard' | 'priority'> = {
  review_standard: 'standard',
  review_priority: 'priority',
};

function addBusinessDays(days: number): string {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toISOString();
}

function normalize(raw: string): string {
  const url = raw.trim();
  return url.startsWith('http') ? url : 'https://' + url;
}

async function pickUnusedReviewPurchase(orgId: string): Promise<{ id: string; product_id: string } | null> {
  const { data: purchases } = await supabase!
    .from('play_purchases')
    .select('id, product_id')
    .eq('organization_id', orgId)
    .in('product_id', ['review_standard', 'review_priority'])
    .in('state', ['verified', 'acknowledged', 'consumed'])
    .order('created_at', { ascending: true });
  if (!purchases || purchases.length === 0) return null;

  const ids = purchases.map((p) => p.id as string);
  const { data: used } = await supabase!
    .from('review_bookings')
    .select('purchase_id')
    .in('purchase_id', ids)
    .neq('status', 'canceled');
  const usedSet = new Set((used || []).map((u) => u.purchase_id as string));
  const free = purchases.find((p) => !usedSet.has(p.id as string));
  return free ? { id: free.id as string, product_id: free.product_id as string } : null;
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const tenant = await getTenantContext(req);
  if (!tenant) return jsonError('Unauthorized', 401, headers);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('review_bookings')
        .select('id, site_url, tier, status, deadline_at, assigned_to, delivered_at, created_at')
        .eq('organization_id', tenant.orgId)
        .order('created_at', { ascending: false });
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ reviews: data || [] }, 200, headers);
    }

    if (req.method === 'POST') {
      const { url } = (await req.json()) as { url?: string };
      if (!url || !url.trim()) return jsonError('url is required', 400, headers);

      const purchase = await pickUnusedReviewPurchase(tenant.orgId);
      if (!purchase) {
        return jsonError('No review credit available — buy an expert review in the app', 402, headers);
      }

      const tier = TIER_NAME[purchase.product_id];
      const deadlineAt = addBusinessDays(TIER_BUSINESS_DAYS[purchase.product_id]);
      const siteUrl = normalize(url);

      const { data: booking, error } = await supabase
        .from('review_bookings')
        .insert({
          organization_id: tenant.orgId,
          user_id: tenant.userId,
          site_url: siteUrl,
          tier,
          purchase_id: purchase.id,
          status: 'awaiting_scan',
          deadline_at: deadlineAt,
        })
        .select('id, site_url, tier, status, deadline_at, created_at')
        .single();
      if (error) return jsonError(error.message, 500, headers);

      // Queue an automated scan the reviewer will annotate (plan section 9).
      const { data: job } = await supabase
        .from('scan_jobs')
        .insert({
          organization_id: tenant.orgId,
          user_id: tenant.userId,
          url: siteUrl,
          trigger: 'review',
          status: 'queued',
        })
        .select('id')
        .single();
      if (job?.id) {
        await supabase.from('review_bookings').update({ scan_job_id: job.id, status: 'queued' }).eq('id', booking.id);
      }

      await supabase.from('play_purchases').update({ state: 'consumed' }).eq('id', purchase.id);

      return jsonResponse({ review: { ...booking, scan_job_id: job?.id || null }, message: 'Review booked' }, 201, headers);
    }

    if (req.method === 'DELETE') {
      const id = new URL(req.url).searchParams.get('id');
      if (!id) return jsonError('id is required', 400, headers);
      const { data: booking } = await supabase
        .from('review_bookings')
        .select('id, status')
        .eq('id', id)
        .eq('organization_id', tenant.orgId)
        .maybeSingle();
      if (!booking) return jsonError('Not found', 404, headers);
      if (booking.status === 'in_review' || booking.status === 'delivered') {
        return jsonError('Review already started — contact support', 409, headers);
      }
      const { error } = await supabase.from('review_bookings').update({ status: 'canceled' }).eq('id', id);
      if (error) return jsonError(error.message, 500, headers);
      return jsonResponse({ ok: true }, 200, headers);
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('reviews API error:', err);
    return jsonError(message, 500, headers);
  }
}

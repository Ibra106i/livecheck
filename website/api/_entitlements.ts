import { supabase } from './_clerk.js';

export interface Entitlements {
  credits: number;
  reviewsAvailable: number;
  subscription: {
    product_id: string;
    status: string;
    current_period_end: string | null;
    auto_renew: boolean | null;
  } | null;
}

const SUB_ACTIVE = ['active', 'grace'];

/**
 * Balance model: credit_ledger deltas are additive and never deleted.
 * A scan reserve is a -1 that a successful scan keeps and a failed scan
 * releases with a +1 scan_refund, so `sum(delta)` is always the spendable
 * balance without needing a separate holds table.
 */
export async function getEntitlements(organizationId: string): Promise<Entitlements> {
  if (!supabase) return { credits: 0, reviewsAvailable: 0, subscription: null };

  const [{ data: ledger }, { data: reviewPurchases }, { data: subs }] = await Promise.all([
    supabase.from('credit_ledger').select('delta').eq('organization_id', organizationId),
    supabase
      .from('play_purchases')
      .select('id, product_id, state')
      .eq('organization_id', organizationId)
      .in('state', ['verified', 'acknowledged', 'consumed']),
    supabase
      .from('subscriptions')
      .select('product_id, status, current_period_end, auto_renew')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false }),
  ]);

  const credits = (ledger || []).reduce((sum, row) => sum + (row.delta as number), 0);

  // Review entitlement = a paid, review-plan purchase that has no booking yet.
  const reviewIds = (reviewPurchases || [])
    .filter((p) => p.product_id === 'review_standard' || p.product_id === 'review_priority')
    .map((p) => p.id as string);

  let reviewsAvailable = reviewIds.length;
  if (reviewIds.length > 0) {
    const { data: bookings } = await supabase
      .from('review_bookings')
      .select('purchase_id')
      .in('purchase_id', reviewIds)
      .neq('status', 'canceled');
    const used = new Set((bookings || []).map((b) => b.purchase_id as string));
    reviewsAvailable = reviewIds.filter((id) => !used.has(id)).length;
  }

  const active = (subs || []).find(
    (s) =>
      SUB_ACTIVE.includes(s.status as string) &&
      (!s.current_period_end || new Date(s.current_period_end as string).getTime() > Date.now())
  );

  return {
    credits,
    reviewsAvailable,
    subscription: active
      ? {
          product_id: active.product_id as string,
          status: active.status as string,
          current_period_end: (active.current_period_end as string) || null,
          auto_renew: (active.auto_renew as boolean) ?? null,
        }
      : null,
  };
}

/** Grant credits for a purchase exactly once (guarded by the ledger unique index). */
export async function grantCredits(
  organizationId: string,
  userId: string,
  purchaseId: string,
  credits: number,
  reason = 'purchase'
): Promise<boolean> {
  if (!supabase || credits <= 0) return false;

  const { data: existing } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('purchase_id', purchaseId)
    .eq('reason', reason)
    .maybeSingle();
  if (existing) return false;

  const { error } = await supabase.from('credit_ledger').insert({
    organization_id: organizationId,
    user_id: userId,
    delta: credits,
    reason,
    purchase_id: purchaseId,
  });
  return !error;
}

/** Revoke unused credits when a purchase is refunded/voided (reason refund_revoke). */
export async function revokeCredits(
  organizationId: string,
  userId: string | null,
  purchaseId: string,
  credits: number
): Promise<boolean> {
  if (!supabase || credits <= 0) return false;

  const { data: existing } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('purchase_id', purchaseId)
    .eq('reason', 'refund_revoke')
    .maybeSingle();
  if (existing) return false;

  const { error } = await supabase.from('credit_ledger').insert({
    organization_id: organizationId,
    user_id: userId,
    delta: -credits,
    reason: 'refund_revoke',
    purchase_id: purchaseId,
  });
  return !error;
}

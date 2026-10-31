import {
  supabase,
  corsHeaders,
  jsonError,
  jsonResponse,
  verifyClerkToken,
} from '../_clerk.js';
import { getTenantContext } from '../_tenant.js';
import {
  getProductPurchase,
  getSubscriptionPurchase,
  acknowledgeProduct,
  consumeProduct,
  acknowledgeSubscription,
  packageName,
} from '../_play.js';
import { getEntitlements, grantCredits } from '../_entitlements.js';

interface PurchaseState {
  state: string;
  message: string;
}

// Play returns these as non-fatal when we (re-)apply an idempotent action.
function isAlreadySettled(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /acknowledg|consumed|already/i.test(msg);
}

async function upsertPurchase(row: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase!
    .from('play_purchases')
    .upsert(row, { onConflict: 'purchase_token' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405, headers);
  if (!supabase) return jsonError('Database not configured', 503, headers);

  const tenant = await getTenantContext(req);
  if (!tenant) return jsonError('Unauthorized', 401, headers);

  const auth = await verifyClerkToken(req);
  if (!auth) return jsonError('Unauthorized', 401, headers);

  let body: { productId?: string; purchaseToken?: string; obfuscatedAccountId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400, headers);
  }

  const { productId, purchaseToken, obfuscatedAccountId } = body;
  if (!productId || !purchaseToken) {
    return jsonError('productId and purchaseToken are required', 400, headers);
  }

  // The purchase must belong to the signed-in Clerk account (obfuscated ID set
  // by the app at billing-flow launch).
  if (obfuscatedAccountId && obfuscatedAccountId !== auth.userId) {
    return jsonError('Account mismatch', 403, headers);
  }

  const { data: product } = await supabase
    .from('play_products')
    .select('product_id, type, credits, plan, active')
    .eq('product_id', productId)
    .single();
  if (!product) return jsonError('Unknown product', 400, headers);
  if (!product.active) return jsonError('Product unavailable', 409, headers);

  try {
    if (product.type === 'subscription') {
      const sub = await getSubscriptionPurchase(purchaseToken);
      const activeStates = ['PURCHASED', 'IN_GRACE_PERIOD', 'ON_HOLD', 'PAUSED', 'PENDING_PURCHASE'];
      if (!sub.state || !activeStates.includes(sub.state)) {
        return jsonError('Subscription is not active', 402, headers);
      }
      if (!sub.acknowledgementState?.acknowledged) {
        try { await acknowledgeSubscription(purchaseToken); } catch (e) { if (!isAlreadySettled(e)) throw e; }
      }
      const status = sub.state === 'IN_GRACE_PERIOD' ? 'grace' : 'active';
      await supabase.from('subscriptions').upsert(
        {
          purchase_token: purchaseToken,
          product_id: productId,
          organization_id: tenant.orgId,
          user_id: tenant.userId,
          status,
          current_period_end: sub.expiryTime || null,
          auto_renew: true,
          raw: sub,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'purchase_token' }
      );

      const state: PurchaseState = { state: 'acknowledged', message: 'Subscription active' };
      return jsonResponse({ status: state.state, message: state.message, entitlements: await getEntitlements(tenant.orgId) }, 200, headers);
    }

    // One-time consumables (scan credits) and review products.
    const purchase = await getProductPurchase(productId, purchaseToken);

    if (purchase.purchaseState === 2) {
      return jsonResponse({ status: 'pending', message: 'Purchase pending', entitlements: await getEntitlements(tenant.orgId) }, 200, headers);
    }
    if (purchase.purchaseState !== 0) {
      return jsonError('Purchase not completed', 402, headers);
    }

    const purchaseId = await upsertPurchase({
      purchase_token: purchaseToken,
      product_id: productId,
      organization_id: tenant.orgId,
      user_id: tenant.userId,
      obfuscated_account_id: auth.userId,
      order_id: purchase.orderId || null,
      state: 'verified',
      purchased_at: purchase.purchaseTimeMillis ? new Date(Number(purchase.purchaseTimeMillis)).toISOString() : new Date().toISOString(),
      verified_at: new Date().toISOString(),
      raw: purchase,
    });

    // Grant scan credits (0 for review products — their entitlement is the
    // verified purchase itself).
    const credits = (product.credits as number) || 0;
    if (credits > 0) await grantCredits(tenant.orgId, tenant.userId, purchaseId, credits);

    // Acknowledge then consume; both are idempotent.
    let finalState = 'verified';
    if (purchase.acknowledgementState === 0) {
      try { await acknowledgeProduct(productId, purchaseToken); finalState = 'acknowledged'; }
      catch (e) { if (!isAlreadySettled(e)) throw e; }
    } else {
      finalState = 'acknowledged';
    }

    // Consumables for scans are consumed so they don't auto-refund after 3 days.
    // Review products stay unconsumed so they can be refunded before the review starts.
    if (product.plan !== 'review' && purchase.consumptionState === 0) {
      try { await consumeProduct(productId, purchaseToken); finalState = 'consumed'; }
      catch (e) { if (!isAlreadySettled(e)) throw e; }
    }

    await supabase.from('play_purchases').update({ state: finalState }).eq('id', purchaseId);

    return jsonResponse({
      status: finalState,
      message: 'Purchase verified',
      packageName: packageName(),
      entitlements: await getEntitlements(tenant.orgId),
    }, 200, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    console.error('billing/verify error:', err);
    return jsonError(message, 502, headers);
  }
}

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { supabase, corsHeaders, jsonError } from '../_clerk.js';
import { getProductPurchase, getSubscriptionPurchase } from '../_play.js';
import { grantCredits, revokeCredits, getEntitlements } from '../_entitlements.js';

// Google issues the Pub/Sub push OIDC token from these issuers; verify its signature.
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

interface RtdnMessage {
  data: string;
  messageId: string;
}
interface RtdnPayload {
  message?: RtdnMessage;
}
interface Notification {
  packageName?: string;
  version?: string;
  oneTimeProductNotification?: { version?: string; notificationType?: number; purchaseToken?: string; sku?: string };
  subscriptionNotification?: { version?: string; notificationType?: number; purchaseToken?: string; subscriptionId?: string };
  voidedPurchaseNotification?: { purchaseToken?: string; orderId?: string; productType?: number; refundType?: number };
  testNotification?: boolean;
}

async function verifyOidc(req: Request): Promise<boolean> {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUERS });
    const audience = process.env.RTDN_AUDIENCE;
    if (audience && payload.aud !== audience) return false;
    return true;
  } catch {
    return false;
  }
}

const SUB_STATUS: Record<number, string> = {
  1: 'active', // RECOVERED
  2: 'active', // RENEWED
  3: 'active', // PURCHASED
  4: 'canceled', // CANCELED (auto-renew off, still active until period end)
  5: 'active', // PENDING_PURCHASE
  6: 'canceled', // PURGED
  7: 'on_hold', // ON_HOLD
  8: 'grace', // IN_GRACE_PERIOD
  9: 'active', // RESTARTED
  10: 'expired', // EXPIRED
  11: 'paused', // PAUSED
  12: 'active', // PAUSE_RESUMED
};

async function creditFor(sku: string): Promise<number> {
  const { data } = await supabase!.from('play_products').select('credits').eq('product_id', sku).single();
  return (data?.credits as number) || 0;
}

async function handleOneTime(note: NonNullable<Notification['oneTimeProductNotification']>): Promise<void> {
  if (!note.purchaseToken || !note.sku) return;
  const { data: purchase } = await supabase!
    .from('play_purchases')
    .select('id, organization_id, user_id')
    .eq('purchase_token', note.purchaseToken)
    .maybeSingle();

  // RTDN cannot attribute an unverified one-time purchase to an org, so only
  // grant against the row /api/billing/verify already created.
  if (note.notificationType === 1 && purchase) {
    const p = await getProductPurchase(note.sku, note.purchaseToken);
    if (p.purchaseState !== 0) return;
    await grantCredits(
      purchase.organization_id as string,
      purchase.user_id as string,
      purchase.id as string,
      await creditFor(note.sku)
    );
    await supabase!.from('play_purchases').update({ state: 'verified', raw: p }).eq('id', purchase.id);
  }
}

async function handleVoided(note: NonNullable<Notification['voidedPurchaseNotification']>): Promise<void> {
  if (!note.purchaseToken) return;
  const { data: purchase } = await supabase!
    .from('play_purchases')
    .select('id, organization_id, user_id, product_id')
    .eq('purchase_token', note.purchaseToken)
    .maybeSingle();
  if (!purchase) return;

  const entitlements = await getEntitlements(purchase.organization_id as string);
  const granted = await creditFor(purchase.product_id as string);
  // Revoke only the unused remainder; never claw back already-consumed scans.
  const toRevoke = Math.max(0, Math.min(granted, entitlements.credits));
  if (toRevoke > 0) {
    await revokeCredits(purchase.organization_id as string, purchase.user_id as string, purchase.id as string, toRevoke);
  }
  await supabase!.from('play_purchases').update({ state: 'revoked' }).eq('id', purchase.id);
}

async function handleSubscription(note: NonNullable<Notification['subscriptionNotification']>): Promise<void> {
  if (!note.purchaseToken) return;
  const status = SUB_STATUS[note.notificationType ?? -1] || 'active';
  try {
    const sub = await getSubscriptionPurchase(note.purchaseToken);
    const { data: existing } = await supabase!
      .from('subscriptions')
      .select('organization_id, user_id, product_id')
      .eq('purchase_token', note.purchaseToken)
      .maybeSingle();
    const org = existing?.organization_id as string;
    const user = existing?.user_id as string;
    if (!org || !user) return; // cannot attribute a subscription we never saw
    await supabase!
      .from('subscriptions')
      .upsert(
        {
          purchase_token: note.purchaseToken,
          organization_id: org,
          user_id: user,
          product_id: existing?.product_id || note.subscriptionId || '',
          status,
          current_period_end: sub.expiryTime || null,
          auto_renew: status === 'active' || status === 'grace',
          raw: sub,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'purchase_token' }
      );
  } catch (err) {
    console.error('RTDN subscription handling failed:', err);
  }
}

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405, headers);
  if (!supabase) return jsonError('Database not configured', 503, headers);

  if (!(await verifyOidc(req))) {
    return jsonError('Unauthorized RTDN caller', 401, headers);
  }

  let envelope: RtdnPayload;
  try {
    envelope = (await req.json()) as RtdnPayload;
  } catch {
    return jsonError('Invalid payload', 400, headers);
  }

  const message = envelope.message;
  if (!message?.data || !message.messageId) return jsonError('Malformed Pub/Sub envelope', 400, headers);

  // Idempotency: a replayed messageId has already been processed.
  const { error: dupError } = await supabase
    .from('play_events')
    .insert({ message_id: message.messageId, type: 'rtdn' });
  if (dupError) return new Response('OK (deduped)', { status: 200, headers });

  let note: Notification;
  try {
    note = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8')) as Notification;
  } catch {
    return jsonError('Undecodable notification data', 400, headers);
  }

  try {
    if (note.oneTimeProductNotification) await handleOneTime(note.oneTimeProductNotification);
    if (note.voidedPurchaseNotification) await handleVoided(note.voidedPurchaseNotification);
    if (note.subscriptionNotification) await handleSubscription(note.subscriptionNotification);
    // testNotification: acknowledged above by the dedupe insert; nothing to do.
    return new Response('OK', { status: 200, headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'RTDN processing failed';
    console.error('billing/rtdn error:', err);
    // 500 so Pub/Sub retries the delivery.
    return jsonError(msg, 500, headers);
  }
}

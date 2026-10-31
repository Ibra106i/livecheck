import { SignJWT, importPKCS8 } from 'jose';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cache: CachedToken | null = null;

export function packageName(): string {
  return process.env.GOOGLE_PLAY_PACKAGE_NAME || '';
}

function readServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set');
  const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Invalid service account JSON: missing client_email or private_key');
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

/** Mint (and cache) an OAuth2 access token by exchanging a signed JWT assertion. */
export async function getAccessToken(): Promise<string> {
  if (cache && cache.expiresAt - Date.now() > 60_000) return cache.token;

  const sa = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(sa.private_key, 'RS256');

  const assertion = await new SignJWT({ scope: SCOPE, audience: TOKEN_ENDPOINT })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Play token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cache.token;
}

async function playFetch(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Play API ${res.status} for ${path}: ${text}`);
  }
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

function encoded(pkg: string): string {
  return encodeURIComponent(pkg);
}

export interface ProductPurchase {
  purchaseState?: number; // 0=purchased, 1=canceled, 2=pending
  consumptionState?: number; // 0=unconsumed, 1=consumed
  acknowledgementState?: number; // 0=unacknowledged, 1=acknowledged
  orderId?: string;
  purchaseTimeMillis?: string;
  productId?: string;
}

export async function getProductPurchase(
  productId: string,
  purchaseToken: string
): Promise<ProductPurchase> {
  return (await playFetch(
    `/${encoded(packageName())}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`
  )) as ProductPurchase;
}

export async function acknowledgeProduct(productId: string, purchaseToken: string): Promise<void> {
  await playFetch(
    `/${encoded(packageName())}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    { method: 'POST' }
  );
}

export async function consumeProduct(productId: string, purchaseToken: string): Promise<void> {
  await playFetch(
    `/${encoded(packageName())}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:consume`,
    { method: 'POST' }
  );
}

export interface SubscriptionPurchaseV2 {
  state?: string; // e.g. PURCHASED, CANCELED, IN_GRACE_PERIOD, ON_HOLD, PAUSED, EXPIRED, PENDING, AWAITING_FULFILLMENT, TERMINATED
  orderId?: string;
  productIds?: string[];
  startTime?: string;
  expiryTime?: string;
  acknowledgementState?: { acknowledged?: boolean };
  subscriptionState?: string;
  isTestPayer?: boolean;
}

export async function getSubscriptionPurchase(purchaseToken: string): Promise<SubscriptionPurchaseV2> {
  return (await playFetch(
    `/${encoded(packageName())}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`
  )) as SubscriptionPurchaseV2;
}

export async function acknowledgeSubscription(purchaseToken: string): Promise<void> {
  await playFetch(
    `/${encoded(packageName())}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    { method: 'POST' }
  );
}

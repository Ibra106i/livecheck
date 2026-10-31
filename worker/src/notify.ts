// Outbound alerts for the worker: FCM HTTP v1 push and Resend email. Both are
// env-gated no-ops, so local and CI runs complete scans without sending
// anything and never crash on missing credentials.

import { createSign } from 'node:crypto';

const OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

interface FirebaseServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

function readServiceAccount(): FirebaseServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let parsed: Partial<FirebaseServiceAccount>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    return null;
  }
  if (!parsed.client_email || !parsed.private_key) {
    console.error('Firebase service account missing client_email or private_key');
    return null;
  }
  return parsed as FirebaseServiceAccount;
}

function base64url(value: object | string): string {
  const buf = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(JSON.stringify(value));
  return buf.toString('base64url');
}

// RS256 JWT assertion signed with the service account key, exchanged for an
// OAuth2 access token at the Google token endpoint.
async function getAccessToken(sa: FirebaseServiceAccount): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - Date.now() > 60_000) return tokenCache.token;

  const now = Math.floor(Date.now() / 1000);
  const signingInput = `${base64url({ alg: 'RS256', typ: 'JWT' })}.${base64url({
    iss: sa.client_email,
    sub: sa.client_email,
    scope: FCM_SCOPE,
    aud: OAUTH_TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  })}`;

  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(sa.private_key).toString('base64url');
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(OAUTH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`FCM token exchange failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return tokenCache.token;
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Returns the number of tokens FCM accepted. */
export async function sendPush(tokens: string[], message: PushMessage): Promise<number> {
  if (tokens.length === 0) return 0;
  const sa = readServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || sa?.project_id;
  if (!sa || !projectId) return 0;

  let accessToken: string;
  try {
    accessToken = await getAccessToken(sa);
  } catch (err) {
    console.error('FCM auth failed:', err instanceof Error ? err.message : err);
    return 0;
  }

  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  let delivered = 0;

  for (const token of tokens) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: message.title, body: message.body },
            data: message.data,
            android: { priority: 'HIGH' },
          },
        }),
      });
      if (res.ok) {
        delivered += 1;
      } else {
        console.error(`FCM send ${res.status} for one token: ${await res.text()}`);
      }
    } catch (err) {
      console.error('FCM send error:', err instanceof Error ? err.message : err);
    }
  }

  return delivered;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from || !message.to) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html }),
    });
    if (!res.ok) {
      console.error(`Resend ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend error:', err instanceof Error ? err.message : err);
    return false;
  }
}

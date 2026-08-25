import type { FetchedPage } from './types';

export function normalizeUrl(raw: string): URL {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

export async function fetchPage(url: URL, timeoutMs: number): Promise<FetchedPage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    const ttfbMs = Date.now() - started;
    const html = await res.text();
    return { status: res.status, headers: res.headers, html, ttfbMs };
  } finally {
    clearTimeout(timer);
  }
}

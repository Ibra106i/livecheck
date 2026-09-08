import type { FetchedPage } from './types';
import { fetchPageSafe } from './ssrf';

export function normalizeUrl(raw: string): URL {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

export { detectBotChallenge } from './ssrf';

export async function fetchPage(url: URL, timeoutMs: number): Promise<FetchedPage> {
  return fetchPageSafe(url, timeoutMs);
}

import dns from 'node:dns';
import net from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

const RESTRICTED_V4_RANGES: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
];

function ipv4ToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function cidrContains(base: string, prefixLen: number, ip: string): boolean {
  const baseNum = ipv4ToNumber(base);
  const ipNum = ipv4ToNumber(ip);
  const mask = prefixLen === 0 ? 0 : ~((1 << (32 - prefixLen)) - 1);
  return (baseNum & mask) === (ipNum & mask);
}

export function isRestrictedIpv4(ip: string): boolean {
  for (const [base, prefix] of RESTRICTED_V4_RANGES) {
    if (cidrContains(base, prefix, ip)) {
      return true;
    }
  }
  return false;
}

export function isRestrictedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  if (lower === '::1') {
    return true;
  }

  if (lower.startsWith('::ffff:')) {
    const embedded = lower.replace('::ffff:', '');
    if (embedded.includes(':')) return false;
    return isRestrictedIpv4(embedded);
  }

  if (lower.startsWith('fc') || lower.startsWith('fd')) {
    return true;
  }

  if (lower.startsWith('fe80:')) {
    return true;
  }

  return false;
}

export function createSsrfSafeAgent(): Agent {
  return new Agent({
    connect: {
      lookup: (hostname, _options, callback) => {
        dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
          if (err) return callback(err, []);
          const safe = addresses.filter(
            (a) => !(a.family === 4 ? isRestrictedIpv4(a.address) : isRestrictedIpv6(a.address))
          );
          if (safe.length === 0) {
            return callback(
              new Error(`SSRF_BLOCKED: ${hostname} resolves only to restricted network addresses`),
              []
            );
          }
          callback(null, safe);
        });
      },
    },
  });
}

const SSRF_SAFE_AGENT = createSsrfSafeAgent();

export async function fetchPageSafe(url: URL, timeoutMs: number): Promise<{
  status: number;
  headers: Headers;
  html: string;
  ttfbMs: number;
  isBlocked?: boolean;
}> {
  const hostname = url.hostname.startsWith('[') && url.hostname.endsWith(']')
    ? url.hostname.slice(1, -1)
    : url.hostname;
  if (net.isIP(hostname)) {
    const restricted = net.isIP(hostname) === 6
      ? isRestrictedIpv6(hostname)
      : isRestrictedIpv4(hostname);
    if (restricted) {
      throw new Error(`SSRF_BLOCKED: ${hostname} is a restricted network address`);
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await undiciFetch(url.toString(), {
      dispatcher: SSRF_SAFE_AGENT,
      signal: controller.signal,
      redirect: 'follow',
    });
    const ttfbMs = Date.now() - started;
    const html = await res.text();
    const headers = new Headers();
    for (const [key, value] of res.headers.entries()) {
      headers.append(key, value);
    }
    const isBlocked = detectBotChallenge(res.status, headers, html);
    return { status: res.status, headers, html, ttfbMs, isBlocked };
  } finally {
    clearTimeout(timer);
  }
}

export function detectBotChallenge(status: number, headers: Headers, html: string): boolean {
  const server = (headers.get('server') ?? '').toLowerCase();
  const cfMitigated = headers.get('cf-mitigated');

  if (cfMitigated) return true;

  const lowerHtml = html.toLowerCase();
  const isCloudflare = server.includes('cloudflare');

  const cloudflareChallengePhrases = [
    'attention required',
    'checking your browser',
    'just a moment',
    'ddos protection by',
    'enable javascript and cookies',
    'ray id:',
  ];

  if ((status === 403 || status === 503) && isCloudflare) {
    for (const phrase of cloudflareChallengePhrases) {
      if (lowerHtml.includes(phrase)) {
        return true;
      }
    }
  }

  if (status === 403 || status === 503) {
    const challengeTitlePatterns = [
      '<title>attention required',
      '<title>just a moment',
      '<title>access denied',
    ];

    const hasChallengeTitle = challengeTitlePatterns.some((pattern) => lowerHtml.includes(pattern));
    const hasCloudflareRayId = lowerHtml.includes('cloudflare') && lowerHtml.includes('ray id');

    const genericChallengeBodyPhrases = [
      'enable javascript',
      'checking your browser',
      'ddos protection',
      'please wait',
      'ray id:',
    ];

    const hasChallengeBody = genericChallengeBodyPhrases.some((phrase) => lowerHtml.includes(phrase));

    if (hasChallengeTitle && (hasChallengeBody || hasCloudflareRayId)) {
      return true;
    }
  }

  return false;
}


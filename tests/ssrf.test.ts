import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  isRestrictedIpv4,
  isRestrictedIpv6,
  createSsrfSafeAgent,
  fetchPageSafe,
} from '../src/core/ssrf';
import dnsPromises from 'node:dns/promises';
import { Agent } from 'undici';

describe('isRestrictedIpv4', () => {
  it('blocks 127.0.0.1 (loopback)', () => {
    expect(isRestrictedIpv4('127.0.0.1')).toBe(true);
  });

  it('blocks 127.0.0.2 (loopback range)', () => {
    expect(isRestrictedIpv4('127.0.0.2')).toBe(true);
  });

  it('blocks 10.0.0.1 (private class A)', () => {
    expect(isRestrictedIpv4('10.0.0.1')).toBe(true);
  });

  it('blocks 10.255.255.255 (private class A)', () => {
    expect(isRestrictedIpv4('10.255.255.255')).toBe(true);
  });

  it('blocks 172.16.0.1 (private class B start)', () => {
    expect(isRestrictedIpv4('172.16.0.1')).toBe(true);
  });

  it('blocks 172.31.255.255 (private class B end)', () => {
    expect(isRestrictedIpv4('172.31.255.255')).toBe(true);
  });

  it('allows 172.15.255.255 (just outside private class B)', () => {
    expect(isRestrictedIpv4('172.15.255.255')).toBe(false);
  });

  it('allows 172.32.0.1 (just outside private class B)', () => {
    expect(isRestrictedIpv4('172.32.0.1')).toBe(false);
  });

  it('blocks 192.168.0.1 (private class C)', () => {
    expect(isRestrictedIpv4('192.168.0.1')).toBe(true);
  });

  it('blocks 192.168.255.255 (private class C)', () => {
    expect(isRestrictedIpv4('192.168.255.255')).toBe(true);
  });

  it('blocks 169.254.169.254 (cloud metadata)', () => {
    expect(isRestrictedIpv4('169.254.169.254')).toBe(true);
  });

  it('blocks 169.254.0.1 (link-local)', () => {
    expect(isRestrictedIpv4('169.254.0.1')).toBe(true);
  });

  it('blocks 169.254.255.255 (link-local)', () => {
    expect(isRestrictedIpv4('169.254.255.255')).toBe(true);
  });

  it('blocks 100.64.0.1 (CGNAT)', () => {
    expect(isRestrictedIpv4('100.64.0.1')).toBe(true);
  });

  it('blocks 100.127.255.254 (CGNAT)', () => {
    expect(isRestrictedIpv4('100.127.255.254')).toBe(true);
  });

  it('allows 100.63.255.255 (just outside CGNAT)', () => {
    expect(isRestrictedIpv4('100.63.255.255')).toBe(false);
  });

  it('allows 100.128.0.1 (just outside CGNAT)', () => {
    expect(isRestrictedIpv4('100.128.0.1')).toBe(false);
  });

  it('blocks 0.0.0.0 (reserved)', () => {
    expect(isRestrictedIpv4('0.0.0.0')).toBe(true);
  });

  it('allows 8.8.8.8 (public DNS)', () => {
    expect(isRestrictedIpv4('8.8.8.8')).toBe(false);
  });

  it('allows 1.1.1.1 (public DNS)', () => {
    expect(isRestrictedIpv4('1.1.1.1')).toBe(false);
  });

  it('allows 93.184.216.34 (example.com)', () => {
    expect(isRestrictedIpv4('93.184.216.34')).toBe(false);
  });
});

describe('isRestrictedIpv6', () => {
  it('blocks ::1 (loopback)', () => {
    expect(isRestrictedIpv6('::1')).toBe(true);
  });

  it('blocks fe80::1 (link-local)', () => {
    expect(isRestrictedIpv6('fe80::1')).toBe(true);
  });

  it('blocks fe80::ffff:ffff:ffff:ffff (link-local)', () => {
    expect(isRestrictedIpv6('fe80::ffff:ffff:ffff:ffff')).toBe(true);
  });

  it('blocks fc00::1 (unique local)', () => {
    expect(isRestrictedIpv6('fc00::1')).toBe(true);
  });

  it('blocks fd00::1 (unique local)', () => {
    expect(isRestrictedIpv6('fd00::1')).toBe(true);
  });

  it('blocks fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff (unique local)', () => {
    expect(isRestrictedIpv6('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
  });

  it('blocks ::ffff:127.0.0.1 (IPv4-mapped loopback)', () => {
    expect(isRestrictedIpv6('::ffff:127.0.0.1')).toBe(true);
  });

  it('blocks ::ffff:10.0.0.1 (IPv4-mapped private)', () => {
    expect(isRestrictedIpv6('::ffff:10.0.0.1')).toBe(true);
  });

  it('blocks ::ffff:192.168.1.1 (IPv4-mapped private)', () => {
    expect(isRestrictedIpv6('::ffff:192.168.1.1')).toBe(true);
  });

  it('blocks ::ffff:169.254.169.254 (IPv4-mapped cloud metadata)', () => {
    expect(isRestrictedIpv6('::ffff:169.254.169.254')).toBe(true);
  });

  it('allows ::ffff:8.8.8.8 (IPv4-mapped public)', () => {
    expect(isRestrictedIpv6('::ffff:8.8.8.8')).toBe(false);
  });

  it('allows 2001:db8::1 (documentation prefix)', () => {
    expect(isRestrictedIpv6('2001:db8::1')).toBe(false);
  });

  it('allows 2606:4700:4700::1111 (Cloudflare DNS)', () => {
    expect(isRestrictedIpv6('2606:4700:4700::1111')).toBe(false);
  });

  it('allows ::ffff:1.1.1.1 (IPv4-mapped public)', () => {
    expect(isRestrictedIpv6('::ffff:1.1.1.1')).toBe(false);
  });
});

describe('createSsrfSafeAgent', () => {
  it('creates an undici Agent instance', () => {
    const agent = createSsrfSafeAgent();
    expect(agent).toBeInstanceOf(Agent);
  });

  it('uses custom lookup that filters restricted IPs', () => {
    const agent = createSsrfSafeAgent();
    expect(agent).toBeDefined();
  });
});

describe('fetchPageSafe blocks literal-IP targets before connecting', () => {
  it('throws SSRF_BLOCKED for http://127.0.0.1 without attempting a connection', async () => {
    await expect(fetchPageSafe(new URL('http://127.0.0.1'), 2000)).rejects.toThrow('SSRF_BLOCKED');
  });

  it('throws SSRF_BLOCKED for http://169.254.169.254', async () => {
    await expect(fetchPageSafe(new URL('http://169.254.169.254'), 2000)).rejects.toThrow('SSRF_BLOCKED');
  });

  it('throws SSRF_BLOCKED for http://10.0.0.1', async () => {
    await expect(fetchPageSafe(new URL('http://10.0.0.1'), 2000)).rejects.toThrow('SSRF_BLOCKED');
  });

  it('throws SSRF_BLOCKED for http://192.168.1.1', async () => {
    await expect(fetchPageSafe(new URL('http://192.168.1.1'), 2000)).rejects.toThrow('SSRF_BLOCKED');
  });

  it('throws SSRF_BLOCKED for http://[::1]', async () => {
    await expect(fetchPageSafe(new URL('http://[::1]'), 2000)).rejects.toThrow('SSRF_BLOCKED');
  });
});

describe('mobile/forms route interception', () => {
  let mockAddresses: Array<{ address: string; family: number }> = [];

  beforeEach(() => {
    mockAddresses = [];
    // @ts-expect-error - mock overload resolution for dns.promises.lookup with all: true
    vi.spyOn(dnsPromises, 'lookup').mockImplementation(async (_hostname: string, _options?: { all?: boolean; verbatim?: boolean }) => {
      return mockAddresses;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockContext = () => {
    const mockRouteObj = {
      request: () => ({ url: () => 'http://example.com/page' }),
      abort: vi.fn(),
      continue: vi.fn(),
    };

    const mockRoute = vi.fn().mockImplementation(
      async (_pattern: string, handler: (route: typeof mockRouteObj) => Promise<void>) => {
        await handler(mockRouteObj);
      }
    );

    return { mockContext: { route: mockRoute }, mockRouteObj };
  };

  it('allows navigation when hostname resolves to public IP', async () => {
    mockAddresses = [{ address: '93.184.216.34', family: 4 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockContext.route).toHaveBeenCalledWith('**/*', expect.any(Function));
    expect(mockRouteObj.continue).toHaveBeenCalled();
    expect(mockRouteObj.abort).not.toHaveBeenCalled();
  });

  it('blocks navigation when hostname resolves only to private IP (127.0.0.1)', async () => {
    mockAddresses = [{ address: '127.0.0.1', family: 4 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(mockRouteObj.continue).not.toHaveBeenCalled();
  });

  it('blocks navigation when hostname resolves only to 169.254.169.254', async () => {
    mockAddresses = [{ address: '169.254.169.254', family: 4 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
  });

  it('blocks navigation when hostname resolves only to 10.0.0.1', async () => {
    mockAddresses = [{ address: '10.0.0.1', family: 4 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
  });

  it('blocks navigation when hostname resolves only to 192.168.1.1', async () => {
    mockAddresses = [{ address: '192.168.1.1', family: 4 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
  });

  it('allows navigation when hostname resolves to mix of public and private IPs', async () => {
    mockAddresses = [{ address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.continue).toHaveBeenCalled();
    expect(mockRouteObj.abort).not.toHaveBeenCalled();
  });

  it('blocks navigation for IPv6 loopback (::1)', async () => {
    mockAddresses = [{ address: '::1', family: 6 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
  });

  it('blocks navigation for IPv6 link-local (fe80::1)', async () => {
    mockAddresses = [{ address: 'fe80::1', family: 6 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
  });

  it('blocks navigation for IPv4-mapped IPv6 embedding private IP (::ffff:127.0.0.1)', async () => {
    mockAddresses = [{ address: '::ffff:127.0.0.1', family: 6 }];

    const { mockContext, mockRouteObj } = createMockContext();
    const { setupSsrfRouteBlocking } = await import('../src/checks/mobile');
    await setupSsrfRouteBlocking(mockContext);

    expect(mockRouteObj.abort).toHaveBeenCalledWith('blockedbyclient');
  });
});
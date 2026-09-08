import { describe, expect, it } from 'vitest';
import { detectBotChallenge } from '../src/core/http';

function createHeaders(record: Record<string, string>): Headers {
  return new Headers(record);
}

const CF_CHALLENGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Just a moment...</title></head>
<body>
  <p>Checking your browser before accessing example.com.</p>
  <p>Please enable JavaScript and cookies.</p>
  <div id="cf-challenge-running">Ray ID: 1234567890abcdef</div>
</body>
</html>
`;

const CF_ATTENTION_REQUIRED_HTML = `
<!DOCTYPE html>
<html>
<head><title>Attention Required! | Cloudflare</title></head>
<body>
  <h1>Attention Required!</h1>
  <p>Sorry, you have been blocked.</p>
</body>
</html>
`;

const NORMAL_200_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Example Domain - A Great Website</title>
  <meta name="description" content="This is a normal website">
  <meta property="og:title" content="Example Domain">
  <meta property="og:image" content="https://example.com/og.png">
</head>
<body>
  <h1>Welcome to Example Domain</h1>
  <p>This is a normal page with real content.</p>
</body>
</html>
`;

const LEGITIMATE_403_HTML = `
<!DOCTYPE html>
<html>
<head><title>403 Forbidden</title></head>
<body>
  <h1>403 Forbidden</h1>
  <p>Access Denied — insufficient permissions to access this resource.</p>
  <p>Your account has been blocked, contact support.</p>
</body>
</html>
`;

const LEGITIMATE_403_PERMISSIONS_HTML = `
<!DOCTYPE html>
<html>
<head><title>Access Denied</title></head>
<body>
  <h1>Access Denied</h1>
  <p>You do not have permission to view this page.</p>
</body>
</html>
`;

const AKAMAI_CHALLENGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>Access Denied</title></head>
<body>
  <p>An error occurred while processing your request.</p>
  <p>Reference #1.2.3.4.5.6.7.8.9</p>
</body>
</html>
`;

describe('detectBotChallenge', () => {
  describe('cf-mitigated header present', () => {
    it('detects Cloudflare challenge via cf-mitigated header alone', () => {
      const headers = createHeaders({
        'server': 'cloudflare',
        'cf-mitigated': 'challenge',
      });
      expect(detectBotChallenge(403, headers, '<html><body>Any content</body></html>')).toBe(true);
    });

    it('detects Cloudflare challenge via cf-mitigated header with 503', () => {
      const headers = createHeaders({
        'cf-mitigated': 'challenge',
      });
      expect(detectBotChallenge(503, headers, '<html><body>Service unavailable</body></html>')).toBe(true);
    });

    it('detects cf-mitigated even without cloudflare server header', () => {
      const headers = createHeaders({
        'server': 'nginx',
        'cf-mitigated': 'challenge',
      });
      expect(detectBotChallenge(403, headers, '<html><body>Blocked</body></html>')).toBe(true);
    });
  });

  describe('Cloudflare server + 403/503 + challenge phrases in body', () => {
    it('detects "attention required" phrase', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>Attention Required! Please wait.</body></html>')).toBe(true);
    });

    it('detects "checking your browser" phrase', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>Checking your browser before access.</body></html>')).toBe(true);
    });

    it('detects "just a moment" phrase', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>Just a moment...</body></html>')).toBe(true);
    });

    it('detects "ddos protection by" phrase', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>DDoS protection by Cloudflare</body></html>')).toBe(true);
    });

    it('detects "enable javascript and cookies" phrase', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>Please enable JavaScript and cookies</body></html>')).toBe(true);
    });

    it('detects "ray id:" phrase', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>Ray ID: abc123</body></html>')).toBe(true);
    });

    it('detects full Cloudflare challenge page', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, CF_CHALLENGE_HTML)).toBe(true);
    });

    it('detects Cloudflare Attention Required page', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, CF_ATTENTION_REQUIRED_HTML)).toBe(true);
    });

    it('does NOT detect on 200 even with Cloudflare server', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(200, headers, CF_CHALLENGE_HTML)).toBe(false);
    });

    it('does NOT detect without challenge phrases even with Cloudflare + 403', () => {
      const headers = createHeaders({ 'server': 'cloudflare' });
      expect(detectBotChallenge(403, headers, '<html><body>Custom 403 page</body></html>')).toBe(false);
    });
  });

  describe('Generic 403/503 with challenge-like title + body (no Cloudflare headers)', () => {
    it('detects "<title>attention required" with challenge body phrase', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      const html = '<html><head><title>Attention Required</title></head><body>Please enable JavaScript and cookies</body></html>';
      expect(detectBotChallenge(403, headers, html)).toBe(true);
    });

    it('detects "<title>just a moment" with challenge body phrase', () => {
      const headers = createHeaders({ 'server': 'apache' });
      const html = '<html><head><title>Just a Moment...</title></head><body>Checking your browser</body></html>';
      expect(detectBotChallenge(503, headers, html)).toBe(true);
    });

    it('detects "<title>access denied" combined with cloudflare+ray-id in body', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      const html = '<html><head><title>Access Denied</title></head><body>Cloudflare Ray ID: 12345</body></html>';
      expect(detectBotChallenge(403, headers, html)).toBe(true);
    });

    it('does NOT detect title alone without challenge body phrase', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      expect(detectBotChallenge(403, headers, '<html><head><title>Attention Required</title></head><body>Content</body></html>')).toBe(false);
    });
  });

  describe('Negative cases - should NOT be detected as bot challenge', () => {
    it('normal 200 response with real content', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      expect(detectBotChallenge(200, headers, NORMAL_200_HTML)).toBe(false);
    });

    it('legitimate 403 with "403 Forbidden" title and "blocked" in body text', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      expect(detectBotChallenge(403, headers, LEGITIMATE_403_HTML)).toBe(false);
    });

    it('legitimate 403 with "Access Denied" title but no challenge phrases', () => {
      const headers = createHeaders({ 'server': 'apache' });
      expect(detectBotChallenge(403, headers, LEGITIMATE_403_PERMISSIONS_HTML)).toBe(false);
    });

    it('legitimate 403 with "Access Denied" title and "blocked" word in body', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      const html = '<html><head><title>Access Denied</title></head><body>Your account has been blocked, contact support.</body></html>';
      expect(detectBotChallenge(403, headers, html)).toBe(false);
    });

    it('Akamai-style challenge page without Cloudflare signatures', () => {
      const headers = createHeaders({ 'server': 'akamai' });
      expect(detectBotChallenge(403, headers, AKAMAI_CHALLENGE_HTML)).toBe(false);
    });

    it('503 maintenance page without challenge phrases', () => {
      const headers = createHeaders({ 'server': 'nginx' });
      expect(detectBotChallenge(503, headers, '<html><head><title>Service Unavailable</title></head><body>Maintenance in progress</body></html>')).toBe(false);
    });
  });
});
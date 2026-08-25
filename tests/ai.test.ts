import { afterEach, describe, expect, it } from 'vitest';
import { buildPrompt } from '../src/ai/prompt';
import { resolveAiConfig } from '../src/ai/enhance';
import type { AuditReport } from '../src/core/types';

const report: AuditReport = {
  url: 'https://example.com',
  startedAt: '2026-01-01T00:00:00Z',
  finishedAt: '2026-01-01T00:01:00Z',
  score: 80,
  summary: { pass: 1, fail: 1, warn: 1, skip: 1 },
  results: [
    { id: 'a', title: 'Broken form', group: 'forms', status: 'fail', detail: 'returns 500' },
    { id: 'b', title: 'Short title', group: 'seo', status: 'warn', detail: '9 characters' },
    { id: 'c', title: 'Site reachable', group: 'general', status: 'pass' },
    { id: 'd', title: 'Form probe', group: 'forms', status: 'skip', detail: 'none' },
  ],
};

describe('buildPrompt', () => {
  const prompt = buildPrompt(report);

  it('includes failures with their details', () => {
    expect(prompt.user).toContain('[FAIL] Broken form: returns 500');
  });

  it('includes warnings', () => {
    expect(prompt.user).toContain('[WARN] Short title: 9 characters');
  });

  it('never sends passing or skipped checks', () => {
    expect(prompt.user).not.toContain('Site reachable');
    expect(prompt.user).not.toContain('Form probe');
  });

  it('reports the score and url', () => {
    expect(prompt.user).toContain('https://example.com');
    expect(prompt.user).toContain('80/100');
  });

  it('instructs the model not to invent findings', () => {
    expect(prompt.system).toContain('never invent findings');
  });
});

describe('resolveAiConfig', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('throws without any API key', () => {
    delete process.env.LIVECHECK_AI_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => resolveAiConfig()).toThrow(/no API key/);
  });

  it('prefers LIVECHECK_AI_KEY over GROQ and OPENAI keys', () => {
    process.env.LIVECHECK_AI_KEY = 'live-key';
    process.env.GROQ_API_KEY = 'groq-key';
    process.env.OPENAI_API_KEY = 'openai-key';
    const config = resolveAiConfig();
    expect(config.apiKey).toBe('live-key');
    expect(config.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('routes GROQ_API_KEY to the Groq endpoint with a Groq model', () => {
    delete process.env.LIVECHECK_AI_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LIVECHECK_AI_BASE_URL;
    delete process.env.LIVECHECK_AI_MODEL;
    process.env.GROQ_API_KEY = 'gsk_test';
    const config = resolveAiConfig();
    expect(config.apiKey).toBe('gsk_test');
    expect(config.baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(config.model).toBe('llama-3.3-70b-versatile');
  });

  it('applies custom base url and model', () => {
    delete process.env.LIVECHECK_AI_KEY;
    delete process.env.GROQ_API_KEY;
    process.env.OPENAI_API_KEY = 'k';
    process.env.LIVECHECK_AI_BASE_URL = 'https://openrouter.ai/api/v1/';
    process.env.LIVECHECK_AI_MODEL = 'llama-3';
    const config = resolveAiConfig();
    expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(config.model).toBe('llama-3');
  });
});

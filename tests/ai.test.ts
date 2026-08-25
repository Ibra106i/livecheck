import { afterEach, describe, expect, it } from 'vitest';
import { buildPrompt, sortFindings } from '../src/ai/prompt';
import { resolveAiConfig } from '../src/ai/enhance';
import type { AuditReport, CheckResult } from '../src/core/types';

const make = (
  id: string,
  status: CheckResult['status'],
  weight?: number,
  group: CheckResult['group'] = 'seo'
): CheckResult => ({
  id,
  title: id,
  group,
  status,
  ...(weight !== undefined ? { weight } : {}),
});

const report: AuditReport = {
  url: 'https://example.com',
  startedAt: '2026-01-01T00:00:00Z',
  finishedAt: '2026-01-01T00:01:00Z',
  score: 80,
  summary: { pass: 1, fail: 2, warn: 2, skip: 1 },
  results: [
    make('warn-light', 'warn', 1),
    make('pass-a', 'pass'),
    make('fail-heavy', 'fail', 2),
    make('skip-a', 'skip'),
    make('warn-heavy', 'warn', 2),
    make('fail-light', 'fail', 1),
  ],
};

describe('sortFindings', () => {
  it('puts failures before warnings', () => {
    const ids = sortFindings(report.results).map((r) => r.id);
    expect(ids.indexOf('fail-heavy')).toBeLessThan(ids.indexOf('warn-heavy'));
  });

  it('orders heavier weights first within the same status', () => {
    const ids = sortFindings(report.results).map((r) => r.id);
    expect(ids[0]).toBe('fail-heavy');
    expect(ids[1]).toBe('fail-light');
    expect(ids[2]).toBe('warn-heavy');
    expect(ids[3]).toBe('warn-light');
  });

  it('drops passes and skips entirely', () => {
    const ids = sortFindings(report.results).map((r) => r.id);
    expect(ids).not.toContain('pass-a');
    expect(ids).not.toContain('skip-a');
  });
});

describe('buildPrompt', () => {
  const prompt = buildPrompt(report);

  it('numbers findings in sorted priority order', () => {
    const userLines = prompt.user.split('\n');
    expect(userLines).toContain('1. [CRITICAL] fail-heavy');
    expect(userLines.indexOf('1. [CRITICAL] fail-heavy')).toBeLessThan(
      userLines.indexOf('4. [WARNING] warn-light')
    );
  });

  it('maps FAIL to CRITICAL and WARN to WARNING', () => {
    expect(prompt.user).toContain('[CRITICAL] fail-heavy');
    expect(prompt.user).toContain('[WARNING] warn-heavy');
    expect(prompt.user).not.toContain('[FAIL]');
  });

  it('includes passing checks as a plain list for the What Passed section', () => {
    expect(prompt.user).toContain('- pass-a');
  });

  it('mandates the exact report template sections', () => {
    for (const section of ['## Summary', '## Issues Found', '## What Passed', '## Priority Action Plan']) {
      expect(prompt.system).toContain(section);
    }
  });

  it('forbids tables, emojis, severity escalation, and invented issues', () => {
    expect(prompt.system).toContain('No markdown tables. No emojis.');
    expect(prompt.system).toContain('Never escalate.');
    expect(prompt.system).toContain('Never invent issues');
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
    expect(config.model).toBe('openai/gpt-oss-120b');
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

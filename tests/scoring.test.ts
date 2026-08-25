import { describe, expect, it } from 'vitest';
import { computeScore, summarize } from '../src/core/scoring';
import type { CheckResult } from '../src/core/types';

const make = (status: CheckResult['status'], weight?: number): CheckResult => ({
  id: 'x',
  title: 'X',
  group: 'seo',
  status,
  ...(weight !== undefined ? { weight } : {}),
});

describe('computeScore', () => {
  it('returns 100 when everything passes', () => {
    expect(computeScore([make('pass'), make('pass')])).toBe(100);
  });

  it('treats warnings as half credit', () => {
    expect(computeScore([make('pass'), make('warn')])).toBe(75);
  });

  it('counts failures as zero credit', () => {
    expect(computeScore([make('pass'), make('fail')])).toBe(50);
  });

  it('excludes skipped checks from the denominator', () => {
    expect(computeScore([make('skip'), make('pass')])).toBe(100);
  });

  it('respects explicit weights', () => {
    const results = [make('fail', 2), make('pass'), make('pass'), make('pass')];
    expect(computeScore(results)).toBe(60);
  });

  it('returns 100 for an empty report', () => {
    expect(computeScore([])).toBe(100);
  });
});

describe('summarize', () => {
  it('counts each status', () => {
    const summary = summarize([make('pass'), make('fail'), make('warn'), make('skip')]);
    expect(summary).toEqual({ pass: 1, fail: 1, warn: 1, skip: 1 });
  });
});

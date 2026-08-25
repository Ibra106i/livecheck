import type { Check, CheckContext, CheckResult, PageLike } from '../core/types';

interface FormInspection {
  total: number;
  unlabeled: number;
}

export const formsCheck: Check = {
  id: 'forms',
  title: 'Forms',
  group: 'forms',
  requiresBrowser: true,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    if (!ctx.browser) {
      return [
        {
          id: 'forms-skipped',
          title: 'Form health',
          group: 'forms',
          status: 'skip',
          detail: 'Chromium unavailable — run: npx playwright install chromium',
        },
      ];
    }

    const context = await ctx.browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(ctx.url.toString(), { waitUntil: 'load', timeout: ctx.timeoutMs });

      const forms = page.locator('form');
      const count = await forms.count();
      if (count === 0) {
        return [
          {
            id: 'forms-present',
            title: 'Form presence',
            group: 'forms',
            status: 'skip',
            detail: 'No forms found on the landing page',
          },
        ];
      }

      let inspected = 0;
      let missingAction = 0;
      let missingSubmit = 0;
      let totalControls = 0;
      let totalUnlabeled = 0;

      for (let i = 0; i < Math.min(count, 5); i++) {
        const form = forms.nth(i);
        const action = await form.getAttribute('action');
        if (action === null) missingAction += 1;

        const inspection = (await form.evaluate((element) => {
          const el = element as HTMLFormElement;
          const controls = Array.from(
            el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
              'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea'
            )
          );
          let unlabeled = 0;
          for (const control of controls) {
            const id = control.getAttribute('id');
            const label =
              (id ? el.querySelector(`label[for="${CSS.escape(id)}"]`) : null) ??
              control.closest('label') ??
              control.getAttribute('aria-label') ??
              control.getAttribute('placeholder');
            if (!label && !control.getAttribute('name')) unlabeled += 1;
          }
          const submitCount = el.querySelectorAll(
            'button[type="submit"], input[type="submit"], button:not([type])'
          ).length;
          return {
            total: controls.length,
            unlabeled,
            submitCount,
          } satisfies FormInspection & { submitCount: number };
        })) as FormInspection & { submitCount: number };

        inspected += 1;
        if (inspection.submitCount === 0) missingSubmit += 1;
        totalControls += inspection.total;
        totalUnlabeled += inspection.unlabeled;
      }

      const results: CheckResult[] = [
        {
          id: 'forms-present',
          title: 'Form presence',
          group: 'forms',
          status: 'pass',
          detail: `Found ${count} form(s)`,
        },
        {
          id: 'forms-action',
          title: 'Submission targets',
          group: 'forms',
          status: missingAction > 0 ? 'warn' : 'pass',
          detail:
            missingAction > 0
              ? `${missingAction} of ${inspected} inspected forms have no action attribute`
              : 'Every inspected form declares a submission target',
        },
        {
          id: 'forms-submit',
          title: 'Submit controls',
          group: 'forms',
          status: missingSubmit > 0 ? 'warn' : 'pass',
          detail:
            missingSubmit > 0
              ? `${missingSubmit} of ${inspected} inspected forms have no visible submit button`
              : 'Submit buttons present on every inspected form',
        },
        {
          id: 'forms-labels',
          title: 'Field labeling',
          group: 'forms',
          status: totalUnlabeled > 0 ? 'warn' : 'pass',
          detail:
            totalUnlabeled > 0
              ? `${totalUnlabeled} of ${totalControls} fields lack any label, placeholder, or name`
              : `${totalControls} field(s) labeled and named`,
        },
      ];

      if (ctx.probeForms) {
        results.push(await probeFirstForm(page, ctx.timeoutMs));
      }

      return results;
    } finally {
      await context.close();
    }
  },
};

const FILL_VALUES: Array<[string, string]> = [
  ['text', 'Livecheck audit'],
  ['email', 'audit@livecheck.dev'],
  ['tel', '5551234567'],
];

async function probeFirstForm(page: PageLike, timeoutMs: number): Promise<CheckResult> {
  const base = { title: 'Active submission probe', group: 'forms' as const };
  try {
    const form = page.locator('form').first();
    const action = ((await form.getAttribute('action')) ?? '').trim();
    if (/^mailto:/i.test(action)) {
      return {
        ...base,
        id: 'forms-probe',
        status: 'warn',
        detail: 'Form falls back to a mailto: link — submissions open an email client instead of storing data',
      };
    }

    const fields = form.locator(
      'input[type="text"], input[type="email"], input[type="tel"], textarea'
    );
    const fieldCount = Math.min(await fields.count(), 10);
    for (let i = 0; i < fieldCount; i++) {
      const type = (await fields.nth(i).getAttribute('type')) ?? 'text';
      const value =
        FILL_VALUES.find(([t]) => t === type.toLowerCase())?.[1] ?? 'Livecheck audit';
      await fields.nth(i).fill(value);
    }

    await form
      .locator('button[type="submit"], input[type="submit"], button:not([type])')
      .first()
      .click({ timeout: 5000 });
    await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs }).catch(() => {});

    return {
      ...base,
      id: 'forms-probe',
      status: 'pass',
      detail: `Submitted test data with ${fieldCount} field(s); the page accepted it without throwing`,
    };
  } catch (error) {
    return {
      ...base,
      id: 'forms-probe',
      status: 'fail',
      weight: 2,
      detail: `Probe submission failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

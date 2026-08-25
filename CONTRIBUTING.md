# Contributing to Livecheck

Thanks for helping improve the checklist.

## Setup

```bash
npm install
npx playwright install chromium
```

## Workflow

1. Branch from `main`
2. Make your change with conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`)
3. Run the full check suite locally:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

4. Open a pull request describing what broke and how the change verifies it

## Adding a check

New checks live in `src/checks/`. Each check exports a `Check` object with a unique `id`, a `group`, and a `run(ctx)` function returning `CheckResult[]`. Rules:

- Checks must be read-only by default; any active probing goes behind an explicit CLI flag
- Every new check needs unit coverage; pure logic belongs in exported functions so it can be tested without a browser
- Keep details actionable - say what is wrong and why it matters, not just the raw value

## Reporting issues

Open an issue with the URL category that failed (do not include private URLs), expected vs actual result, and the JSON output if available.

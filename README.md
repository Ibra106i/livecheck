# Livecheck

[![CI](https://github.com/Ibra106i/livecheck/actions/workflows/ci.yml/badge.svg)](https://github.com/Ibra106i/livecheck/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/livechecks)](https://www.npmjs.com/package/livechecks)
[![license](https://img.shields.io/npm/l/livecheck)](./LICENSE)
[![node](https://img.shields.io/node/v/livecheck)](./package.json)

Run a fixed technical checklist against any deployed website and get a scored, timestamped report.

Built for the last mile of AI-built sites: they generate fast, then break at launch. Livecheck finds what broke - DNS, SSL, forms, mobile layout, SEO tags, page speed, security headers - and hands you a shareable report instead of a debugging session.

## Quick start

```bash
npx livechecks https://yoursite.com
```

```
  LIVECHECK AUDIT
  yoursite.com  (https://yoursite.com/)

  Score: 81/100 - Minor issues before launch

  SSL / TLS
    PASS  Certificate trusted     Chain validates against public trust stores
    PASS  Certificate expiry      Expires in 63 days

  SEO & Metadata
    WARN  Meta description        Search engines will invent their own snippet
    ...

  12 passed  1 failed  8 warnings  1 skipped
```

Exit code is `0` when nothing fails and `1` when at least one check fails, so it drops straight into CI:

```yaml
- run: npx livechecks https://yoursite.com
```

## Options

| Flag | Description |
| ---- | ----------- |
| `--json` | Print the report as machine-readable JSON |
| `-o, --out <dir>` | Save markdown + JSON reports to a directory |
| `--probe-forms` | Actively submit the first form found (off by default). Requires confirmation — see [Form probing](#form-probing) below |
| `--i-have-permission` | Skip the interactive confirmation prompt for `--probe-forms` (for scripted/CI use — only pass this if you actually have permission to test the target) |
| `--ai` | Append a plain-language AI analysis of the results (requires an API key, see below) |
| `--lighthouse` | Add a Lighthouse performance score (requires `npm i -D lighthouse chrome-launcher`) |
| `-t, --timeout <ms>` | Per-check timeout in milliseconds (default `20000`) |

By default Livecheck is **read-only**: it never submits forms or mutates anything on the target site. Pass `--probe-forms` to opt into an active submission test.

## Form probing

`--probe-forms` submits a real POST request to the first form Livecheck finds on the target page. This has real side effects on infrastructure you may not own or control — depending on the form, it can send an email, create an account, or trigger any other action tied to that submission.

Because of that, `--probe-forms` alone will prompt for confirmation in an interactive terminal:

```
This will submit live forms on the target site. Continue only if you have permission to test it. Type 'yes' to continue:
```

For scripted or CI use, pass `--i-have-permission` alongside `--probe-forms` to skip the prompt. In a non-interactive environment (no TTY) without this flag, form probing is skipped automatically and reported as such — Livecheck will not hang waiting for input.

Only use `--probe-forms` against sites you own or have explicit permission to test.

## What gets checked

| Group | Checks |
| ----- | ------ |
| General | Site reachable |
| DNS & Domain | A/AAAA records resolve, www subdomain resolves |
| SSL / TLS | Certificate trusted by public stores, expiry window |
| HTTP Headers | HSTS, X-Content-Type-Options, CSP, clickjacking protection, compression |
| SEO & Metadata | Title length, meta description, Open Graph tags, single h1, lang attribute, favicon |
| Mobile | Viewport meta tag, horizontal overflow at 375px |
| Forms | Submission target, submit button present, field labeling, optional active probe (see [Form probing](#form-probing)) |
| Speed | Time to first byte, full page load, page weight, optional Lighthouse score |

A check can also report `BLOCKED` instead of pass/warn/fail if the scan was interrupted by anti-bot protection — see [Safety](#safety).

## Scoring

Each check carries a weight (default `1`, critical checks `2`). Passing earns full weight, warnings earn half, failures earn none, skips are excluded from the denominator. The result is normalized to 0-100:

- `90+` Launch-ready
- `70-89` Minor issues before launch
- `50-69` Needs work before launch
- `<50` Not ready for visitors

## AI analysis

Pass `--ai` to add a plain-language explanation of every failure and warning: what is wrong, why it matters, and how to fix it.

```bash
npx livechecks https://yoursite.com --ai
```

The analysis runs through a pre-configured OpenAI-compatible provider on the machine running the audit (via `LIVECHECK_AI_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`, with optional `LIVECHECK_AI_BASE_URL` / `LIVECHECK_AI_MODEL` overrides). No setup is required if you are running reports provided to you.

Only structured check results (titles, statuses, detail strings) are sent to the provider - never page content, credentials, or HTML. Without a key the flag is skipped with a notice and the audit still completes.

## Reports

With `-o reports/` you get two artifacts per run:

- **Markdown** - human-readable, timestamped, ready to paste into a ticket or email to a client
- **JSON** - stable schema for CI gates, dashboards, or your own tooling

## Safety

Livecheck scans arbitrary domains supplied by the person running it, so it includes protections against the tool itself being misused as an attack vector:

- **SSRF / internal network protection.** Livecheck refuses to connect to private, loopback, or link-local addresses (e.g. `127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, and their IPv6 equivalents), including when a domain resolves to one of these via DNS. This applies to both the main scan and the browser-based mobile/forms checks.
- **Anti-bot/WAF detection.** If the target responds with a bot-challenge or block page (e.g. Cloudflare's "Attention Required" interstitial) instead of real content, content-based checks (SEO, social tags, forms, mobile) are marked `BLOCKED` rather than scored — Livecheck will not silently report on a challenge page as if it were the real site.
- **Form probing requires confirmation.** See [Form probing](#form-probing) above.

These protections mean a scan can return fewer completed checks than expected in some cases (e.g. `BLOCKED` results) — this is intentional and reported explicitly in the output, not a bug.

## Disclaimer

Reports describe observable behavior during a single point-in-time audit. Sites change after they are checked. Livecheck output is provided as-is, without warranty of any kind, and does not certify security or correctness beyond what is listed.

## Roadmap

- [ ] Automated pre-intake audit API for service intake flows
- [ ] Auto-fix recipes for the most common deployment failures
- [ ] White-label report exports for agencies
- [ ] Scheduled monitoring with drift alerts

## Development

```bash
npm install
npx playwright install chromium
npm run dev -- https://example.com

npm test
npm run lint
npm run typecheck
npm run build
```

A gated end-to-end smoke test against example.com runs with `LIVECHECK_SMOKE=1 npm test`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Conventional commits required; `npm run verify` style checks run in CI.

## License

[MIT](./LICENSE)

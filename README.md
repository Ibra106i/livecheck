# Livecheck

[![CI](https://github.com/Ibrahim106/livecheck/actions/workflows/ci.yml/badge.svg)](https://github.com/Ibrahim106/livecheck/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/livecheck)](https://www.npmjs.com/package/livecheck)
[![license](https://img.shields.io/npm/l/livecheck)](./LICENSE)
[![node](https://img.shields.io/node/v/livecheck)](./package.json)

Run a fixed technical checklist against any deployed website and get a scored, timestamped report.

Built for the last mile of AI-built sites: they generate fast, then break at launch. Livecheck finds what broke - DNS, SSL, forms, mobile layout, SEO tags, page speed, security headers - and hands you a shareable report instead of a debugging session.

## Quick start

```bash
npx livecheck https://yoursite.com
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
- run: npx livecheck https://yoursite.com
```

## Options

| Flag | Description |
| ---- | ----------- |
| `--json` | Print the report as machine-readable JSON |
| `-o, --out <dir>` | Save markdown + JSON reports to a directory |
| `--probe-forms` | Actively submit the first form found (off by default) |
| `--lighthouse` | Add a Lighthouse performance score (requires `npm i -D lighthouse chrome-launcher`) |
| `-t, --timeout <ms>` | Per-check timeout in milliseconds (default `20000`) |

By default Livecheck is **read-only**: it never submits forms or mutates anything on the target site. Pass `--probe-forms` to opt into an active submission test.

## What gets checked

| Group | Checks |
| ----- | ------ |
| General | Site reachable |
| DNS & Domain | A/AAAA records resolve, www subdomain resolves |
| SSL / TLS | Certificate trusted by public stores, expiry window |
| HTTP Headers | HSTS, X-Content-Type-Options, CSP, clickjacking protection, compression |
| SEO & Metadata | Title length, meta description, Open Graph tags, single h1, lang attribute, favicon |
| Mobile | Viewport meta tag, horizontal overflow at 375px |
| Forms | Submission target, submit button present, field labeling, optional active probe |
| Speed | Time to first byte, full page load, page weight, optional Lighthouse score |

## Scoring

Each check carries a weight (default `1`, critical checks `2`). Passing earns full weight, warnings earn half, failures earn none, skips are excluded from the denominator. The result is normalized to 0-100:

- `90+` Launch-ready
- `70-89` Minor issues before launch
- `50-69` Needs work before launch
- `<50` Not ready for visitors

## Reports

With `-o reports/` you get two artifacts per run:

- **Markdown** - human-readable, timestamped, ready to paste into a ticket or email to a client
- **JSON** - stable schema for CI gates, dashboards, or your own tooling

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

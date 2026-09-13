# Livecheck — Website Audit GitHub Action

Audit any deployed website on every PR. Catches DNS, SSL, SEO, mobile, speed, and security issues before your users do.

**[Livecheck](https://github.com/Ibra106i/livecheck)** runs a fixed technical checklist against any URL and produces a scored, timestamped report. This action wraps the CLI for GitHub Actions — every CI user exposes Livecheck to their entire team.

## What Gets Checked

| Group | Checks |
|-------|--------|
| General | Site reachable |
| DNS & Domain | A/AAAA records resolve, www subdomain resolves |
| SSL / TLS | Certificate trusted, not expired |
| HTTP Headers | HSTS, X-Content-Type-Options, CSP, clickjacking protection, compression |
| SEO & Metadata | Title, meta description, Open Graph tags, h1, lang, favicon |
| Mobile | Viewport meta, no horizontal overflow at 375px |
| Forms | Submission target, submit button, field labeling |
| Speed | TTFB, page load, page weight |

## Quick Start

```yaml
- uses: Ibra106i/livecheck/.github/actions/livecheck@v1
  with:
    url: https://your-site.com
```

## PR Comment + Annotations

```yaml
jobs:
  audit:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: Ibra106i/livecheck/.github/actions/livecheck@v1
        id: livecheck
        with:
          url: https://your-site.com
          post-comment: true
          annotations: true

      - uses: actions/github-script@v7
        if: always() && github.event_name == 'pull_request'
        with:
          script: |
            const body = `${{ steps.livecheck.outputs.markdown }}`;
            const score = `${{ steps.livecheck.outputs.score }}`;
            const pass = `${{ steps.livecheck.outputs.pass }}`;
            const marker = '<!-- livecheck -->';
            const emoji = pass === 'true' ? '✅' : '❌';
            const text = `${marker}\n## ${emoji} Livecheck — Score: ${score}/100\n\n${body}`;
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner, repo: context.repo.repo,
              issue_number: context.issue.number, per_page: 100,
            });
            const existing = comments.find(c => c.body.includes(marker));
            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner, repo: context.repo.repo,
                comment_id: existing.id, body: text,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner, repo: context.repo.repo,
                issue_number: context.issue.number, body: text,
              });
            }
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | **yes** | — | URL to audit |
| `fail-on-failure` | no | `true` | Exit with code 1 if any check fails |
| `min-score` | no | `0` | Fail if score below this (0 = disabled) |
| `probe-forms` | no | `false` | Submit first form found |
| `i-have-permission` | no | `false` | Confirm form submission permission |
| `lighthouse` | no | `false` | Include Lighthouse score |
| `ai` | no | `false` | Enable AI analysis |
| `timeout` | no | `20000` | Per-check timeout (ms) |
| `post-comment` | no | `true` | Post PR comment with summary |
| `annotations` | no | `true` | Emit `::error` annotations for failures |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Audit score (0-100) |
| `pass` | Whether all checks passed (`true`/`false`) |
| `report` | Full JSON report |
| `markdown` | Markdown summary |
| `pass-count` | Number of passing checks |
| `fail-count` | Number of failing checks |
| `warn-count` | Number of warning checks |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All checks passed |
| `1` | At least one check failed |
| `2` | Fatal error during audit |

## Scoring

Each check carries a weight. Passing earns full weight, warnings earn half, failures earn none. The result is normalized to 0-100:

- **90+** — Launch-ready
- **70-89** — Minor issues before launch
- **50-69** — Needs work before launch
- **<50** — Not ready for visitors

## Safety

- **SSRF protection** — Refuses to connect to private/loopback addresses
- **Anti-bot detection** — Blocked checks reported as `BLOCKED`, not silently scored
- **Form probing** — Requires explicit `--i-have-permission` in CI
- **Privacy** — AI analysis only sends check results, never page content

## License

MIT

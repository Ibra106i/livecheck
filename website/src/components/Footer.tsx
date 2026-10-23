import { Wordmark } from './marketing/Wordmark';

const GITHUB_URL = 'https://github.com/Ibra106i/livecheck';

const LINK_GROUPS = [
  {
    heading: 'Product',
    links: [
      { label: 'Pillars', href: '#pillars' },
      { label: 'CI usage', href: '#ci' },
      { label: 'Example output', href: '#output' },
      { label: 'Install', href: '#install' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'npm package', href: 'https://www.npmjs.com/package/livechecks' },
      { label: 'Issues', href: `${GITHUB_URL}/issues` },
      { label: 'MIT license', href: `${GITHUB_URL}/blob/main/LICENSE` },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              A TypeScript/Node.js CLI that audits a deployed website and returns a 0–100 score across
              DNS, SSL, SEO, security headers, mobile layout and page speed.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-400">
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="rounded text-[13px] text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[12px] text-slate-400">
            © {new Date().getFullYear()} Livecheck · MIT licensed
          </p>
          <p className="text-[12px] leading-5 text-slate-400">
            Reports describe a single point-in-time audit. Sites change after they are checked.
          </p>
        </div>
      </div>
    </footer>
  );
}

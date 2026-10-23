import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Github, Menu, X } from 'lucide-react';
import { Wordmark } from './marketing/Wordmark';

const NAV_LINKS = [
  { label: 'Pillars', href: '#pillars' },
  { label: 'CI', href: '#ci' },
  { label: 'Example output', href: '#output' },
];

const GITHUB_URL = 'https://github.com/Ibra106i/livecheck';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // Land on the right section when arriving from another route with a hash.
  useEffect(() => {
    if (pathname !== '/' || !hash) return;
    const target = document.querySelector(hash);
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  }, [pathname, hash]);

  const handleAnchor = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (pathname !== '/') return; // Let the router follow the href to `/#section`.
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const handleStart = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (pathname !== '/') return;
    const target = document.getElementById('install');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-cyan"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            aria-label="Livecheck home"
          >
            <Wordmark />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleAnchor(event, link.href)}
                className="select-none rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Livecheck on GitHub"
              className="inline-flex h-9 w-9 select-none items-center justify-center rounded-lg border border-line text-slate-400 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <Github aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href="#install"
              onClick={handleStart}
              className="inline-flex select-none items-center rounded-lg bg-cyan px-4 py-2 text-[13px] font-semibold text-ink transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-9 w-9 select-none items-center justify-center rounded-lg border border-line text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink md:hidden"
          >
            {open ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>

        <div
          id="mobile-nav"
          hidden={!open}
          className="border-t border-line bg-ink/95 px-4 py-4 backdrop-blur-md md:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleAnchor(event, link.href)}
                className="select-none rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                {link.label}
              </a>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="select-none rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              GitHub
            </a>
            <a
              href="#install"
              onClick={handleStart}
              className="mt-2 select-none rounded-lg bg-cyan px-3 py-2.5 text-center text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';

const LINKS = [
  { href: '#the-fix', label: 'Product' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#partners', label: 'Partners' },
  { href: '#roadmap', label: 'Roadmap' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAnchor = (href: string) => {
    setOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => handleAnchor(l.href)}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Agency Login
            </Button>
          </Link>
          <Link to="/audit">
            <Button size="sm">
              Start an Audit <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <button className="md:hidden text-zinc-300" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleAnchor(l.href)}
                className="py-1.5 text-left text-sm font-medium text-zinc-400 hover:text-white"
              >
                {l.label}
              </button>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  Agency Login
                </Button>
              </Link>
              <Link to="/audit" onClick={() => setOpen(false)}>
                <Button className="w-full">Start an Audit</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

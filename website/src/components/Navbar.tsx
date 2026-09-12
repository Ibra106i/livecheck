import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#problem', label: 'The Problem' },
  { href: '#solution', label: 'The Solution' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#proof', label: 'Proof' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-bg/90 backdrop-blur-md border-b border-border' : 'bg-transparent'
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Livecheck Home">
          <Logo size="lg" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => handleAnchor(l.href)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-fg-muted transition-all duration-200 hover:text-fg hover:bg-bg-elevated/50"
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/audit">
            <Button size="sm">
              Start Audit <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <button
          className="md:hidden text-fg-muted hover:text-fg transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-bg/95 backdrop-blur-md px-4 py-4 md:hidden animate-in">
          <div className="flex flex-col gap-2">
            {LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleAnchor(l.href)}
                className="px-3 py-2.5 rounded-lg text-left text-sm font-medium text-fg-muted hover:text-fg hover:bg-bg-elevated transition-colors"
              >
                {l.label}
              </button>
            ))}
            <Separator className="my-2" />
            <div className="flex flex-col gap-2">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-center">
                <Button variant="outline" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Link to="/audit" onClick={() => setOpen(false)} className="text-center">
                <Button className="w-full">Start Audit</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
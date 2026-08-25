import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Palette, Globe, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { useProjects } from '../context/ProjectsContext';
import { cn } from '../lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/audit', label: 'New Audit', icon: PlusCircle },
  { href: '/white-label', label: 'White-Label', icon: Palette },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { whiteLabel } = useProjects();

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
          <div className="flex h-16 items-center border-b border-zinc-800 px-6">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-6">
            {NAV.map((item) => {
              const active = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-zinc-800 p-4">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-950 font-bold text-sm"
                style={{ backgroundColor: whiteLabel.accentColor }}
              >
                {whiteLabel.agencyName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{whiteLabel.agencyName}</div>
                <div className="truncate text-xs text-zinc-500">Agency Partner</div>
              </div>
            </div>
            <Link
              to="/"
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-200"
            >
              <Globe className="h-3.5 w-3.5" /> Back to marketing site
            </Link>
          </div>
        </aside>

        <div className="flex w-full flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md sm:px-6 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-1">
              {NAV.map((item) => {
                const active = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </header>
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
          <footer className="border-t border-zinc-800 px-6 py-4 text-center text-xs text-zinc-600">
            <ShieldCheck className="mb-1 inline h-3.5 w-3.5 text-emerald-500" /> Livecheck Agency Console — mock
            data environment
          </footer>
        </div>
      </div>
    </div>
  );
}

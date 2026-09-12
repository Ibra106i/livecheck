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
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-bg-elevated/80 backdrop-blur-sm lg:flex">
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/" className="flex items-center gap-2" aria-label="Livecheck Home">
              <Logo size="lg" />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Dashboard navigation">
            {NAV.map((item) => {
              const active = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-bg text-primary border-primary-border shadow-[0_0_20px_-5px_rgba(6,214,160,0.3)]'
                      : 'text-fg-muted hover:bg-bg-card hover:text-fg border-border/50'
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-bg font-bold text-sm"
                style={{ backgroundColor: whiteLabel.accentColor }}
              >
                {whiteLabel.agencyName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-fg">{whiteLabel.agencyName}</div>
                <div className="truncate text-xs text-fg-subtle">Agency Partner</div>
              </div>
            </div>
            <Link
              to="/"
              className={cn(
                'mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
                'text-fg-subtle hover:text-fg hover:bg-bg-card'
              )}
            >
              <Globe className="h-3.5 w-3.5" /> Back to marketing site
            </Link>
          </div>
        </aside>

        <div className="flex w-full flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/90 backdrop-blur-md px-4 sm:px-6 lg:hidden">
            <Link to="/" className="flex items-center gap-2" aria-label="Livecheck Home">
              <Logo size="default" />
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
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      active ? 'bg-primary-bg text-primary' : 'text-fg-subtle hover:text-fg hover:bg-bg-card'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
          </header>
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
          <footer className="border-t border-border px-6 py-4 text-center text-xs text-fg-subtle">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Livecheck Agency Console — mock data environment</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
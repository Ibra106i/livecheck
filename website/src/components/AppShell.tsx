import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings, Globe, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { OrgSwitcher } from './OrgSwitcher';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/audit', label: 'New Audit', icon: PlusCircle },
  { href: '/settings/org', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { organization, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-bg-elevated/80 backdrop-blur-sm lg:flex">
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/" className="flex items-center gap-2" aria-label="Livecheck Home">
              <Logo size="lg" />
            </Link>
          </div>
          <div className="px-3 py-4">
            <OrgSwitcher />
          </div>
          <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Dashboard navigation">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-fg">{user?.email}</div>
                <div className="truncate text-xs text-fg-subtle">{organization?.role}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/"
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
                  'text-fg-subtle hover:text-fg hover:bg-bg-card'
                )}
              >
                <Globe className="h-3.5 w-3.5" /> Marketing site
              </Link>
              <button
                onClick={logout}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
                  'text-fg-subtle hover:text-danger hover:bg-danger-bg'
                )}
              >
                Logout
              </button>
            </div>
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
              <span>Livecheck Agency Console</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

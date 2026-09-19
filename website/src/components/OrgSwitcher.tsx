import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ChevronDown, Plus, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function OrgSwitcher() {
  const { organization, organizations, switchOrganization, createOrganization } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSwitch = async (orgId: string) => {
    if (orgId === organization?.id) {
      setOpen(false);
      return;
    }
    await switchOrganization(orgId);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createOrganization(newName.trim());
      setNewName('');
      setOpen(false);
    } catch {
      // error handled by context
    } finally {
      setCreating(false);
    }
  };

  if (!organization) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border border-border bg-bg-card p-3',
          'transition-all duration-200 hover:border-border-hover hover:bg-bg-elevated'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary font-bold text-sm">
          {organization.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-semibold text-fg">{organization.name}</div>
          <div className="truncate text-xs text-fg-subtle capitalize">{organization.role}</div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-fg-subtle transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-xl">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-fg-subtle">Organizations</div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                    org.id === organization.id
                      ? 'bg-primary-bg text-primary'
                      : 'text-fg hover:bg-bg-card'
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                    org.id === organization.id
                      ? 'bg-primary text-bg'
                      : 'bg-bg-card text-fg-subtle'
                  )}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{org.name}</div>
                    <div className="truncate text-xs text-fg-subtle capitalize">{org.role}</div>
                  </div>
                  {org.id === organization.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Link
                to="/settings/org"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-fg-muted transition-all duration-200 hover:bg-bg-card hover:text-fg"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Organization Settings</span>
              </Link>
              <div className="mt-1 flex items-center gap-2 px-3 py-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New org name"
                  className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-bg transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

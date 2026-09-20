import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useSession } from '@clerk/react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthContextValue {
  user: { id: string; email: string; agency_name?: string } | null;
  token: string | null;
  organization: Organization | null;
  organizations: Organization[];
  roles: string[];
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, orgName?: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ORG_KEY = 'livecheck_org';
const ORGS_KEY = 'livecheck_orgs';

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'owner':
      return ['*'];
    case 'admin':
      return ['projects:read', 'projects:write', 'members:read', 'members:manage', 'settings:read', 'settings:write'];
    case 'member':
      return ['projects:read', 'projects:write'];
    default:
      return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const { session } = useSession();

  const [organization, setOrganization] = useState<Organization | null>(() => {
    const saved = localStorage.getItem(ORG_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(ORGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });

  const [token, setToken] = useState<string | null>(null);

  // Get Clerk session token
  useEffect(() => {
    if (session) {
      session.getToken().then((t) => setToken(t));
    } else {
      setToken(null);
    }
  }, [session]);

  // Fetch user's organizations from our backend
  const fetchOrganizations = useCallback(async (clerkToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/organizations`, {
        headers: { Authorization: `Bearer ${clerkToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const orgs = data.organizations || [];
        setOrganizations(orgs);

        // Restore or set default org
        const savedOrg = localStorage.getItem(ORG_KEY);
        if (savedOrg) {
          try {
            const parsed = JSON.parse(savedOrg);
            if (orgs.some((o: Organization) => o.id === parsed.id)) {
              setOrganization(parsed);
              return;
            }
          } catch { /* ignore */ }
        }
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
          localStorage.setItem(ORG_KEY, JSON.stringify(orgs[0]));
        }
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  }, []);

  // Fetch orgs when token becomes available
  useEffect(() => {
    if (token && isSignedIn) {
      fetchOrganizations(token);
    }
  }, [token, isSignedIn, fetchOrganizations]);

  const login = useCallback(async (_email: string, _password: string) => {
    // Clerk handles login via its own UI - this is kept for API compatibility
    // The actual login is handled by Clerk's SignIn component
  }, []);

  const signup = useCallback(async (_email: string, _password: string, _orgName?: string) => {
    // Clerk handles signup via its own UI
  }, []);

  const logout = useCallback(async () => {
    setOrganization(null);
    setOrganizations([]);
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ORGS_KEY);
    await signOut();
  }, [signOut]);

  const switchOrganization = useCallback(async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setOrganization(org);
      localStorage.setItem(ORG_KEY, JSON.stringify(org));
    }
  }, [organizations]);

  const createOrganization = useCallback(async (name: string): Promise<Organization> => {
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create organization');
    }

    const { organization: newOrg } = await res.json();
    const updatedOrgs = [...organizations, newOrg];
    setOrganizations(updatedOrgs);
    setOrganization(newOrg);
    localStorage.setItem(ORGS_KEY, JSON.stringify(updatedOrgs));
    localStorage.setItem(ORG_KEY, JSON.stringify(newOrg));

    return newOrg;
  }, [token, organizations]);

  const authHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (organization) {
      headers['x-org-id'] = organization.id;
    }
    return headers;
  }, [token, organization]);

  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    agency_name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined,
  } : null;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      organization,
      organizations,
      roles: organization ? [organization.role] : [],
      permissions: organization ? getDefaultPermissions(organization.role) : [],
      loading: false,
      login,
      signup,
      logout,
      switchOrganization,
      createOrganization,
      authHeaders,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

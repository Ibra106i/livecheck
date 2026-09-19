import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface User {
  id: string;
  email: string;
  agency_name?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
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

const AUTH_KEY = 'livecheck_auth';
const TOKEN_KEY = 'livecheck_token';
const ORG_KEY = 'livecheck_org';
const ORGS_KEY = 'livecheck_orgs';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (saved && savedToken && !isTokenExpired(savedToken)) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken && !isTokenExpired(savedToken)) return savedToken;
    return null;
  });

  const [organization, setOrganization] = useState<Organization | null>(() => {
    const saved = localStorage.getItem(ORG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return null;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(ORGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      setUser(null);
      setToken(null);
      setOrganization(null);
      setOrganizations([]);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ORG_KEY);
      localStorage.removeItem(ORGS_KEY);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const { user: userData, organization: defaultOrg, organizations: orgs, token: jwt } = await res.json();

      setUser(userData);
      setToken(jwt);
      setOrganization(defaultOrg);
      setOrganizations(orgs);

      localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, jwt);
      if (defaultOrg) localStorage.setItem(ORG_KEY, JSON.stringify(defaultOrg));
      if (orgs) localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, orgName?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', email, password, agencyName: orgName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Signup failed');
      }

      const { user: userData, organization: defaultOrg, organizations: orgs, token: jwt } = await res.json();

      setUser(userData);
      setToken(jwt);
      setOrganization(defaultOrg);
      setOrganizations(orgs);

      localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, jwt);
      if (defaultOrg) localStorage.setItem(ORG_KEY, JSON.stringify(defaultOrg));
      if (orgs) localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setOrganization(null);
    setOrganizations([]);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ORGS_KEY);
  }, []);

  const switchOrganization = useCallback(async (orgId: string) => {
    if (!token) return;

    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'switch-org', org_id: orgId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to switch organization');
    }

    const { organization: newOrg, token: newToken } = await res.json();

    setOrganization(newOrg);
    setToken(newToken);
    localStorage.setItem(ORG_KEY, JSON.stringify(newOrg));
    localStorage.setItem(TOKEN_KEY, newToken);
  }, [token]);

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

    // Add to organizations list and switch to it
    const updatedOrgs = [...organizations, newOrg];
    setOrganizations(updatedOrgs);
    setOrganization(newOrg);
    localStorage.setItem(ORGS_KEY, JSON.stringify(updatedOrgs));
    localStorage.setItem(ORG_KEY, JSON.stringify(newOrg));

    // Get new token with updated org context
    const switchRes = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'switch-org', org_id: newOrg.id }),
    });

    if (switchRes.ok) {
      const { token: newToken } = await switchRes.json();
      setToken(newToken);
      localStorage.setItem(TOKEN_KEY, newToken);
    }

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

  return (
    <AuthContext.Provider value={{
      user,
      token,
      organization,
      organizations,
      roles: organization ? [organization.role] : [],
      permissions: organization ? getDefaultPermissions(organization.role) : [],
      loading,
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

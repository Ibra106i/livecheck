import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  agency_name?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, agencyName?: string) => Promise<void>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = 'livecheck_auth';
const TOKEN_KEY = 'livecheck_token';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
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
    // Clear stale auth
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken && !isTokenExpired(savedToken)) return savedToken;
    return null;
  });

  const [loading] = useState(false);

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      setUser(null);
      setToken(null);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const { user: userData, token: jwt } = await res.json();
    setUser(userData);
    setToken(jwt);
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, jwt);
  }, []);

  const signup = useCallback(async (email: string, password: string, agencyName?: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password, agencyName }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Signup failed');
    }

    const { user: userData, token: jwt } = await res.json();
    setUser(userData);
    setToken(jwt);
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, jwt);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

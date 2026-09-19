import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SSOCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const orgData = searchParams.get('org');
    const orgsData = searchParams.get('orgs');

    if (token && orgData) {
      try {
        const org = JSON.parse(decodeURIComponent(orgData));
        const orgs = orgsData ? JSON.parse(decodeURIComponent(orgsData)) : [];

        // Store auth data
        const API_BASE = import.meta.env.VITE_API_URL || '';

        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));

        const userData = {
          id: payload.sub,
          email: payload.email,
        };

        localStorage.setItem('livecheck_auth', JSON.stringify(userData));
        localStorage.setItem('livecheck_token', token);
        localStorage.setItem('livecheck_org', JSON.stringify(org));
        localStorage.setItem('livecheck_orgs', JSON.stringify(orgs));

        // Reload to pick up new auth state
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('SSO callback parse error:', err);
        navigate('/login?error=sso_parse_error');
      }
    } else {
      navigate('/login?error=sso_missing_token');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
        <p className="mt-4 text-sm text-zinc-500">Completing SSO sign-in...</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LogIn, Shield } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoAvailable, setSsoAvailable] = useState<boolean | null>(null);
  const [ssoType, setSsoType] = useState<string | null>(null);

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) {
      setSsoAvailable(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setSsoAvailable(data.sso_available);
        setSsoType(data.type || null);
      }
    } catch {
      setSsoAvailable(false);
    }
  };

  const handleSSOLogin = async () => {
    if (!email) { setError('Enter your email first'); return; }
    setSsoLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'SSO initiation failed');
      }
      const data = await res.json();
      if (!data.sso_available) {
        setError('No SSO configured for this email domain');
        return;
      }
      window.location.href = data.redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SSO login failed');
      setSsoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your agency dashboard</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/25 bg-red-500/[0.04] p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                />
              </div>

              {ssoAvailable === true && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] p-3 text-sm text-emerald-300">
                  <Shield className="h-4 w-4" />
                  SSO available for this domain
                </div>
              )}

              {ssoAvailable !== true && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {ssoAvailable === true && (
                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  onClick={handleSSOLogin}
                  disabled={ssoLoading}
                >
                  {ssoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Sign in with {ssoType === 'saml' ? 'SAML SSO' : 'SSO'}
                </Button>
              )}

              {ssoAvailable !== true && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> Sign In
                    </>
                  )}
                </Button>
              )}
            </form>

            <div className="mt-4 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-emerald-400 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

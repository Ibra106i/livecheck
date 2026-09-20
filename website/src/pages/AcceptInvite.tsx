import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { authHeaders, token: authToken } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orgName, setOrgName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No invitation token provided.');
      return;
    }

    if (!authToken) {
      setStatus('error');
      setErrorMessage('not_authenticated');
      return;
    }

    const acceptInvite = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/invitations/accept/${token}`, {
          method: 'POST',
          headers: authHeaders(),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to accept invitation');
        }

        const data = await res.json();
        setOrgName(data.organization?.name || 'your organization');
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to accept invitation');
      }
    };

    acceptInvite();
  }, [token, authToken, authHeaders]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
          <p className="mt-4 text-sm text-zinc-400">Accepting your invitation...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">You're in!</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You've successfully joined <span className="font-medium text-zinc-200">{orgName}</span>.
          </p>
          <Button className="mt-8" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (errorMessage === 'not_authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <XCircle className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Sign in required</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You need to sign in before accepting this invitation.
          </p>
          <Link to="/login">
            <Button className="mt-8">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Invitation failed</h1>
        <p className="mt-2 text-sm text-zinc-400">{errorMessage}</p>
        <Link to="/dashboard">
          <Button variant="outline" className="mt-8">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

import { SignUp } from '@clerk/react';
import { dark } from '@clerk/themes';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function ClerkSignup() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo className="h-8 w-8" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Create Account</h1>
          <p className="mt-1 text-sm text-zinc-500">Start auditing and fixing your clients&apos; AI-built websites</p>
        </div>

        <SignUp
          appearance={dark}
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
        />

        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

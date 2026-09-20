import { SignIn } from '@clerk/react';
import { dark } from '@clerk/themes';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function ClerkLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo className="h-8 w-8" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your agency dashboard</p>
        </div>

        <SignIn
          appearance={dark}
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
        />

        <div className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-emerald-400 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

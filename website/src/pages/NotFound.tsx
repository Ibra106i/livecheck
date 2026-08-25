import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
        <ShieldAlert className="h-12 w-12 text-emerald-400" />
        <h1 className="mt-6 text-3xl font-bold text-white">404 — Page not found</h1>
        <p className="mt-3 text-zinc-500">
          The page you're looking for doesn't exist, or has moved. Even our automated audit can't rescue
          this one.
        </p>
        <Link to="/" className="mt-8">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

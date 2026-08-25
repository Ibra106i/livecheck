import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-zinc-500">
              The last-mile rescue layer marketing agencies and dev shops plug in before handing an
              AI-built site to a client.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li><a href="#the-fix" className="hover:text-zinc-200">The Fix Package</a></li>
              <li><a href="#pricing" className="hover:text-zinc-200">Pricing &amp; Boundaries</a></li>
              <li><a href="#roadmap" className="hover:text-zinc-200">Livecheck SaaS Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">Agencies</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li><Link to="/dashboard" className="hover:text-zinc-200">Agency Dashboard</Link></li>
              <li><Link to="/audit" className="hover:text-zinc-200">Start Pre-Intake Audit</Link></li>
              <li><Link to="/white-label" className="hover:text-zinc-200">White-Label Program</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>partners@livecheck.dev</li>
              <li>Response within 4 business hours</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Livecheck. Built for agencies, not DIY.</p>
          <p>Custom backend &amp; API work billed separately at $185/hr.</p>
        </div>
      </div>
    </footer>
  );
}

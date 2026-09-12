import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Twitter, Github, Mail, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo size="lg" />
            <p className="mt-4 max-w-xs text-sm text-fg-muted leading-relaxed">
              The last-mile rescue layer agencies and dev shops plug in before handing an
              AI-built site to a client. Fixed scope. Flat fee. Zero scope creep.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="https://twitter.com/livecheck" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com/livecheck" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-primary transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/company/livecheck" target="_blank" rel="noopener noreferrer" className="text-fg-muted hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:partners@livecheck.dev" className="text-fg-muted hover:text-primary transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-fg">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-fg-muted">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#solution" className="hover:text-primary transition-colors">The 5 Fixes</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing & Boundaries</a></li>
              <li><a href="#proof" className="hover:text-primary transition-colors">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-fg">Agencies</h4>
            <ul className="mt-4 space-y-3 text-sm text-fg-muted">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Agency Dashboard</Link></li>
              <li><Link to="/audit" className="hover:text-primary transition-colors">Start Pre-Intake Audit</Link></li>
              <li><Link to="/white-label" className="hover:text-primary transition-colors">White-Label Program</Link></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">Partner FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-fg">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-fg-muted">
              <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#careers" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#press" className="hover:text-primary transition-colors">Press</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-fg">Legal</h4>
            <ul className="mt-4 space-y-3 text-sm text-fg-muted">
              <li><a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#sla" className="hover:text-primary transition-colors">SLA</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} Livecheck. Built for agencies, not DIY.</p>
          <p>Custom backend & API work billed separately at $185/hr.</p>
        </div>
      </div>
    </footer>
  );
}
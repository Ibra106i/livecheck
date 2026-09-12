import { ArrowRight, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,_rgba(6,214,160,0.15)_0%,_transparent_50%),_radial-gradient(ellipse_at_85%_0%,_rgba(96,165,250,0.1)_0%,_transparent_40%)]" />
      <div className="absolute inset-0 opacity-[0.02] bg-grid" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge variant="outline" className="mx-auto mb-6 flex items-center justify-center gap-2">
            <Building2 className="h-3 w-3" />
            Built for agencies & AI dev shops — not DIY owners
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl xl:text-7xl">
            Your AI website builder gets you{' '}
            <span className="text-gradient">80% there.</span>
            <br />
            We close the last mile.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-fg-muted leading-relaxed">
            Livecheck is the productized rescue layer agencies plug in before handoff — five fixed
            technical fixes, an automation script that auto-patches most of it before a human ever
            looks, and a white-label SLA your clients never see you sweat over.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/audit">
              <Button size="lg" className="w-full sm:w-auto group">
                Start a Free Pre-Intake Audit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See Agency Dashboard
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-fg-subtle">
            No spec calls. No open-ended scoping. Instant automated accept/reject in under a minute.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {[
            { value: '1,240+', label: 'AI-built sites rescued' },
            { value: '80%', label: 'Auto-patched before human review' },
            { value: '36 hrs', label: 'Average turnaround' },
            { value: '$185/hr', label: 'Clear rate beyond scope' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-fg sm:text-3xl lg:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs text-fg-subtle">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
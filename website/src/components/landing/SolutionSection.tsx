import { ShieldCheck } from 'lucide-react';
import { FIXES } from '../../lib/mockData';
import { FeatureCard } from './FeatureCard';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';

export function SolutionSection() {
  return (
    <section id="solution" className="border-b border-border bg-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="outline" className="mx-auto mb-4">
            <ShieldCheck className="h-3 w-3" /> The Rescue Package
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            One productized package. Five fixes. No scope creep.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            We don't do open-ended "fix my site" engagements anymore. Livecheck covers exactly five
            predefined technical fixes — quoted, scoped, and delivered the same way every time.
          </p>
        </motion.div>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {FIXES.map((fix, i) => (
            <motion.div
              key={fix.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <FeatureCard fix={fix} index={i} delay={i * 0.05} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
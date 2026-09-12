import { ScanSearch, Wrench, UserCheck, FileCheck2 } from 'lucide-react';
import { StepCard } from './StepCard';
import { motion } from 'framer-motion';

const steps = [
  { icon: ScanSearch, title: 'Pre-Intake Audit', desc: 'Submit the URL. Our scoring engine instantly flags sites with custom backends, live payments, or hand-coded chaos — and rejects them before anyone wastes an hour.' },
  { icon: Wrench, title: 'Automated Patch Script', desc: 'For everything that qualifies, our script auto-resolves roughly 80% of the common AI deployment errors within minutes — SSL, redirects, meta tags, compression, and more.' },
  { icon: UserCheck, title: 'Human QA Sign-Off', desc: 'A rescue engineer verifies the remaining edge cases, confirms nothing regressed, and signs off on the deliverable.' },
  { icon: FileCheck2, title: 'White-Label SLA', desc: 'You receive a client-ready completion certificate under your own brand — proof of work, warranty terms, and zero technical explaining required.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border bg-bg-elevated/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            From submission to signed-off deliverable
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Automated where it can be. Human where it matters. Every project follows the same
            four-stage pipeline.
          </p>
        </motion.div>
        <div className="mx-auto mt-14 grid max-w-6xl gap-8 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              <StepCard {...step} number={i + 1} delay={i * 0.08} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
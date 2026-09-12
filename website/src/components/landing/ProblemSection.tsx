import { Lock, Send, Smartphone, Search, Gauge, Clock } from 'lucide-react';
import { ProblemCard } from './ProblemCard';
import { motion } from 'framer-motion';

const problems = [
  { icon: Lock, title: 'SSL warnings on launch day', desc: 'Client screenshots a "Not Secure" badge to you five minutes before their launch email goes out.' },
  { icon: Send, title: 'Forms that go nowhere', desc: 'The AI builder wired the contact form to a dead endpoint. Leads have been vanishing for weeks.' },
  { icon: Smartphone, title: 'Broken on mobile', desc: 'Looks perfect on the builder\'s desktop preview. Overflows and stacks wrong on an actual iPhone.' },
  { icon: Search, title: 'Invisible to Google', desc: 'No title tags, no meta descriptions, no Open Graph data. The site doesn\'t exist in search.' },
  { icon: Gauge, title: 'Slow, bloated pages', desc: 'Uncompressed hero images and unused scripts tank Core Web Vitals before the client even sees it.' },
  { icon: Clock, title: 'Un-billable firefighting', desc: 'Your devs burn hours on one-off fixes that were never scoped, quoted, or margin-positive.' },
];

export function ProblemSection() {
  return (
    <section id="problem" className="border-b border-border bg-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
            AI ships the site. Your team eats the last 20%.
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Every AI builder leaves the same handful of landmines behind — and they land on your
            billable hours, not the client's. It's unpredictable, unbudgeted work your team didn't
            price into the project.
          </p>
        </motion.div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <ProblemCard {...item} delay={i * 0.08} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
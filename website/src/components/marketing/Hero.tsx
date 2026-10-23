import { Github } from 'lucide-react';
import { Aurora } from './Aurora';
import { CommandBar, type CommandPreset } from './CommandBar';
import { Terminal } from './Terminal';

const PRESETS: CommandPreset[] = [
  { flag: '--json', description: 'Print the report as JSON instead of the terminal view.' },
  { flag: '-o reports/', description: 'Save a markdown and a JSON report to reports/.' },
  { flag: '--lighthouse', description: 'Add a Lighthouse performance score (needs lighthouse + chrome-launcher).' },
  { flag: '--ai', description: 'Append a plain-language AI analysis (needs an API key).' },
  { flag: '--probe-forms', description: 'Submit the first form found. Asks for confirmation first.' },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <Aurora />
      <div aria-hidden="true" className="dot-grid absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-12">
          <div className="min-w-0 max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 font-mono text-[12px] text-slate-300">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-pass" />
              Open-source CLI · Node 18+ · MIT
            </p>

            <h1 className="mt-5 text-[36px] font-extrabold leading-[44px] tracking-[-0.03em] text-white sm:text-[44px] sm:leading-[52px] lg:text-[56px] lg:leading-[64px]">
              Audit any live website from your terminal.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              One command checks DNS, SSL, security headers, SEO, mobile layout and page speed, then
              prints a 0–100 score. Read-only by default — it never submits a form unless you opt in.
            </p>

            <div className="mt-8">
              <CommandBar id="install" subject="install command" presets={PRESETS} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/Ibra106i/livecheck"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex select-none items-center gap-2 rounded-lg border border-line bg-panel/60 px-4 py-2 text-[13px] font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <Github aria-hidden="true" className="h-4 w-4" />
                View on GitHub
              </a>
              <a
                href="https://www.npmjs.com/package/livechecks"
                target="_blank"
                rel="noreferrer noopener"
                className="select-none rounded-lg px-1 py-2 font-mono text-[12px] text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                livechecks on npm
              </a>
            </div>

            <p className="mt-6 max-w-md font-mono text-[12px] leading-5 text-slate-400">
              The mobile, speed and form checks run in headless Chromium
              (<span className="text-slate-300">npx playwright install chromium</span>). Everything
              else is plain Node.
            </p>
          </div>

          <div id="output" className="min-w-0 scroll-mt-24">
            <Terminal />
          </div>
        </div>
      </div>
    </section>
  );
}

import { Reveal } from './Reveal';

const EXIT_CODES = [
  { code: '0', label: 'nothing failed', tone: 'text-pass' },
  { code: '1', label: 'at least one check failed', tone: 'text-warn' },
  { code: '2', label: 'the audit itself could not run', tone: 'text-red-400' },
];

const WORKFLOW = `- name: Audit the deployed site
  run: npx livechecks https://your-site.com --json -o reports/

- name: Upload the report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: livecheck-report
    path: reports/`;

export function CiSection() {
  return (
    <section id="ci" className="scroll-mt-24 border-b border-line bg-ink py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-cyan-400">CI / CD</p>
          <h2 className="mt-3 text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-white sm:text-[40px] sm:leading-[48px]">
            Exit codes your pipeline already understands.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            No plugin, no hosted runner, no account. A failing check sets the process exit code, so the
            step fails the same way any other test step does.
          </p>

          <dl className="mt-8 space-y-2">
            {EXIT_CODES.map((item) => (
              <div
                key={item.code}
                className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2"
              >
                <dt className="font-mono text-[13px] text-slate-400">exit</dt>
                <dd className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={`font-mono text-[13px] ${item.tone}`}>{item.code}</span>
                  <span className="text-[13px] text-slate-300">{item.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-sm leading-6 text-slate-400">
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-slate-200">--json</code>{' '}
            prints the report to stdout for other tools;{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-slate-200">-o reports/</code>{' '}
            writes a timestamped markdown and JSON pair you can upload as an artifact.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line bg-socket px-4 py-2.5">
              <span className="font-mono text-[12px] text-slate-400">.github/workflows/audit.yml</span>
              <span className="font-mono text-[12px] text-slate-400">yaml</span>
            </div>
            <pre
              tabIndex={0}
              aria-label="Example GitHub Actions workflow"
              className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-6 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-inset"
            >
              <code>{WORKFLOW}</code>
            </pre>
          </div>
          <p className="mt-3 font-mono text-[12px] leading-5 text-slate-400">
            The upload step needs <span className="text-slate-200">if: always()</span> because a failed
            audit stops the job before later steps run.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

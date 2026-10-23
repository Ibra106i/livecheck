import { CommandBar } from './CommandBar';
import { Reveal } from './Reveal';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-ink-alt py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 60% at 50% 0%, rgba(0,242,254,0.10) 0%, rgba(0,242,254,0) 70%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-white sm:text-[40px] sm:leading-[48px]">
            Run it before your users do.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            Any public URL, one command, one score. Private and loopback addresses are refused, so it
            stays pointed at things that are actually live.
          </p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <CommandBar subject="example command" />
          </div>
          <p className="mt-4 font-mono text-[12px] text-slate-400">
            Node 18+ · MIT licensed · exit code 1 when a check fails
          </p>
        </Reveal>
      </div>
    </section>
  );
}

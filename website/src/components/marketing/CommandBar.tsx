import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

/** The published entry point. Kept in one place so every example copies the same thing. */
export const BASE_COMMAND = 'npx livechecks https://yoursite.com';

export type CommandPreset = {
  /** A flag that really exists in `src/cli.ts`. */
  flag: string;
  /** Longer description for the button title/tooltip. */
  description: string;
};

type CopyState = 'idle' | 'copied' | 'failed';

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context — fall through to the legacy path.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

type CommandBarProps = {
  id?: string;
  presets?: CommandPreset[];
  className?: string;
  /** Screen-reader context, e.g. "install command" or "example command". */
  subject?: string;
};

export function CommandBar({ id, presets = [], className, subject = 'command' }: CommandBarProps) {
  const [activeFlags, setActiveFlags] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const timerRef = useRef<number | null>(null);
  const codeId = useId();
  const toastId = useId();

  const command = activeFlags.length ? `${BASE_COMMAND} ${activeFlags.join(' ')}` : BASE_COMMAND;

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await writeClipboard(command);
    setCopyState(ok ? 'copied' : 'failed');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopyState('idle'), 2200);
  }, [command]);

  const toggleFlag = (flag: string) => {
    setActiveFlags((current) =>
      current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag]
    );
  };

  const toastMessage =
    copyState === 'copied'
      ? 'Command copied to clipboard.'
      : copyState === 'failed'
        ? 'Copy failed — select the command and copy it manually.'
        : '';

  return (
    <div id={id} className={cn('w-full min-w-0', className)}>
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-line bg-panel/80 py-2 pl-4 pr-2 backdrop-blur">
        <span aria-hidden="true" className="font-mono text-sm text-cyan-400">
          $
        </span>
        <code
          id={codeId}
          className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1 font-mono text-[13px] leading-6 text-slate-200"
        >
          {command}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${subject} to clipboard`}
          className={cn(
            'inline-flex shrink-0 select-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
            copyState === 'copied'
              ? 'bg-pass/15 text-pass'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          )}
        >
          {copyState === 'copied' ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          <span aria-hidden="true">{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {presets.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-slate-400">Flags</span>
          {presets.map((preset) => {
            const pressed = activeFlags.includes(preset.flag);
            return (
              <button
                key={preset.flag}
                type="button"
                aria-pressed={pressed}
                title={preset.description}
                onClick={() => toggleFlag(preset.flag)}
                className={cn(
                  'select-none rounded-full border px-3 py-1 font-mono text-[12px] leading-5 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
                  pressed
                    ? 'border-cyan/50 bg-cyan/10 text-cyan-400'
                    : 'border-line bg-transparent text-slate-400 hover:border-white/20 hover:text-slate-200'
                )}
              >
                {preset.flag}
              </button>
            );
          })}
        </div>
      )}

      <div
        id={toastId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
          copyState === 'idle' ? 'opacity-0' : 'toast-enter opacity-100'
        )}
      >
        {toastMessage && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-xs text-slate-200 shadow-xl',
              copyState === 'failed' && 'text-warn'
            )}
          >
            {copyState === 'failed' ? (
              <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-pass" />
            )}
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

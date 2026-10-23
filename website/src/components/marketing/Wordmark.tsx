import { cn } from '../../lib/utils';

export function Wordmark({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1.25"
          y="1.25"
          width="21.5"
          height="21.5"
          rx="6.5"
          stroke="#00F2FE"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <path
          d="M6.4 12.6l3.3 3.2 7.5-8.2"
          stroke="#00F2FE"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="text-[15px] font-bold tracking-[-0.01em] text-white">Livecheck</span>
      )}
    </span>
  );
}

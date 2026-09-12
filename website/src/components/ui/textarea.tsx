import * as React from 'react';
import { cn } from '../../lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none hover:border-border-hover',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
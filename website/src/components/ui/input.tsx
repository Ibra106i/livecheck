import * as React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed hover:border-border-hover',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
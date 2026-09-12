import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-11 w-full appearance-none rounded-xl border border-border bg-bg-elevated px-4 pr-10 py-2.5 text-sm text-fg transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed hover:border-border-hover',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  )
);
Select.displayName = 'Select';
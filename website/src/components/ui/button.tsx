import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
  outline: 'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800/60 hover:border-zinc-600',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800/60 hover:text-white',
  destructive: 'bg-red-500/90 text-white hover:bg-red-500',
  link: 'bg-transparent text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline p-0 h-auto',
};

const sizeClasses: Record<Size, string> = {
  default: 'h-10 px-5 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-7 text-base',
  icon: 'h-10 w-10 shrink-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';

import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'primary-soft';
type Size = 'default' | 'sm' | 'lg' | 'xl' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-bg hover:bg-primary-hover shadow-glow transition-all duration-200',
  'primary-soft': 'bg-primary-bg text-primary border-primary-border hover:bg-primary/20 hover:border-primary transition-all duration-200',
  secondary: 'bg-bg-elevated text-fg border-border hover:bg-bg-card hover:border-border-hover transition-all duration-200',
  outline: 'border-border bg-transparent text-fg hover:bg-bg-elevated hover:border-border-hover transition-all duration-200',
  ghost: 'bg-transparent text-fg-muted hover:bg-bg-elevated hover:text-fg transition-all duration-200',
  destructive: 'bg-danger/90 text-bg hover:bg-danger transition-all duration-200',
  link: 'bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto',
};

const sizeClasses: Record<Size, string> = {
  default: 'h-11 px-5 text-sm',
  sm: 'h-9 px-3.5 text-xs',
  lg: 'h-12 px-7 text-base',
  xl: 'h-14 px-9 text-lg',
  icon: 'h-11 w-11 shrink-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-ring active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
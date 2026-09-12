import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary-bg text-primary border-primary-border',
  primary: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-bg-elevated text-fg-muted border-border',
  outline: 'bg-transparent text-fg-muted border-border',
  success: 'bg-success-bg text-success border-success-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  danger: 'bg-danger-bg text-danger border-danger-border',
  info: 'bg-accent-bg text-accent border-accent-border',
};

export function Badge({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant; size?: 'default' | 'sm' | 'lg' }) {
  const sizeClasses = {
    default: 'px-3 py-1 text-xs',
    sm: 'px-2.5 py-0.5 text-[10px]',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
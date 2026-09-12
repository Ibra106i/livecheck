import { ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function Logo({ className, iconOnly = false, size = 'default' }: { className?: string; iconOnly?: boolean; size?: 'default' | 'sm' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeClasses = {
    sm: 'text-base',
    default: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dim text-bg shadow-glow',
        sizeClasses[size]
      )}>
        <ShieldCheck className={cn('stroke-[2.5]', size === 'sm' && 'h-4 w-4', size === 'default' && 'h-5 w-5', size === 'lg' && 'h-6 w-6')} />
      </div>
      {!iconOnly && <span className={cn('font-bold tracking-tight text-fg', textSizeClasses[size])}>Livecheck</span>}
    </div>
  );
}
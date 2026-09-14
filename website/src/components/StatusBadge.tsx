import type { ProjectStatus } from '../lib/types';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ScanSearch } from 'lucide-react';

const CONFIG: Record<ProjectStatus, { label: string; variant: 'danger' | 'warning' | 'info' | 'success'; icon: React.ElementType }> = {
  rejected: { label: 'Rejected — Custom Scope', variant: 'danger', icon: AlertTriangle },
  pending_review: { label: 'Pending Kickoff', variant: 'warning', icon: Clock },
  scanned: { label: 'Scan Complete', variant: 'info', icon: ScanSearch },
  auto_patching: { label: 'Auto-Patching', variant: 'info', icon: Loader2 },
  in_review: { label: 'Human QA Review', variant: 'info', icon: ScanSearch },
  delivered: { label: 'Delivered', variant: 'success', icon: CheckCircle2 },
};

export function StatusBadge({ status, size = 'default' }: { status: ProjectStatus; size?: 'default' | 'sm' | 'lg' }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} size={size}>
      <Icon className={cn(`h-3.5 w-3.5 ${size === 'sm' && 'h-3 w-3'} ${status === 'auto_patching' ? 'animate-spin' : ''}`)} />
      {cfg.label}
    </Badge>
  );
}

import { cn } from '../lib/utils';
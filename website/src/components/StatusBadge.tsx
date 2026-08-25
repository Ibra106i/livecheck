import type { ProjectStatus } from '../lib/types';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ScanSearch } from 'lucide-react';

const CONFIG: Record<ProjectStatus, { label: string; variant: 'danger' | 'warning' | 'info' | 'success'; icon: React.ElementType }> = {
  rejected: { label: 'Rejected — Custom Scope', variant: 'danger', icon: AlertTriangle },
  pending_review: { label: 'Pending Kickoff', variant: 'warning', icon: Clock },
  auto_patching: { label: 'Auto-Patching', variant: 'info', icon: Loader2 },
  in_review: { label: 'Human QA Review', variant: 'info', icon: ScanSearch },
  delivered: { label: 'Delivered', variant: 'success', icon: CheckCircle2 },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className={`h-3 w-3 ${status === 'auto_patching' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </Badge>
  );
}

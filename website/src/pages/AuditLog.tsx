import { useState, useEffect, useCallback } from 'react';
import { History, Download, ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  ip_address: string;
  details: string;
}

const ACTION_LABELS: Record<string, string> = {
  'organization.created': 'Organization Created',
  'member.added': 'Member Added',
  'member.removed': 'Member Removed',
  'member.invited': 'Member Invited',
  'member.invitation_accepted': 'Invitation Accepted',
  'project.created': 'Project Created',
  'scan.completed': 'Scan Completed',
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] || action;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AuditLog() {
  const { authHeaders } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`${API_BASE}/api/audit-logs?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo, authHeaders]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'IP Address', 'Details'];
    const rows = logs.map((l) => [l.timestamp, l.user_email, l.action, l.ip_address, l.details]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilterReset = () => {
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Audit Log</h1>
            <p className="mt-1 text-sm text-zinc-500">
              View all activity within your organization.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]">
                <Label htmlFor="actionFilter" className="text-xs text-zinc-400">Action Type</Label>
                <select
                  id="actionFilter"
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-border bg-bg-card px-3 text-sm text-zinc-100"
                >
                  <option value="">All Actions</option>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px]">
                <Label htmlFor="dateFrom" className="text-xs text-zinc-400">From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="mt-1"
                />
              </div>
              <div className="min-w-[160px]">
                <Label htmlFor="dateTo" className="text-xs text-zinc-400">To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="mt-1"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={handleFilterReset}>
                <Filter className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-500" />
                        <span className="mt-2 block text-sm">Loading audit logs...</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                        <History className="mx-auto h-8 w-8 text-zinc-700" />
                        <span className="mt-2 block">No audit log entries found.</span>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-zinc-900/50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-3 text-zinc-400">{formatDate(log.timestamp)}</td>
                        <td className="px-6 py-3 text-zinc-100">{log.user_email}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-zinc-500">{log.ip_address}</td>
                        <td className="max-w-xs truncate px-6 py-3 text-zinc-400" title={log.details}>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

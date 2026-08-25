import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  PlusCircle,
  DollarSign,
  Gauge,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useProjects } from '../context/ProjectsContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { PACKAGE_PRICE } from '../lib/mockData';

export default function Dashboard() {
  const { projects } = useProjects();

  const delivered = projects.filter((p) => p.status === 'delivered');
  const active = projects.filter((p) => ['auto_patching', 'in_review', 'pending_review'].includes(p.status));
  const rejected = projects.filter((p) => p.status === 'rejected');

  const hoursSaved = delivered.reduce((sum, p) => sum + (p.hoursSaved || 0), 0);
  const whiteLabelRevenue = delivered
    .filter((p) => p.whiteLabel && p.markupPrice)
    .reduce((sum, p) => sum + ((p.markupPrice || 0) - PACKAGE_PRICE), 0);
  const avgTurnaround = delivered.length
    ? Math.round(delivered.reduce((sum, p) => sum + (p.turnaroundHours || 0), 0) / delivered.length)
    : 0;

  const metrics = [
    {
      label: 'Billable Hours Saved',
      value: `${hoursSaved} hrs`,
      sub: `Across ${delivered.length} delivered rescues`,
      icon: Clock,
    },
    {
      label: 'Audits Completed',
      value: `${projects.length}`,
      sub: `${rejected.length} auto-rejected — saved from unprofitable scope`,
      icon: CheckCircle2,
    },
    {
      label: 'White-Label Revenue',
      value: formatCurrency(whiteLabelRevenue),
      sub: 'Markup margin earned on delivered projects',
      icon: DollarSign,
    },
    {
      label: 'Avg. Turnaround',
      value: avgTurnaround ? `${avgTurnaround} hrs` : '—',
      sub: 'From submission to signed-off delivery',
      icon: Gauge,
    },
  ];

  const sorted = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Agency Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">Track every rescue project across your client portfolio.</p>
          </div>
          <Link to="/audit">
            <Button size="lg">
              <PlusCircle className="h-4 w-4" /> New Audit
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{m.label}</span>
                    <m.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">{m.value}</div>
                  <div className="mt-1 text-xs text-zinc-500">{m.sub}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="mt-8">
          <div className="flex items-center justify-between border-b border-zinc-800 p-6">
            <div>
              <h2 className="font-semibold text-zinc-100">Recent Projects</h2>
              <p className="text-sm text-zinc-500">Every audit submitted through your agency console.</p>
            </div>
          </div>
          {sorted.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-500">
              No projects yet. Start your first pre-intake audit to see it here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Complexity</TableHead>
                  <TableHead>White-Label</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-zinc-100">
                      <div className="flex items-center gap-1.5">
                        {p.siteUrl}
                        <ExternalLink className="h-3 w-3 text-zinc-600" />
                      </div>
                      <div className="text-xs text-zinc-500">{p.id.toUpperCase()}</div>
                    </TableCell>
                    <TableCell>{p.clientName}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          p.complexityScore >= 50
                            ? 'text-red-400 font-medium'
                            : p.complexityScore >= 40
                            ? 'text-amber-400 font-medium'
                            : 'text-emerald-400 font-medium'
                        }
                      >
                        {p.complexityScore}/100
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.whiteLabel ? (
                        <span className="text-zinc-300">{formatCurrency(p.markupPrice || 0)}</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500">{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/projects/${p.id}`}>
                        <Button size="sm" variant="outline">
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {active.length > 0 && (
          <div className="mt-8 rounded-xl border border-blue-500/25 bg-blue-500/[0.04] p-5">
            <p className="text-sm text-blue-300">
              <strong>{active.length}</strong> project{active.length > 1 ? 's are' : ' is'} currently moving
              through auto-patching or QA. Status updates in real time as fixes complete.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

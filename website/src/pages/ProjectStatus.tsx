import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileCheck2,
  AlertTriangle,
  ExternalLink,
  Mail,
  Calendar,
  Layers,
  Bot,
  UserCheck,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { StatusBadge } from '../components/StatusBadge';
import { FixTimeline } from '../components/FixTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useProjects } from '../context/ProjectsContext';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { buildCertificateHtml, downloadCertificate } from '../lib/certificate';
import { PACKAGE_PRICE, CUSTOM_HOURLY_RATE } from '../lib/mockData';

export default function ProjectStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, whiteLabel } = useProjects();
  const [certOpen, setCertOpen] = useState(false);
  const project = id ? getProject(id) : undefined;

  if (!project) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="mt-4 text-xl font-semibold text-white">Project not found</h1>
          <p className="mt-2 text-sm text-zinc-500">It may have been removed, or the link is incorrect.</p>
          <Button className="mt-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  const canViewCertificate = project.status === 'delivered';
  const price = project.whiteLabel ? project.markupPrice || whiteLabel.resalePrice : PACKAGE_PRICE;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{project.siteUrl}</h1>
              <ExternalLink className="h-4 w-4 text-zinc-600" />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {project.clientName} &middot; {project.id.toUpperCase()} &middot; via {project.builderTool}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Calendar, label: 'Submitted', value: formatDate(project.createdAt) },
            { icon: Layers, label: 'Complexity', value: `${project.complexityScore}/100` },
            { icon: Mail, label: 'Client Contact', value: project.clientEmail },
            { icon: FileCheck2, label: 'Package Value', value: formatCurrency(price) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <s.icon className="h-4 w-4 text-zinc-500" />
              <div className="mt-2 truncate text-sm font-semibold text-zinc-100" title={s.value}>{s.value}</div>
              <div className="text-xs text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>

        {project.status === 'rejected' ? (
          <Card className="mt-8 border-red-500/30">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-7 w-7 text-red-400" />
                <div>
                  <h2 className="font-semibold text-zinc-100">Rejected before human review</h2>
                  <p className="text-sm text-zinc-500">This project was auto-rejected to prevent unprofitable scope creep.</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {(project.rejectionReasons || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-3 text-sm text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {r}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4">
                <p className="text-sm text-amber-300">
                  This project qualifies for a custom scoped engagement at <strong>${CUSTOM_HOURLY_RATE}/hr</strong>,
                  quoted in writing before any work begins.
                </p>
              </div>
              <Button
                className="mt-6"
                variant="secondary"
                onClick={() => (window.location.href = `mailto:partners@livecheck.dev?subject=Custom quote request — ${project.siteUrl}`)}
              >
                Request Custom Quote
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="timeline" className="mt-8">
            <TabsList>
              <TabsTrigger value="timeline">Fix Timeline</TabsTrigger>
              <TabsTrigger value="log">Patch Log</TabsTrigger>
              <TabsTrigger value="deliverable">Deliverable</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <FixTimeline fixes={project.fixes} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="log">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-4">
                    {[...project.patchLog].reverse().map((entry) => (
                      <div key={entry.id} className="flex gap-3 border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${entry.automated ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'}`}>
                          {entry.automated ? <Bot className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={entry.automated ? 'info' : 'secondary'}>
                              {entry.automated ? 'Auto-patched' : 'Human QA'}
                            </Badge>
                            <span className="text-xs text-zinc-600">{formatDateTime(entry.timestamp)}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-zinc-300">{entry.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deliverable">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  {canViewCertificate ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                        <FileCheck2 className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="mt-4 font-semibold text-zinc-100">White-Label SLA Certificate ready</h3>
                      <p className="mt-1.5 max-w-sm text-sm text-zinc-500">
                        A client-presentable completion certificate, branded to {project.whiteLabel ? whiteLabel.agencyName : 'Livecheck'}, verifying all five fixes.
                      </p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Button variant="outline" onClick={() => setCertOpen(true)}>
                          Preview Certificate
                        </Button>
                        <Button onClick={() => downloadCertificate(project, whiteLabel)}>
                          <Download className="h-4 w-4" /> Download Certificate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <FileCheck2 className="h-8 w-8 text-zinc-700" />
                      <p className="mt-3 text-sm text-zinc-500">
                        The deliverable and white-label SLA certificate unlock once all five fixes pass human QA
                        sign-off.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {project.agencyNotes && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">Agency notes:</span> {project.agencyNotes}
          </div>
        )}
      </div>

      <Dialog open={certOpen} onOpenChange={setCertOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Certificate preview</DialogTitle>
            <DialogDescription>White-label completion certificate</DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-2 sm:p-4">
            <iframe
              title="certificate-preview"
              className="h-[70vh] w-full rounded-lg border border-zinc-800 bg-white"
              srcDoc={buildCertificateHtml(project, whiteLabel)}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-zinc-800 p-4">
            <Button onClick={() => downloadCertificate(project, whiteLabel)}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

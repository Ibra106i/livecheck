import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ScanSearch,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Smartphone,
  Search,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';
import type { IntakeFormData } from '../lib/types';
import { BUILDER_TOOLS, CUSTOM_HOURLY_RATE, KNOWN_ISSUE_OPTIONS } from '../lib/mockData';

const emptyForm: IntakeFormData = {
  siteUrl: '',
  builderTool: BUILDER_TOOLS[0],
  clientName: '',
  clientEmail: '',
  agencyNotes: '',
  pageCount: '1-5',
  customBackend: false,
  ecommerce: false,
  handCoded: false,
  multiLanguage: false,
  knownIssues: [],
};

type Step = 'intake' | 'scanning' | 'results' | 'done';

interface ScanResults {
  projectId: string;
  score: number;
  scanResult: {
    ssl: { valid: boolean; issuer?: string; expiresAt?: string; daysUntilExpiry?: number; error?: string };
    dns: { resolved: boolean; records?: string[]; error?: string };
    seo: { hasTitle: boolean; titleLength: number; hasMetaDescription: boolean; metaDescriptionLength: number; hasCanonical: boolean; hasOgTags: boolean; hasRobotsTxt: boolean; issues: string[] };
    viewport: { hasViewportMeta: boolean; content?: string; issues: string[] };
    performance: { loadTimeMs?: number; totalSizeBytes?: number; resourceCount?: number; issues: string[] };
    _forms: { formCount: number; formsWithAction: number; deadEndpoints: string[]; issues: string[] };
  };
}

export default function NewAudit() {
  const navigate = useNavigate();
  const { createProject, whiteLabel } = useProjects();
  const { authHeaders } = useAuth();

  const [step, setStep] = useState<Step>('intake');
  const [form, setForm] = useState<IntakeFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [useWhiteLabel] = useState(whiteLabel.enabledByDefault);
  const [markupPrice] = useState(whiteLabel.resalePrice);
  const [agreeBoundary, setAgreeBoundary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const toggleIssue = (key: string) => {
    setForm((f) => ({
      ...f,
      knownIssues: f.knownIssues.includes(key) ? f.knownIssues.includes(key) ? f.knownIssues.filter((k) => k !== key) : [...f.knownIssues, key] : [...f.knownIssues, key],
    }));
  };

  const validateIntake = () => {
    const errs: Record<string, string> = {};
    if (!form.siteUrl.trim()) errs.siteUrl = 'Site URL is required.';
    else if (!/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(form.siteUrl.trim())) {
      errs.siteUrl = 'Enter a valid domain, e.g. clientsite.com';
    }
    if (!form.clientName.trim()) errs.clientName = "Client's business name is required.";
    if (!form.clientEmail.trim()) errs.clientEmail = 'Client contact email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail.trim())) {
      errs.clientEmail = 'Enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startScan = async () => {
    if (!validateIntake()) return;
    setStep('scanning');
    setScanError(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          url: form.siteUrl,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          builderTool: form.builderTool,
          agencyNotes: form.agencyNotes,
          knownIssues: form.knownIssues,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Scan failed');
      }

      const data: ScanResults = await res.json();
      setScanResults(data);
      setStep('results');
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
      setStep('intake');
    }
  };

  const restart = () => {
    setForm(emptyForm);
    setScanResults(null);
    setScanError(null);
    setAgreeBoundary(false);
    setStep('intake');
  };

  const stepIndex = useMemo(() => {
    if (step === 'intake') return 0;
    if (step === 'scanning') return 1;
    if (step === 'results') return 2;
    return 3;
  }, [step]);

  const allIssues = scanResults
    ? [
        ...scanResults.scanResult.ssl.error ? [`SSL: ${scanResults.scanResult.ssl.error}`] : [],
        ...scanResults.scanResult.dns.error ? [`DNS: ${scanResults.scanResult.dns.error}`] : [],
        ...scanResults.scanResult.seo.issues,
        ...scanResults.scanResult.viewport.issues,
        ...scanResults.scanResult.performance.issues,
        ...scanResults.scanResult._forms.issues,
      ]
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">New Audit Intake</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Submit a site for a real technical scan before any human time is spent.
          </p>
        </div>

        <div className="mb-10 flex items-center gap-2">
          {['Intake', 'Scanning', 'Results', 'Done'].map((label, idx) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  idx <= stepIndex ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {idx + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${idx <= stepIndex ? 'text-zinc-200' : 'text-zinc-600'}`}>
                {label}
              </span>
              {idx < 3 && <div className={`h-px flex-1 ${idx < stepIndex ? 'bg-emerald-500' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'intake' && (
            <motion.div key="intake" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  {scanError && (
                    <div className="rounded-lg border border-red-500/25 bg-red-500/[0.04] p-3 text-sm text-red-300">
                      {scanError}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="siteUrl">Site URL *</Label>
                    <Input
                      id="siteUrl"
                      placeholder="clientsite.com"
                      value={form.siteUrl}
                      onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
                    />
                    {errors.siteUrl && <p className="mt-1.5 text-xs text-red-400">{errors.siteUrl}</p>}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="clientName">Client Business Name *</Label>
                      <Input
                        id="clientName"
                        placeholder="Acme Consulting"
                        value={form.clientName}
                        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                      />
                      {errors.clientName && <p className="mt-1.5 text-xs text-red-400">{errors.clientName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Client Contact Email *</Label>
                      <Input
                        id="clientEmail"
                        placeholder="owner@acmeconsulting.com"
                        value={form.clientEmail}
                        onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                      />
                      {errors.clientEmail && <p className="mt-1.5 text-xs text-red-400">{errors.clientEmail}</p>}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="builderTool">AI Builder Used</Label>
                      <Select
                        id="builderTool"
                        value={form.builderTool}
                        onChange={(e) => setForm({ ...form, builderTool: e.target.value })}
                      >
                        {BUILDER_TOOLS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pageCount">Approx. Page Count</Label>
                      <Select
                        id="pageCount"
                        value={form.pageCount}
                        onChange={(e) => setForm({ ...form, pageCount: e.target.value })}
                      >
                        <option value="1-5">1-5 pages</option>
                        <option value="6-15">6-15 pages</option>
                        <option value="16-50">16-50 pages</option>
                        <option value="50+">50+ pages</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Known Issues Reported (optional)</Label>
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                      {KNOWN_ISSUE_OPTIONS.map((opt) => (
                        <label
                          key={opt.key}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-300 hover:border-zinc-700"
                        >
                          <Checkbox
                            checked={form.knownIssues.includes(opt.key)}
                            onCheckedChange={() => toggleIssue(opt.key)}
                            className="mt-0.5"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                    <Label className="mb-3">Scope Flags (this determines eligibility)</Label>
                    <div className="space-y-2.5">
                      {[
                        { key: 'customBackend' as const, label: 'Site requires custom backend or third-party API integrations (payments, CRM, booking systems)' },
                        { key: 'ecommerce' as const, label: 'Site is an e-commerce store with live payment processing' },
                        { key: 'handCoded' as const, label: "Site was hand-coded or heavily customized beyond the AI builder's templates" },
                        { key: 'multiLanguage' as const, label: 'Client needs multi-language / localization support' },
                      ].map((opt) => (
                        <label key={opt.key} className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-300">
                          <Checkbox
                            checked={form[opt.key]}
                            onCheckedChange={(v) => setForm({ ...form, [opt.key]: v === true })}
                            className="mt-0.5"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="agencyNotes">Agency Notes (optional)</Label>
                    <Textarea
                      id="agencyNotes"
                      placeholder="Anything your rescue engineer should know - launch deadlines, client sensitivities, etc."
                      value={form.agencyNotes}
                      onChange={(e) => setForm({ ...form, agencyNotes: e.target.value })}
                    />
                  </div>

                  <Button size="lg" className="w-full" onClick={startScan}>
                    Run Website Scan <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card>
                <CardContent className="p-8 sm:p-10">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                      <ScanSearch className="h-8 w-8 animate-pulse text-emerald-400" />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-zinc-100">Scanning website...</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Running real checks on {form.siteUrl || 'your site'} - SSL, DNS, SEO, viewport, performance, forms.
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">This usually takes 5-15 seconds.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'results' && scanResults && (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className={allIssues.length === 0 ? 'border-emerald-500/30' : 'border-amber-500/30'}>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    {allIssues.length === 0 ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-amber-400" />
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-100">Scan Complete</h2>
                      <p className="text-sm text-zinc-500">Score: {scanResults.score}/100</p>
                    </div>
                  </div>

                  <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full ${scanResults.score >= 70 ? 'bg-emerald-500' : scanResults.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${scanResults.score}%` }}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                        <Lock className="h-4 w-4 text-emerald-400" /> SSL Certificate
                      </div>
                      <div className="mt-2 text-xs text-zinc-400">
                        {scanResults.scanResult.ssl.valid ? (
                          <span className="text-emerald-400">Valid - {scanResults.scanResult.ssl.issuer} (expires in {scanResults.scanResult.ssl.daysUntilExpiry} days)</span>
                        ) : (
                          <span className="text-red-400">{scanResults.scanResult.ssl.error || 'Invalid'}</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                        <Gauge className="h-4 w-4 text-emerald-400" /> DNS Resolution
                      </div>
                      <div className="mt-2 text-xs text-zinc-400">
                        {scanResults.scanResult.dns.resolved ? (
                          <span className="text-emerald-400">Resolved - {scanResults.scanResult.dns.records?.length} A records</span>
                        ) : (
                          <span className="text-red-400">{scanResults.scanResult.dns.error || 'Failed'}</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                        <Search className="h-4 w-4 text-emerald-400" /> SEO Meta
                      </div>
                      <div className="mt-2 text-xs text-zinc-400">
                        Title: {scanResults.scanResult.seo.hasTitle ? `${scanResults.scanResult.seo.titleLength} chars` : 'Missing'} | 
                        Description: {scanResults.scanResult.seo.hasMetaDescription ? `${scanResults.scanResult.seo.metaDescriptionLength} chars` : 'Missing'} |
                        OG Tags: {scanResults.scanResult.seo.hasOgTags ? 'Yes' : 'No'}
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                        <Smartphone className="h-4 w-4 text-emerald-400" /> Mobile Viewport
                      </div>
                      <div className="mt-2 text-xs text-zinc-400">
                        {scanResults.scanResult.viewport.hasViewportMeta ? (
                          <span className="text-emerald-400">Configured: {scanResults.scanResult.viewport.content}</span>
                        ) : (
                          <span className="text-red-400">Missing viewport meta tag</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {allIssues.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <p className="text-sm font-medium text-zinc-300">Issues Found ({allIssues.length}):</p>
                      {allIssues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 text-sm text-amber-300">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {issue}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4 text-sm text-amber-200">
                      <Checkbox checked={agreeBoundary} onCheckedChange={(v) => setAgreeBoundary(v === true)} className="mt-0.5" />
                      I understand this package covers only the five fixes listed above. Any custom backend or
                      API integration work is out of scope and will be billed separately at ${CUSTOM_HOURLY_RATE}/hr,
                      quoted in writing before work begins.
                    </label>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={restart} className="sm:flex-1">
                      <ArrowLeft className="h-4 w-4" /> Start a New Audit
                    </Button>
                    <Button
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          const project = await createProject(form, useWhiteLabel, useWhiteLabel ? markupPrice : undefined);
                          navigate(`/projects/${project.id}`);
                        } catch (err: unknown) {
                          setScanError(err instanceof Error ? err.message : 'Failed to create project');
                          setSubmitting(false);
                        }
                      }}
                      disabled={!agreeBoundary || submitting}
                      className="sm:flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating Project...
                        </>
                      ) : (
                        <>
                          Create Project & Start Fixes <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

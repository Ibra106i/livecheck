import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ScanSearch,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Send,
  Smartphone,
  Search,
  Gauge,
  AlertTriangle,
  Sparkles,
  Building2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { useProjects } from '../context/ProjectsContext';
import { runPreIntakeAudit } from '../lib/audit';
import type { AuditVerdict, IntakeFormData } from '../lib/types';
import { BUILDER_TOOLS, CUSTOM_HOURLY_RATE, FIXES, KNOWN_ISSUE_OPTIONS, PACKAGE_PRICE } from '../lib/mockData';

const FIX_ICONS: Record<string, React.ElementType> = {
  ssl_dns: Lock,
  form_routing: Send,
  mobile_viewport: Smartphone,
  seo_meta: Search,
  page_speed: Gauge,
};

const SCAN_STEPS = [
  { key: 'ssl_dns', label: 'Checking SSL certificate & DNS records\u2026' },
  { key: 'form_routing', label: 'Testing form action endpoints\u2026' },
  { key: 'mobile_viewport', label: 'Rendering mobile breakpoints\u2026' },
  { key: 'seo_meta', label: 'Scanning meta tags & indexability\u2026' },
  { key: 'page_speed', label: 'Measuring page speed & asset weight\u2026' },
  { key: 'scope', label: 'Scoring project complexity against package scope\u2026' },
];

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

type Step = 'intake' | 'scanning' | 'verdict' | 'scope' | 'done';

export default function NewAudit() {
  const navigate = useNavigate();
  const { createProject, whiteLabel } = useProjects();

  const [step, setStep] = useState<Step>('intake');
  const [form, setForm] = useState<IntakeFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scanIndex, setScanIndex] = useState(0);
  const [verdict, setVerdict] = useState<AuditVerdict | null>(null);
  const [useWhiteLabel, setUseWhiteLabel] = useState(whiteLabel.enabledByDefault);
  const [markupPrice, setMarkupPrice] = useState(whiteLabel.resalePrice);
  const [agreeBoundary, setAgreeBoundary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'scanning') return;
    if (scanIndex >= SCAN_STEPS.length) {
      const v = runPreIntakeAudit(form);
      setVerdict(v);
      const t = window.setTimeout(() => setStep('verdict'), 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setScanIndex((i) => i + 1), 550);
    return () => window.clearTimeout(t);
  }, [step, scanIndex, form]);

  const toggleIssue = (key: string) => {
    setForm((f) => ({
      ...f,
      knownIssues: f.knownIssues.includes(key) ? f.knownIssues.filter((k) => k !== key) : [...f.knownIssues, key],
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

  const startScan = () => {
    if (!validateIntake()) return;
    setScanIndex(0);
    setStep('scanning');
  };

  const restart = () => {
    setForm(emptyForm);
    setVerdict(null);
    setScanIndex(0);
    setAgreeBoundary(false);
    setCreatedId(null);
    setStep('intake');
  };

  const submitScope = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      const project = createProject(form, useWhiteLabel, useWhiteLabel ? markupPrice : undefined);
      setCreatedId(project.id);
      setSubmitting(false);
      setStep('done');
    }, 1000);
  };

  const stepIndex = useMemo(() => {
    if (step === 'intake') return 0;
    if (step === 'scanning' || step === 'verdict') return 1;
    if (step === 'scope') return 2;
    return 3;
  }, [step]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">New Audit Intake</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Submit a site for the automated pre-intake audit before any human time is spent.
          </p>
        </div>

        <div className="mb-10 flex items-center gap-2">
          {['Intake', 'Automated Audit', 'Scope & Confirm', 'Done'].map((label, idx) => (
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
                          <option key={t} value={t}>
                            {t}
                          </option>
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
                        <option value="1-5">1–5 pages</option>
                        <option value="6-15">6–15 pages</option>
                        <option value="16-50">16–50 pages</option>
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
                      placeholder="Anything your rescue engineer should know — launch deadlines, client sensitivities, etc."
                      value={form.agencyNotes}
                      onChange={(e) => setForm({ ...form, agencyNotes: e.target.value })}
                    />
                  </div>

                  <Button size="lg" className="w-full" onClick={startScan}>
                    Run Automated Pre-Intake Audit <ArrowRight className="h-4 w-4" />
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
                    <h2 className="mt-5 text-lg font-semibold text-zinc-100">Running pre-intake audit\u2026</h2>
                    <p className="mt-1 text-sm text-zinc-500">Scoring {form.siteUrl || 'your site'} against package scope.</p>
                  </div>
                  <div className="mt-8 space-y-3">
                    {SCAN_STEPS.map((s, idx) => (
                      <div key={s.key} className="flex items-center gap-3 text-sm">
                        {idx < scanIndex ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : idx === scanIndex ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-400" />
                        ) : (
                          <div className="h-4 w-4 shrink-0 rounded-full border border-zinc-700" />
                        )}
                        <span className={idx <= scanIndex ? 'text-zinc-200' : 'text-zinc-600'}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'verdict' && verdict && (
            <motion.div key="verdict" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className={verdict.accepted ? 'border-emerald-500/30' : 'border-red-500/30'}>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    {verdict.accepted ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-400" />
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-100">
                        {verdict.accepted ? 'Package Approved' : 'Rejected — Requires Custom Scope'}
                      </h2>
                      <p className="text-sm text-zinc-500">Complexity score: {verdict.score}/100</p>
                    </div>
                  </div>

                  <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full ${verdict.score < 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${verdict.score}%` }}
                    />
                  </div>

                  {verdict.accepted ? (
                    <div className="mt-6 space-y-2">
                      {verdict.positives.map((p, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {p}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      <p className="text-sm font-medium text-zinc-300">This site was rejected for the fixed package because:</p>
                      {verdict.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-3 text-sm text-red-300">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {r}
                        </div>
                      ))}
                      <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4">
                        <p className="text-sm text-amber-300">
                          This qualifies for a custom scoped engagement at our hourly rate of{' '}
                          <strong>${CUSTOM_HOURLY_RATE}/hr</strong>, quoted in writing before any work begins.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={restart} className="sm:flex-1">
                      <ArrowLeft className="h-4 w-4" /> Start a New Audit
                    </Button>
                    {verdict.accepted ? (
                      <Button onClick={() => setStep('scope')} className="sm:flex-1">
                        Continue to Scope &amp; Confirm <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="sm:flex-1"
                        onClick={() => (window.location.href = `mailto:partners@livecheck.dev?subject=Custom quote request — ${form.siteUrl}`)}
                      >
                        Request Custom Quote
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'scope' && verdict && (
            <motion.div key="scope" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Confirm Scope</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {form.clientName} — {form.siteUrl}
                    </p>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">Fixed Package</span>
                      <span className="text-xl font-bold text-white">${PACKAGE_PRICE}</span>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      {FIXES.map((f) => {
                        const Icon = FIX_ICONS[f.key];
                        return (
                          <div key={f.key} className="flex items-center gap-2.5 text-sm text-zinc-300">
                            <Icon className="h-4 w-4 text-emerald-400" /> {f.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4 text-sm text-amber-200">
                    <Checkbox checked={agreeBoundary} onCheckedChange={(v) => setAgreeBoundary(v === true)} className="mt-0.5" />
                    I understand this package covers only the five fixes listed above. Any custom backend or
                    API integration work is out of scope and will be billed separately at ${CUSTOM_HOURLY_RATE}/hr,
                    quoted in writing before work begins.
                  </label>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                        <Building2 className="h-4 w-4 text-emerald-400" /> Deliver under white-label branding
                      </span>
                      <Checkbox checked={useWhiteLabel} onCheckedChange={(v) => setUseWhiteLabel(v === true)} />
                    </label>
                    {useWhiteLabel && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label>Delivered as</Label>
                          <Input value={whiteLabel.agencyName} disabled />
                        </div>
                        <div>
                          <Label htmlFor="markup">Your resale price to client</Label>
                          <Input
                            id="markup"
                            type="number"
                            min={PACKAGE_PRICE}
                            value={markupPrice}
                            onChange={(e) => setMarkupPrice(Number(e.target.value))}
                          />
                        </div>
                        <div className="sm:col-span-2 rounded-lg bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                          Your margin on this project: <strong>${Math.max(0, markupPrice - PACKAGE_PRICE)}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={() => setStep('verdict')} className="sm:flex-1">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={submitScope} disabled={!agreeBoundary || submitting} className="sm:flex-1">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting\u2026
                        </>
                      ) : (
                        <>
                          Confirm &amp; Start Audit <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'done' && createdId && (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="border-emerald-500/30">
                <CardContent className="flex flex-col items-center p-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <Sparkles className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-white">Audit submitted</h2>
                  <p className="mt-2 max-w-sm text-sm text-zinc-500">
                    Our automated patch script is now running against {form.siteUrl}. You'll see live progress
                    on the project page, with delivery typically within 24–48 hours.
                  </p>
                  <Badge className="mt-4" variant="info">Project {createdId.toUpperCase()}</Badge>
                  <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="sm:flex-1" onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                    <Button className="sm:flex-1" onClick={() => navigate(`/projects/${createdId}`)}>
                      View Live Progress <ArrowRight className="h-4 w-4" />
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

import { useState } from 'react';
import { CheckCircle2, Palette, Image as ImageIcon, Loader2, Building2, DollarSign } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { useProjects } from '../context/ProjectsContext';
import { PACKAGE_PRICE } from '../lib/mockData';
import { formatCurrency } from '../lib/utils';

const PRESET_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4'];

export default function WhiteLabel() {
  const { whiteLabel, updateWhiteLabel } = useProjects();
  const [form, setForm] = useState(whiteLabel);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const errs: Record<string, string> = {};
    if (!form.agencyName.trim()) errs.agencyName = 'Agency name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) errs.contactEmail = 'Enter a valid email.';
    if (form.resalePrice < PACKAGE_PRICE) errs.resalePrice = `Resale price must be at least $${PACKAGE_PRICE} (base cost).`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setSaved(false);
    window.setTimeout(() => {
      updateWhiteLabel(form);
      setSaving(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }, 800);
  };

  const margin = Math.max(0, form.resalePrice - PACKAGE_PRICE);
  const marginPct = form.resalePrice ? Math.round((margin / form.resalePrice) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">White-Label Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Resell Livecheck rescues under your own brand. Your clients never see our name.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div>
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                />
                {errors.agencyName && <p className="mt-1.5 text-xs text-red-400">{errors.agencyName}</p>}
              </div>

              <div>
                <Label htmlFor="contactEmail">Partner Contact Email *</Label>
                <Input
                  id="contactEmail"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
                {errors.contactEmail && <p className="mt-1.5 text-xs text-red-400">{errors.contactEmail}</p>}
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://youragency.com/logo.png"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
              </div>

              <div>
                <Label>Brand Accent Color</Label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, accentColor: c })}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${form.accentColor === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent"
                  />
                  <span className="text-xs text-zinc-500">{form.accentColor}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="resalePrice">Default Resale Price to Client</Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="resalePrice"
                    type="number"
                    min={PACKAGE_PRICE}
                    className="pl-9"
                    value={form.resalePrice}
                    onChange={(e) => setForm({ ...form, resalePrice: Number(e.target.value) })}
                  />
                </div>
                {errors.resalePrice && <p className="mt-1.5 text-xs text-red-400">{errors.resalePrice}</p>}
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                <span className="text-sm text-zinc-300">Enable white-label delivery by default on new audits</span>
                <Checkbox
                  checked={form.enabledByDefault}
                  onCheckedChange={(v) => setForm({ ...form, enabledByDefault: v === true })}
                />
              </label>

              <Button size="lg" className="w-full" onClick={save} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving\u2026
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </>
                ) : (
                  'Save Branding Settings'
                )}
              </Button>
              {saved && (
                <p className="text-center text-xs text-emerald-400">
                  Branding saved. New audits will use these settings automatically.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Palette className="h-3.5 w-3.5" /> Live Preview
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
                  <div className="p-4 text-zinc-950" style={{ backgroundColor: form.accentColor }}>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                      Service Completion Certificate
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-lg font-bold">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="logo" className="h-6 w-6 rounded object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-950/20 text-xs">
                          {form.agencyName.slice(0, 1).toUpperCase() || 'A'}
                        </div>
                      )}
                      {form.agencyName || 'Your Agency'}
                    </div>
                  </div>
                  <div className="space-y-2 bg-white p-4 text-xs text-zinc-700">
                    <div className="flex justify-between"><span className="text-zinc-400">Client</span><span className="font-medium">Sample Client Co.</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Fixes verified</span><span className="font-medium">5 / 5</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Package value</span><span className="font-medium">{formatCurrency(form.resalePrice)}</span></div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-600">This is exactly what your client sees on delivery.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Building2 className="h-3.5 w-3.5" /> Margin Calculator
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-400"><span>Base package cost</span><span className="text-zinc-200">{formatCurrency(PACKAGE_PRICE)}</span></div>
                  <div className="flex justify-between text-zinc-400"><span>Your resale price</span><span className="text-zinc-200">{formatCurrency(form.resalePrice)}</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3.5 py-2.5">
                    <span className="text-emerald-300">Margin per project</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(margin)} ({marginPct}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500">
              <ImageIcon className="mb-1.5 h-4 w-4 text-zinc-600" />
              Certificates, dashboard branding, and client-facing status pages all inherit these settings
              automatically — no per-project setup required.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

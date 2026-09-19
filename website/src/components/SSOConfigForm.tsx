import { useState, useEffect } from 'react';
import { Shield, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface SSOProvider {
  id: string;
  type: 'saml' | 'oidc';
  name: string;
  enabled: boolean;
  sso_only: boolean;
  jit_provisioning: boolean;
  domain: string;
  default_role: string;
  idp_metadata_url: string | null;
  idp_sso_url: string | null;
  oidc_issuer: string | null;
  oidc_client_id: string | null;
  oidc_scopes: string[];
}

interface VerifiedDomain {
  id: string;
  domain: string;
  verified: boolean;
}

interface Props {
  organizationId: string;
}

export default function SSOConfigForm({ organizationId }: Props) {
  const { authHeaders } = useAuth();
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [domains, setDomains] = useState<VerifiedDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New provider form
  const [formData, setFormData] = useState({
    type: 'saml' as 'saml' | 'oidc',
    name: '',
    domain: '',
    sso_only: false,
    jit_provisioning: false,
    default_role: 'member',
    // SAML
    idp_metadata_url: '',
    idp_sso_url: '',
    idp_entity_id: '',
    idp_certificate: '',
    // OIDC
    oidc_issuer: '',
    oidc_client_id: '',
    oidc_client_secret: '',
    oidc_scopes: 'openid email profile',
  });

  // Domain verification
  const [newDomain, setNewDomain] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [domainInstructions, setDomainInstructions] = useState<{
    domain: string;
    record_name: string;
    record_value: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [providersRes, domainsRes] = await Promise.all([
        fetch(`${API_BASE}/api/organizations/${organizationId}/sso-config`, {
          headers: authHeaders(),
        }),
        fetch(`${API_BASE}/api/domains`, {
          headers: authHeaders(),
        }),
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers || []);
      }

      if (domainsRes.ok) {
        const data = await domainsRes.json();
        setDomains(data.domains || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SSO config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const handleCreateProvider = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        type: formData.type,
        name: formData.name,
        domain: formData.domain,
        sso_only: formData.sso_only,
        jit_provisioning: formData.jit_provisioning,
        default_role: formData.default_role,
      };

      if (formData.type === 'saml') {
        if (formData.idp_metadata_url) payload.idp_metadata_url = formData.idp_metadata_url;
        if (formData.idp_sso_url) payload.idp_sso_url = formData.idp_sso_url;
        if (formData.idp_entity_id) payload.idp_entity_id = formData.idp_entity_id;
        if (formData.idp_certificate) payload.idp_certificate = formData.idp_certificate;
      } else {
        payload.oidc_issuer = formData.oidc_issuer;
        payload.oidc_client_id = formData.oidc_client_id;
        payload.oidc_client_secret = formData.oidc_client_secret;
        payload.oidc_scopes = formData.oidc_scopes.split(' ').filter(Boolean);
      }

      const res = await fetch(`${API_BASE}/api/organizations/${organizationId}/sso-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create SSO provider');
      }

      setSuccess('SSO provider created successfully');
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setVerifyingDomain(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add domain');
      }

      const data = await res.json();

      if (data.verified) {
        setSuccess('Domain is already verified');
        fetchData();
      } else {
        setDomainInstructions(data.instructions);
      }

      setNewDomain('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomain(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/domains`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ domain_id: domainId }),
      });

      const data = await res.json();

      if (data.verified) {
        setSuccess('Domain verified successfully');
        setDomainInstructions(null);
        fetchData();
      } else {
        setError(data.message || 'Domain not yet verified. Make sure the TXT record is propagated.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify domain');
    } finally {
      setVerifyingDomain(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Verification */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Shield className="h-3.5 w-3.5" /> Verified Domains
          </div>

          <div className="mt-4 space-y-3">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-100">{domain.domain}</span>
                  <Badge variant={domain.verified ? 'success' : 'warning'}>
                    {domain.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                {!domain.verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyDomain(domain.id)}
                    disabled={verifyingDomain}
                  >
                    {verifyingDomain ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify'}
                  </Button>
                )}
              </div>
            ))}

            {domains.length === 0 && (
              <p className="text-sm text-zinc-500">No domains configured. Add a domain to set up SSO.</p>
            )}

            <div className="flex items-end gap-3 mt-4">
              <div className="flex-1">
                <Label htmlFor="newDomain" className="text-xs text-zinc-400">Add Domain</Label>
                <Input
                  id="newDomain"
                  type="text"
                  placeholder="company.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddDomain} disabled={verifyingDomain || !newDomain.trim()}>
                {verifyingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>

            {domainInstructions && (
              <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-sm">
                <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Add this DNS record to verify your domain:
                </div>
                <div className="space-y-1 font-mono text-xs text-zinc-300">
                  <div><span className="text-zinc-500">Type:</span> TXT</div>
                  <div><span className="text-zinc-500">Name:</span> {domainInstructions.record_name}</div>
                  <div><span className="text-zinc-500">Value:</span> {domainInstructions.record_value}</div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  DNS propagation may take a few minutes. Click "Verify" on the domain after adding the record.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SSO Providers */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Shield className="h-3.5 w-3.5" /> SSO Configuration
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} size="sm">
                Add SSO Provider
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
              {success}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {providers.map((provider) => (
              <div key={provider.id} className="rounded-lg border border-border bg-bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-100">{provider.name}</span>
                      <Badge variant={provider.type === 'saml' ? 'info' : 'secondary'}>
                        {provider.type.toUpperCase()}
                      </Badge>
                      <Badge variant={provider.enabled ? 'success' : 'secondary'}>
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Domain: {provider.domain} | Role: {provider.default_role}
                      {provider.sso_only && ' | SSO Only'}
                      {provider.jit_provisioning && ' | JIT Provisioning'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {providers.length === 0 && !showForm && (
              <p className="text-sm text-zinc-500">No SSO providers configured.</p>
            )}
          </div>

          {/* New Provider Form */}
          {showForm && (
            <div className="mt-6 rounded-lg border border-border bg-bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-zinc-100">New SSO Provider</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ssoName" className="text-xs text-zinc-400">Name</Label>
                  <Input
                    id="ssoName"
                    placeholder="Okta SSO"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ssoType" className="text-xs text-zinc-400">Type</Label>
                  <select
                    id="ssoType"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'saml' | 'oidc' })}
                    className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-border bg-bg-card px-3 text-sm text-fg"
                  >
                    <option value="saml">SAML 2.0</option>
                    <option value="oidc">OpenID Connect</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="ssoDomain" className="text-xs text-zinc-400">Domain</Label>
                  <select
                    id="ssoDomain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-border bg-bg-card px-3 text-sm text-fg"
                  >
                    <option value="">Select a verified domain</option>
                    {domains.filter(d => d.verified).map(d => (
                      <option key={d.id} value={d.domain}>{d.domain}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="ssoRole" className="text-xs text-zinc-400">Default Role</Label>
                  <select
                    id="ssoRole"
                    value={formData.default_role}
                    onChange={(e) => setFormData({ ...formData, default_role: e.target.value })}
                    className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-border bg-bg-card px-3 text-sm text-fg"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.sso_only}
                    onChange={(e) => setFormData({ ...formData, sso_only: e.target.checked })}
                    className="rounded border-zinc-600"
                  />
                  SSO Only (disable password login)
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.jit_provisioning}
                    onChange={(e) => setFormData({ ...formData, jit_provisioning: e.target.checked })}
                    className="rounded border-zinc-600"
                  />
                  JIT Provisioning
                </label>
              </div>

              {formData.type === 'saml' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="samlMetadata" className="text-xs text-zinc-400">
                      IdP Metadata URL <span className="text-zinc-600">(auto-fills fields below)</span>
                    </Label>
                    <Input
                      id="samlMetadata"
                      placeholder="https://your-idp.com/metadata.xml"
                      value={formData.idp_metadata_url}
                      onChange={(e) => setFormData({ ...formData, idp_metadata_url: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="samlSsoUrl" className="text-xs text-zinc-400">IdP SSO URL</Label>
                      <Input
                        id="samlSsoUrl"
                        placeholder="https://your-idp.com/sso/saml"
                        value={formData.idp_sso_url}
                        onChange={(e) => setFormData({ ...formData, idp_sso_url: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="samlEntityId" className="text-xs text-zinc-400">IdP Entity ID</Label>
                      <Input
                        id="samlEntityId"
                        placeholder="https://your-idp.com/entity-id"
                        value={formData.idp_entity_id}
                        onChange={(e) => setFormData({ ...formData, idp_entity_id: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="samlCert" className="text-xs text-zinc-400">IdP Certificate</Label>
                    <textarea
                      id="samlCert"
                      placeholder="-----BEGIN CERTIFICATE-----..."
                      value={formData.idp_certificate}
                      onChange={(e) => setFormData({ ...formData, idp_certificate: e.target.value })}
                      className="mt-1 flex min-h-[80px] w-full rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-subtle"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-bg-elevated p-3 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-300 mb-1">SP Configuration</p>
                    <p>ACS URL: <code className="text-emerald-400">{window.location.origin}/api/auth/sso/callback</code></p>
                    <p>Entity ID: <code className="text-emerald-400">{window.location.origin}</code></p>
                    <a href="/api/auth/sso/metadata" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-emerald-400 hover:underline">
                      SP Metadata XML <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="oidcIssuer" className="text-xs text-zinc-400">Issuer URL</Label>
                    <Input
                      id="oidcIssuer"
                      placeholder="https://your-idp.com/.well-known/openid-configuration"
                      value={formData.oidc_issuer}
                      onChange={(e) => setFormData({ ...formData, oidc_issuer: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="oidcClientId" className="text-xs text-zinc-400">Client ID</Label>
                      <Input
                        id="oidcClientId"
                        placeholder="your-client-id"
                        value={formData.oidc_client_id}
                        onChange={(e) => setFormData({ ...formData, oidc_client_id: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="oidcSecret" className="text-xs text-zinc-400">Client Secret</Label>
                      <Input
                        id="oidcSecret"
                        type="password"
                        placeholder="your-client-secret"
                        value={formData.oidc_client_secret}
                        onChange={(e) => setFormData({ ...formData, oidc_client_secret: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="oidcScopes" className="text-xs text-zinc-400">Scopes (space-separated)</Label>
                    <Input
                      id="oidcScopes"
                      placeholder="openid email profile"
                      value={formData.oidc_scopes}
                      onChange={(e) => setFormData({ ...formData, oidc_scopes: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-bg-elevated p-3 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-300 mb-1">Callback URL</p>
                    <p><code className="text-emerald-400">{window.location.origin}/api/auth/sso/callback</code></p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreateProvider} disabled={saving || !formData.name || !formData.domain}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Provider'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

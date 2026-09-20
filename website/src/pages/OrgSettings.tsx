import { useState, useEffect } from 'react';
import { Building2, Users, Trash2, UserPlus, Loader2, CheckCircle2, Shield, Mail, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Member {
  membership_id: string;
  user_id: string;
  email: string;
  agency_name: string | null;
  role: string;
  joined_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

type Tab = 'members' | 'invitations';

export default function OrgSettings() {
  const { organization, authHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('member');
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!organization) return;
    try {
      const res = await fetch(`${API_BASE}/api/organizations/${organization.id}/members`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!organization) return;
    try {
      const res = await fetch(`${API_BASE}/api/invitations`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch invitations');
      const data = await res.json();
      setInvitations(data.invitations);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [organization?.id]);

  const handleAddMember = async () => {
    if (!addEmail.trim() || !organization) return;
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/api/organizations/${organization.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }

      setSuccess('Member added successfully');
      setAddEmail('');
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleInviteMember = async () => {
    if (!addEmail.trim() || !organization) return;
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/api/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      const data = await res.json();
      setSuccess(`Invitation sent to ${addEmail.trim()}. Share this link: ${data.invitation.invite_url}`);
      setAddEmail('');
      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!organization) return;
    setRemoving(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/api/organizations/${organization.id}/members?user_id=${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      setSuccess('Member removed');
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!organization) return;
    try {
      const res = await fetch(`${API_BASE}/api/invitations?id=${invitationId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error('Failed to revoke invitation');
      setSuccess('Invitation revoked');
      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!organization) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Organization Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your organization, team members, and invitations.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mail className="h-4 w-4" />
            Invitations
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'members' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Building2 className="h-3.5 w-3.5" /> Organization Info
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label className="text-xs text-zinc-400">Name</Label>
                      <div className="mt-1 text-sm font-medium text-zinc-100">{organization.name}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Slug</Label>
                      <div className="mt-1 font-mono text-sm text-zinc-300">{organization.slug}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Your Role</Label>
                      <div className="mt-1">
                        <Badge variant={organization.role === 'owner' ? 'default' : 'secondary'}>
                          <Shield className="h-3 w-3" />
                          {organization.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Users className="h-3.5 w-3.5" /> Team Members
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

                  <div className="mt-4 flex items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor="addEmail" className="text-xs text-zinc-400">Email</Label>
                      <Input
                        id="addEmail"
                        type="email"
                        placeholder="colleague@company.com"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor="addRole" className="text-xs text-zinc-400">Role</Label>
                      <select
                        id="addRole"
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button onClick={handleAddMember} disabled={adding || !addEmail.trim()} size="default">
                      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Add
                    </Button>
                  </div>

                  <div className="mt-6 space-y-2">
                    {loading ? (
                      <div className="py-8 text-center text-sm text-zinc-500">Loading members...</div>
                    ) : members.length === 0 ? (
                      <div className="py-8 text-center text-sm text-zinc-500">No members found.</div>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.membership_id}
                          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                              {member.email?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-100">{member.email}</div>
                              <div className="text-xs text-zinc-500">{member.agency_name || 'No agency name'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                            {member.role !== 'owner' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.user_id)}
                                disabled={removing === member.user_id}
                                className="text-zinc-500 hover:text-red-400"
                              >
                                {removing === member.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'invitations' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Mail className="h-3.5 w-3.5" /> Pending Invitations
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

                <div className="mt-4 flex items-end gap-3">
                  <div className="flex-1">
                    <Label htmlFor="inviteEmail" className="text-xs text-zinc-400">Email</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="colleague@company.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor="inviteRole" className="text-xs text-zinc-400">Role</Label>
                    <select
                      id="inviteRole"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button onClick={handleInviteMember} disabled={inviting || !addEmail.trim()} size="default">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Invite
                  </Button>
                </div>

                <div className="mt-6 space-y-2">
                  {invitations.length === 0 ? (
                    <div className="py-8 text-center text-sm text-zinc-500">No pending invitations</div>
                  ) : (
                    invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                            {inv.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-zinc-100">{inv.email}</div>
                            <div className="text-xs text-zinc-500">
                              Expires {new Date(inv.expires_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{inv.role}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteLink(inv.id)}
                            className="text-zinc-500 hover:text-emerald-400"
                          >
                            {copiedId === inv.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

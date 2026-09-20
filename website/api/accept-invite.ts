import { supabase, corsHeaders, jsonError } from '../_clerk.js';
import { verifyClerkToken } from '../_clerk.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  const auth = await verifyClerkToken(req);
  if (!auth) {
    return jsonError('Unauthorized', 401, headers);
  }

  const url = new URL(req.url);
  const token = url.pathname.split('/').pop();

  if (!token) {
    return jsonError('Invitation token is required', 400, headers);
  }

  try {
    // Find invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .single();

    if (inviteError || !invitation) {
      return jsonError('Invalid or expired invitation', 404, headers);
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      return jsonError('Invitation has expired', 410, headers);
    }

    // Find user by clerk_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', auth.userId)
      .single();

    if (!user) {
      return jsonError('User not found in system', 404, headers);
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', invitation.organization_id)
      .single();

    if (existing) {
      // Mark invitation as accepted anyway
      await supabase
        .from('invitations')
        .update({ accepted: true })
        .eq('id', invitation.id);

      return new Response(JSON.stringify({
        message: 'Already a member of this organization',
        organization_id: invitation.organization_id,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // Add membership
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({
        user_id: user.id,
        organization_id: invitation.organization_id,
        role: invitation.role,
      });

    if (memberError) throw memberError;

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted: true })
      .eq('id', invitation.id);

    // Audit log
    await supabase.from('audit_logs').insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      action: 'member.invitation_accepted',
      metadata: { invitation_id: invitation.id, role: invitation.role },
    });

    // Get org info
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', invitation.organization_id)
      .single();

    return new Response(JSON.stringify({
      message: 'Invitation accepted',
      organization: org,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Accept invitation error:', err);
    return jsonError(message, 500, headers);
  }
}

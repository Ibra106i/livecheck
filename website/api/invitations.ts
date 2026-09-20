import { supabase, corsHeaders, jsonError, requirePermission } from './_clerk.js';
import { getTenantContext } from './_tenant.js';

export default async function handler(req: Request): Promise<Response> {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!supabase) {
    return jsonError('Database not configured', 503, headers);
  }

  const tenant = await getTenantContext(req);
  if (!tenant) {
    return jsonError('Unauthorized', 401, headers);
  }

  try {
    // GET /api/invitations — list pending invitations for org
    if (req.method === 'GET') {
      if (!requirePermission(tenant, 'members:read')) {
        return jsonError('Permission denied', 403, headers);
      }

      const { data: invitations, error } = await supabase
        .from('invitations')
        .select('id, email, role, accepted, expires_at, created_at, invited_by')
        .eq('organization_id', tenant.orgId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ invitations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // POST /api/invitations — send invitation
    if (req.method === 'POST') {
      if (!requirePermission(tenant, 'members:manage')) {
        return jsonError('Permission denied', 403, headers);
      }

      const body = await req.json();
      const { email, role } = body;

      if (!email || typeof email !== 'string') {
        return jsonError('Email is required', 400, headers);
      }

      const validRole = role || 'member';
      if (!['admin', 'member'].includes(validRole)) {
        return jsonError('Role must be "admin" or "member"', 400, headers);
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        // Check if already a member
        const { data: existingMember } = await supabase
          .from('memberships')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('organization_id', tenant.orgId)
          .single();

        if (existingMember) {
          return jsonError('User is already a member of this organization', 409, headers);
        }
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabase
        .from('invitations')
        .select('id')
        .eq('organization_id', tenant.orgId)
        .eq('email', normalizedEmail)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingInvite) {
        return jsonError('Invitation already pending for this email', 409, headers);
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          organization_id: tenant.orgId,
          email: normalizedEmail,
          role: validRole,
          invited_by: tenant.userId,
        })
        .select('id, token, email, role, expires_at')
        .single();

      if (inviteError) throw inviteError;

      // Audit log
      await supabase.from('audit_logs').insert({
        organization_id: tenant.orgId,
        user_id: tenant.userId,
        action: 'member.invited',
        metadata: { email: normalizedEmail, role: validRole, invitation_id: invitation.id },
      });

      // TODO: Send invitation email via Resend/SendGrid
      // For now, return the token so it can be shared manually
      return new Response(JSON.stringify({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
          invite_url: `${process.env.SITE_ORIGIN || 'https://livechecks.vercel.app'}/invite/${invitation.token}`,
        },
        message: 'Invitation created',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // DELETE /api/invitations/:id — revoke invitation
    if (req.method === 'DELETE') {
      if (!requirePermission(tenant, 'members:manage')) {
        return jsonError('Permission denied', 403, headers);
      }

      const url = new URL(req.url);
      const invitationId = url.searchParams.get('id');

      if (!invitationId) {
        return jsonError('Invitation id is required', 400, headers);
      }

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', tenant.orgId);

      if (error) throw error;

      return new Response(JSON.stringify({ message: 'Invitation revoked' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Invitations API error:', err);
    return jsonError(message, 500, headers);
  }
}

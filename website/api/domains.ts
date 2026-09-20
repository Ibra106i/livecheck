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
    // GET — list domains for org
    if (req.method === 'GET') {
      const { data: domains, error } = await supabase
        .from('domain_verifications')
        .select('id, domain, verified, verified_at, created_at')
        .eq('organization_id', tenant.orgId);

      if (error) throw error;

      return new Response(JSON.stringify({ domains }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // POST — initiate domain verification
    if (req.method === 'POST') {
      if (!requirePermission(tenant, 'settings:manage')) {
        return jsonError('Permission denied', 403, headers);
      }

      const body = await req.json();
      const { domain } = body;

      if (!domain || typeof domain !== 'string') {
        return jsonError('Domain is required', 400, headers);
      }

      const normalizedDomain = domain.toLowerCase().trim();

      // Validate domain format
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(normalizedDomain)) {
        return jsonError('Invalid domain format', 400, headers);
      }

      // Check if already verified by another org
      const { data: existing } = await supabase
        .from('domain_verifications')
        .select('organization_id, verified')
        .eq('domain', normalizedDomain)
        .eq('verified', true)
        .single();

      if (existing && existing.organization_id !== tenant.orgId) {
        return jsonError('Domain is already verified by another organization', 409, headers);
      }

      // Upsert verification record
      const { data: verification, error: upsertError } = await supabase
        .from('domain_verifications')
        .upsert({
          organization_id: tenant.orgId,
          domain: normalizedDomain,
        }, { onConflict: 'organization_id,domain' })
        .select('id, domain, verification_token, verified')
        .single();

      if (upsertError) throw upsertError;

      // Audit log
      await supabase.from('audit_logs').insert({
        organization_id: tenant.orgId,
        user_id: tenant.userId,
        action: 'domain.verification_initiated',
        metadata: { domain: normalizedDomain },
      });

      return new Response(JSON.stringify({
        domain: verification.domain,
        verification_token: verification.verification_token,
        verified: verification.verified,
        instructions: {
          record_type: 'TXT',
          record_name: `_livecheck-verify.${normalizedDomain}`,
          record_value: verification.verification_token,
          description: 'Add this TXT record to your DNS. Verification happens automatically when you click "Verify".',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // PUT — verify domain (check DNS)
    if (req.method === 'PUT') {
      if (!requirePermission(tenant, 'settings:manage')) {
        return jsonError('Permission denied', 403, headers);
      }

      const body = await req.json();
      const { domain_id } = body;

      if (!domain_id) {
        return jsonError('domain_id is required', 400, headers);
      }

      // Get verification record
      const { data: verification, error: fetchError } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('id', domain_id)
        .eq('organization_id', tenant.orgId)
        .single();

      if (fetchError || !verification) {
        return jsonError('Domain verification not found', 404, headers);
      }

      if (verification.verified) {
        return new Response(JSON.stringify({
          domain: verification.domain,
          verified: true,
          message: 'Domain is already verified',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...headers },
        });
      }

      // DNS TXT record verification
      const txtRecordName = `_livecheck-verify.${verification.domain}`;
      try {
        const { promises: dns } = await import('node:dns');
        const records = await dns.resolveTxt(txtRecordName);
        const flatRecords = records.map(r => r.join(''));

        if (flatRecords.includes(verification.verification_token)) {
          // Mark as verified
          await supabase
            .from('domain_verifications')
            .update({
              verified: true,
              verified_at: new Date().toISOString(),
            })
            .eq('id', domain_id);

          // Audit log
          await supabase.from('audit_logs').insert({
            organization_id: tenant.orgId,
            user_id: tenant.userId,
            action: 'domain.verified',
            metadata: { domain: verification.domain },
          });

          return new Response(JSON.stringify({
            domain: verification.domain,
            verified: true,
            message: 'Domain verified successfully',
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...headers },
          });
        }
      } catch {
        // DNS lookup failed — domain not verified
      }

      return new Response(JSON.stringify({
        domain: verification.domain,
        verified: false,
        message: 'TXT record not found. Make sure the DNS record is propagated and try again.',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // DELETE — remove domain
    if (req.method === 'DELETE') {
      if (!requirePermission(tenant, 'settings:manage')) {
        return jsonError('Permission denied', 403, headers);
      }

      const url = new URL(req.url);
      const domainId = url.searchParams.get('domain_id');

      if (!domainId) {
        return jsonError('domain_id is required', 400, headers);
      }

      const { error } = await supabase
        .from('domain_verifications')
        .delete()
        .eq('id', domainId)
        .eq('organization_id', tenant.orgId);

      if (error) throw error;

      return new Response(JSON.stringify({ message: 'Domain removed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    return jsonError('Method not allowed', 405, headers);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Domains API error:', err);
    return jsonError(message, 500, headers);
  }
}

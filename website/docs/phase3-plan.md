# Phase 3 — Clerk Auth Migration + Email Invitations + Audit Logs

## Context
Phase 1 (multi-tenant) and Phase 2 (Enterprise SSO) are complete and deployed. The current auth system is fully custom (JWT + bcrypt + Supabase). We're replacing it with Clerk to get social login (Google, Apple, Microsoft), MFA, and session management out of the box. We're also adding email invitations and an audit log viewer for SOC 2 readiness.

## Architecture

### What changes
- **Auth provider**: Custom JWT/bcrypt → Clerk (handles email/password, social login, MFA, sessions)
- **Frontend auth**: Custom AuthContext → Clerk React SDK (`@clerk/react`)
- **Backend auth**: Custom JWT verification → Clerk SDK (`@clerk/clerk-sdk-node`)
- **User IDs**: UUID (Supabase) → Clerk user ID (string like `user_2abc...`)

### What stays
- **Supabase**: organizations, memberships, roles, projects, scans, reports, audit_logs
- **All existing API logic**: org CRUD, projects, scans, reports, domain verification
- **SSO config tables**: sso_providers, domain_verifications (for enterprise SAML/OIDC)

### What gets removed
- `users.password_hash` (Clerk handles passwords)
- `users.mfa_enabled`, `users.mfa_methods` (Clerk handles MFA)
- `users.sso_provider`, `users.password_hash_optional` (Clerk/enterprise SSO)
- `user_identities` table (Clerk manages identity links)
- `sso_providers` table (enterprise SSO handled by Clerk or kept for backward compat)
- `api/_auth.ts` custom JWT sign/verify (replaced by Clerk SDK)
- `api/_sso.ts` (Clerk handles SSO)
- `api/auth/sso.ts`, `api/auth/sso-callback.ts` (Clerk handles SSO callbacks)
- `src/pages/Login.tsx`, `src/pages/Signup.tsx` (replaced by Clerk components)
- `src/pages/SSOCallback.tsx` (Clerk handles callbacks)
- `src/components/SSOConfigForm.tsx` (Clerk dashboard handles SSO config)
- `src/context/AuthContext.tsx` (replaced by Clerk hooks)

### New files
- `api/_clerk.ts` — Clerk SDK helper (verifyRequest, getUser, syncUserToSupabase)
- `src/main.tsx` — Updated with ClerkProvider wrapper
- `src/pages/ClerkLogin.tsx` — Wrapper around Clerk SignIn
- `src/pages/ClerkSignup.tsx` — Wrapper around Clerk SignUp
- `src/components/InviteMemberModal.tsx` — Email invitation form
- `src/pages/AuditLog.tsx` — Audit log viewer
- `api/invitations.ts` — Invitation CRUD API
- `api/audit-logs.ts` — Audit logs API (list, filter, export)
- `api/webhooks/clerk.ts` — Clerk webhook handler (user.created, user.updated, session.created)

---

## Step 1 — Install Clerk SDKs

```bash
npm install @clerk/react @clerk/clerk-sdk-node
npm install -D @clerk/types
```

Remove unused packages:
```bash
npm uninstall bcryptjs @types/bcryptjs jose @node-saml/node-saml
```

**Files**: `package.json`

---

## Step 2 — Database Migration

Add `clerk_id` column to users, add invitations table, clean up SSO tables.

```sql
-- Add clerk_id to users
ALTER TABLE users ADD COLUMN clerk_id TEXT UNIQUE;

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  accepted BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- Add invite-specific audit actions
-- (audit_logs table already exists, just need to log 'member.invited', 'member.invitation_accepted')

-- Optional: Drop SSO tables if fully migrating to Clerk
-- DROP TABLE IF EXISTS user_identities;
-- DROP TABLE IF EXISTS sso_providers;
-- DROP TABLE IF EXISTS domain_verifications;
```

**Files**: `website/supabase/migrations/20260920_phase3_clerk.sql`

---

## Step 3 — Clerk Environment Variables

Add to Vercel:
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (frontend)
- `CLERK_SECRET_KEY` — Clerk secret key (backend)
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret
- `CLERK_JWT_KEY` — Clerk JWT verification key (optional, for custom JWT template)

Remove from Vercel:
- `JWT_SECRET` (no longer needed)
- `SSO_ENCRYPTION_KEY` (no longer needed)

**Files**: `vercel.json`, `.env.local.example`

---

## Step 4 — Clerk Provider Setup (Frontend)

Wrap app in `ClerkProvider` at the entry point.

```tsx
// src/main.tsx
import { ClerkProvider } from "@clerk/react";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
```

Update `App.tsx`:
- Remove `<AuthProvider>` wrapper (Clerk replaces it)
- Replace `/login` route with Clerk `<SignIn />` component
- Replace `/signup` route with Clerk `<SignUp />` component
- Remove `/sso-callback` route (Clerk handles it)
- Keep `<ProjectsProvider>` for app-specific state

**Files**: `src/main.tsx`, `src/App.tsx`

---

## Step 5 — Login & Signup Pages

Replace custom Login/Signup with Clerk components styled to match the app's dark theme.

```tsx
// src/pages/ClerkLogin.tsx
import { SignIn } from "@clerk/react";
import { dark } from "@clerk/themes";

export default function ClerkLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignIn
        appearance={{ baseTheme: dark }}
        routing="path"
        path="/login"
        signUpUrl="/signup"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
```

Same pattern for Signup with `<SignUp />`.

**Files**: `src/pages/ClerkLogin.tsx`, `src/pages/ClerkSignup.tsx`

---

## Step 6 — Backend Auth Middleware

Replace custom JWT verification with Clerk SDK.

```typescript
// api/_clerk.ts
import { clerkClient, verifyToken } from "@clerk/clerk-sdk-node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function verifyClerkToken(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return { userId: verified.sub };
  } catch {
    return null;
  }
}

export async function getTenantContext(req: Request) {
  const auth = await verifyClerkToken(req);
  if (!auth) return null;

  const orgId = req.headers.get("x-org-id");
  if (!orgId) return null;

  // Verify membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, permissions")
    .eq("user_id", auth.userId)
    .eq("organization_id", orgId)
    .single();

  if (!membership) return null;

  return {
    userId: auth.userId,
    orgId,
    role: membership.role,
    permissions: membership.permissions,
  };
}
```

Update all API handlers to use `getTenantContext` from `_clerk.ts` instead of `_tenant.ts`.

**Files**: `api/_clerk.ts`, `api/_tenant.ts` (updated), all API handlers

---

## Step 7 — User Sync (Webhook)

Handle Clerk webhooks to keep Supabase users in sync.

```typescript
// api/webhooks/clerk.ts
export default async function handler(req: Request) {
  // Verify webhook signature
  // Handle events: user.created, user.updated, user.deleted, session.created
  // On user.created: INSERT INTO users (id, email, clerk_id) VALUES (..., ..., ...)
  // On session.created: UPDATE users SET last_login_at = now() WHERE clerk_id = ...
}
```

**Files**: `api/webhooks/clerk.ts`

---

## Step 8 — Org Switching with Clerk

When a user switches organizations, we need to update their session metadata so the Clerk JWT includes the active org context.

Option A: Use Clerk's `orgId` claim (Clerk supports multi-organization natively)
Option B: Use custom JWT claims in a session token

**Recommendation**: Use Clerk's native organization support. Clerk has built-in `OrganizationSwitcher` component and `orgId` claim.

However, our existing app uses a custom org model (not Clerk's). Two paths:
1. Migrate to Clerk organizations (cleaner but bigger refactor)
2. Keep our org model, store active org in a custom session claim

**Decision**: Keep our org model, store active org ID in user public metadata or a custom session claim. This avoids migrating all org data to Clerk.

```typescript
// When switching org, update Clerk user metadata
await clerkClient.users.updateUser(userId, {
  publicMetadata: { activeOrgId: orgId }
});
```

**Files**: `api/_clerk.ts`, `api/organizations.ts`

---

## Step 9 — Email Invitations

### Backend API
```typescript
// api/invitations.ts
// POST /api/invitations — send invitation email
// GET /api/invitations?org_id=... — list pending invitations
// DELETE /api/invitations/:id — revoke invitation
// POST /api/invitations/accept?token=... — accept invitation
```

Flow:
1. Org admin calls POST with email + role
2. System creates invitation record with token
3. System sends email via Resend/SendGrid (or Clerk's email)
4. Invitee clicks link → `/invite/:token` page
5. If not signed up → redirect to Clerk signup, then accept
6. If signed in → accept invitation, create membership

### Frontend
- Add `InviteMemberModal` component to OrgSettings
- Add `/invite/:token` route for acceptance flow

**Files**: `api/invitations.ts`, `src/components/InviteMemberModal.tsx`, `src/pages/AcceptInvite.tsx`

---

## Step 10 — Audit Log Viewer

### Backend API
```typescript
// api/audit-logs.ts
// GET /api/audit-logs?org_id=...&action=...&from=...&to=...&page=1
// Returns: { logs: [...], total: number, page: number }
```

### Frontend
- New page: `/settings/audit` or `/audit-logs`
- Table with columns: Timestamp, User, Action, Resource, IP Address
- Filters: action type, date range, user
- Pagination
- Export to CSV button

**Files**: `api/audit-logs.ts`, `src/pages/AuditLog.tsx`

---

## Step 11 — Remove Old Auth Code

Clean up:
- Delete `api/_auth.ts` (custom JWT)
- Delete `api/auth/sso.ts` (Clerk handles SSO)
- Delete `api/auth/sso-callback.ts`
- Delete `src/pages/SSOCallback.tsx`
- Delete `src/components/SSOConfigForm.tsx`
- Update `src/context/AuthContext.tsx` → replace with Clerk hooks wrapper
- Remove `bcryptjs`, `jose`, `@node-saml/node-saml` from package.json

**Files**: Multiple deletions

---

## Step 12 — Deploy & Verify

1. Create Clerk account at dashboard.clerk.com
2. Create new application
3. Enable Google, Apple, Microsoft social providers
4. Get API keys (publishable key, secret key, webhook secret)
5. Set environment variables in Vercel
6. Run database migration
7. Deploy to Vercel
8. Test: signup with Google, login, org switch, invite member, audit logs

**Files**: Clerk dashboard (manual), `vercel.json`, database migration

---

## Verification

1. **Auth flow**: Sign up with Google → auto-creates user in Clerk + Supabase
2. **Email/password**: Sign up with email → creates account → can login
3. **Social login**: Click "Sign in with Google" → redirected → authenticated
4. **Org switching**: Switch org → JWT includes new org context
5. **Invitations**: Invite member by email → they receive email → accept → added to org
6. **Audit logs**: Perform actions → logs appear in audit viewer
7. **Existing users**: Users with `clerk_id = NULL` can still login (migration flow)
8. **Build passes**: `npm run build` succeeds
9. **Deploy**: Vercel deployment succeeds with no errors

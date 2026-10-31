-- Phase 0 identity fix: Clerk-managed users have no local password.
-- The Clerk webhook (user.created) inserts into users without password_hash,
-- which failed against the original NOT NULL constraint, so no local user row
-- was ever created and every tenant-scoped request 401'd.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

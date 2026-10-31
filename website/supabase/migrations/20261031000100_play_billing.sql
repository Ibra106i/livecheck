-- Phase 1 billing spine: Play Billing, credits, scheduling, monitoring and
-- expert-review data model (plan section 5).
--
-- v1 keeps the existing organizations/memberships/users model and attaches
-- credits to the organization so team pooling needs no later migration.
-- All new tables are service-role only (no anon RLS access).

-- ============================================================
-- Products & purchases
-- ============================================================

CREATE TABLE IF NOT EXISTS play_products (
  product_id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('consumable','subscription')),
  credits INTEGER NOT NULL DEFAULT 0,
  plan TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS play_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_token TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL REFERENCES play_products(product_id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  obfuscated_account_id TEXT,
  order_id TEXT,
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','verified','consumed','acknowledged','refunded','revoked')),
  purchased_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Credits (append-only ledger, org-scoped)
-- ============================================================

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN ('purchase','scan_reserve','scan_consume','scan_refund','review_consume','admin_grant','refund_revoke')),
  scan_job_id UUID,
  purchase_id UUID REFERENCES play_purchases(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_purchase_once
  ON credit_ledger(purchase_id, reason) WHERE purchase_id IS NOT NULL;

-- ============================================================
-- Subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  purchase_token TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','grace','on_hold','paused','canceled','expired')),
  current_period_end TIMESTAMPTZ,
  auto_renew BOOLEAN,
  raw JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Sites, scan jobs & schedules
-- ============================================================

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, url)
);

CREATE TABLE IF NOT EXISTS scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  site_id UUID REFERENCES sites(id),
  url TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('manual','scheduled','review')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','done','failed','canceled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  credit_reservation_id UUID REFERENCES credit_ledger(id),
  score INTEGER,
  result JSONB,
  error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_queue ON scan_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_org ON scan_jobs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS scan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly')),
  next_run_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_scan_schedules_due ON scan_schedules(active, next_run_at);

-- ============================================================
-- Expert review
-- ============================================================

CREATE TABLE IF NOT EXISTS review_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  site_url TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('standard','priority')),
  purchase_id UUID REFERENCES play_purchases(id),
  scan_job_id UUID REFERENCES scan_jobs(id),
  status TEXT NOT NULL DEFAULT 'awaiting_scan'
    CHECK (status IN ('awaiting_scan','queued','in_review','delivered','canceled')),
  deadline_at TIMESTAMPTZ NOT NULL,
  assigned_to UUID REFERENCES users(id),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_bookings_status ON review_bookings(status, deadline_at);

CREATE TABLE IF NOT EXISTS review_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES review_bookings(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  note TEXT NOT NULL,
  fix_guidance TEXT
);

-- ============================================================
-- Devices & drift
-- ============================================================

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  previous_score INTEGER,
  current_score INTEGER,
  new_failures JSONB,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotency key for replayed RTDN notifications (plan section 6).
CREATE TABLE IF NOT EXISTS play_events (
  message_id TEXT PRIMARY KEY,
  type TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Extend existing reports with tenancy + delivery metadata
-- ============================================================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS scan_job_id UUID REFERENCES scan_jobs(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private','org','public'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS pdf_path TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(organization_id, created_at DESC);

-- ============================================================
-- Row Level Security: service-role only
-- ============================================================

ALTER TABLE play_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON play_products FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON play_purchases FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON credit_ledger FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON sites FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON scan_jobs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON scan_schedules FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON review_bookings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON review_annotations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON device_tokens FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON drift_events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON play_events FOR ALL TO service_role USING (true);

-- ============================================================
-- Seed the product catalog (plan section 2).
-- Product IDs must match the immutable IDs created in Play Console.
-- ============================================================

INSERT INTO play_products (product_id, type, credits, plan) VALUES
  ('scan_credit_1',    'consumable',   1,  NULL),
  ('scan_credit_5',    'consumable',   5,  NULL),
  ('scan_credit_20',   'consumable',   20, NULL),
  ('review_standard',  'consumable',   0,  'review'),
  ('review_priority',  'consumable',   0,  'review'),
  ('monitor_5_weekly', 'subscription', 0,  'monitor_5_weekly'),
  ('monitor_25_daily', 'subscription', 0,  'monitor_25_daily')
ON CONFLICT (product_id) DO NOTHING;

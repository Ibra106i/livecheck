-- Livecheck Database Schema
-- Run this in Supabase SQL Editor

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  site_url TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  builder_tool TEXT DEFAULT 'Unknown',
  agency_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'auto_patching', 'in_review', 'delivered', 'rejected')),
  complexity_score INTEGER DEFAULT 0,
  scan_result JSONB,
  fixes JSONB DEFAULT '[]'::jsonb,
  patch_log JSONB DEFAULT '[]'::jsonb,
  white_label BOOLEAN DEFAULT false,
  markup_price INTEGER,
  rejection_reasons TEXT[],
  custom_work_flag BOOLEAN DEFAULT false,
  hours_saved INTEGER DEFAULT 0,
  turnaround_hours INTEGER DEFAULT 0,
  known_issues TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reports table (shared reports)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  score INTEGER NOT NULL,
  summary TEXT NOT NULL,
  results JSONB NOT NULL,
  ai_analysis TEXT,
  generated_by TEXT DEFAULT 'cli',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scan results table (individual scans)
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  result JSONB NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users table (for auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  agency_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_token ON reports(token);
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies (only service_role can do anything — anon/authenticated get zero access)
CREATE POLICY "Service role full access" ON projects FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON reports FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON scans FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);

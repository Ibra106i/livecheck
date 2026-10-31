-- Worker + scheduling database functions (plan sections 5, 7, 8).

-- Claim one queued job for processing with SKIP LOCKED so multiple workers
-- never take the same job; stamps it running and bumps the attempt counter.
CREATE OR REPLACE FUNCTION claim_scan_job()
RETURNS SETOF scan_jobs
LANGUAGE plpgsql
AS $$
DECLARE
  j scan_jobs;
BEGIN
  SELECT * INTO j
    FROM scan_jobs
   WHERE status = 'queued' AND scheduled_for <= now()
   ORDER BY scheduled_for ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE scan_jobs
     SET status = 'running',
         started_at = now(),
         attempts = attempts + 1
   WHERE id = j.id
  RETURNING * INTO j;

  RETURN NEXT j;
END;
$$;

-- Enqueue due scheduled scans as new jobs and advance their next run time
-- (plan section 8). Driven by pg_cron every ~5 minutes.
CREATE OR REPLACE FUNCTION enqueue_due_scans()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  s scan_schedules;
  site_url TEXT;
  org_id UUID;
BEGIN
  FOR s IN
    SELECT * FROM scan_schedules
     WHERE active = true AND next_run_at <= now()
     ORDER BY next_run_at ASC
     FOR UPDATE SKIP LOCKED
  LOOP
    SELECT url, organization_id INTO site_url, org_id FROM sites WHERE id = s.site_id;

    INSERT INTO scan_jobs (organization_id, user_id, site_id, url, trigger, status, scheduled_for)
    SELECT org_id,
           (SELECT user_id FROM memberships WHERE organization_id = org_id AND role = 'owner' LIMIT 1),
           s.site_id,
           site_url,
           'scheduled',
           'queued',
           now();

    UPDATE scan_schedules
       SET next_run_at = next_run_at + CASE s.cadence WHEN 'daily' THEN INTERVAL '1 day' ELSE INTERVAL '7 days' END
     WHERE id = s.id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_scan_job() TO service_role;
GRANT EXECUTE ON FUNCTION enqueue_due_scans() TO service_role;

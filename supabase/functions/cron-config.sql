-- Supabase Cron Configuration
-- Run this in the Supabase SQL editor AFTER deploying the sync-resultados Edge Function.
-- Requires pg_cron and pg_net extensions (enabled by default in Supabase).
--
-- Replace <PROJECT_REF> with your Supabase project ref (e.g. kpkwmizxvvjdlpaczese)
-- and <SUPABASE_ANON_KEY> with your anon key.

-- Enable extensions (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule sync every 2 minutes during the tournament
-- (Cancel or delete this job outside tournament windows to save quota)
SELECT cron.schedule(
  'sync-resultados-every-2min',
  '*/2 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-resultados',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_ANON_KEY>'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To cancel the job:
-- SELECT cron.unschedule('sync-resultados-every-2min');

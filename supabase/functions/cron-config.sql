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

-- Schedule daily comic-story generation at 11:00 UTC (08:00 BRT).
-- Generates and PUBLISHES the 6 stories about the PREVIOUS day's results,
-- so every morning there's a fresh set. Old ones auto-expire after 24h
-- (see migration 016_stories_expiram_24h.sql).
SELECT cron.schedule(
  'gerar-stories-diario-08h-brt',
  '0 11 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/gerar-stories-diario',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_ANON_KEY>'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- Check every 15 min whether a group-stage round just finished (all 24 games of
-- that round, across every group) and, if so, generate + publish Seu Zé's recap.
-- Idempotent: it only acts once per round. (Knockout phases are not modeled yet.)
SELECT cron.schedule(
  'gerar-comentarista-auto-15min',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/gerar-comentarista-auto',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_ANON_KEY>'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);

-- Check every 10 min whether the knockout bracket can be built/advanced from the
-- real standings + results, and create/update the knockout games (J73–J104).
-- Idempotent: never overwrites games already in progress/finished.
SELECT cron.schedule(
  'gerar-mata-mata-10min',
  '*/10 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/gerar-mata-mata',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SUPABASE_ANON_KEY>'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To cancel the jobs:
-- SELECT cron.unschedule('sync-resultados-every-2min');
-- SELECT cron.unschedule('gerar-stories-diario-08h-brt');
-- SELECT cron.unschedule('gerar-comentarista-auto-15min');
-- SELECT cron.unschedule('gerar-mata-mata-10min');

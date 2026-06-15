-- Migration 014: Ensure profiles.pontos_especiais exists in production.
-- The column is declared in 001_profiles.sql, but databases provisioned from
-- an older schema are missing it. The Ranking page selects this column, and a
-- missing column makes PostgREST return 400 for the whole profiles query —
-- leaving `usernames` empty and the ranking blank for every user.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pontos_especiais integer DEFAULT 0;

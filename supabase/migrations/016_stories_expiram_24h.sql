-- Migration 016: stories expiram 24h após a publicação (igual ao Instagram)
-- Participantes só enxergam stories publicados nas últimas 24h.
-- O admin continua vendo todos via a política "Admin gerencia stories" (FOR ALL).

DROP POLICY IF EXISTS "Stories visíveis para autenticados" ON stories;

CREATE POLICY "Stories visíveis para autenticados" ON stories
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND publicado = true
    AND publicado_em IS NOT NULL
    AND publicado_em > now() - interval '24 hours'
  );

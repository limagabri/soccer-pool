-- Migration 002: jogos table and RLS

CREATE TABLE IF NOT EXISTS jogos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_jogo integer UNIQUE NOT NULL,
  grupo       text NOT NULL,
  time_casa   text NOT NULL,
  time_fora   text NOT NULL,
  emoji_casa  text NOT NULL,
  emoji_fora  text NOT NULL,
  data_jogo   timestamptz NOT NULL,
  estadio     text,
  cidade      text,
  rodada      integer NOT NULL DEFAULT 1,
  gols_casa   integer,
  gols_fora   integer,
  encerrado   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games visible to all"
  ON jogos FOR SELECT USING (true);

CREATE POLICY "Admin updates games"
  ON jogos FOR UPDATE USING (is_user_admin());

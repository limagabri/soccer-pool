-- Migration 006: match events (goals, assists)

CREATE TABLE IF NOT EXISTS eventos_jogo (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id    uuid REFERENCES jogos NOT NULL,
  tipo       text NOT NULL CHECK (tipo IN ('gol', 'gol_contra', 'assistencia')),
  jogador    text NOT NULL,
  selecao    text NOT NULL,
  minuto     integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eventos_jogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events visible to all"
  ON eventos_jogo FOR SELECT USING (true);

CREATE POLICY "Admin manages events"
  ON eventos_jogo FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Migration 008: daily ranking snapshots

CREATE TABLE IF NOT EXISTS ranking_historico (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users NOT NULL,
  posicao      integer NOT NULL,
  pontos_total integer NOT NULL,
  data         date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, data)
);

ALTER TABLE ranking_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "History visible to all"       ON ranking_historico FOR SELECT USING (true);
CREATE POLICY "System inserts history"       ON ranking_historico FOR INSERT WITH CHECK (true);
CREATE POLICY "System updates history"       ON ranking_historico FOR UPDATE USING (true);

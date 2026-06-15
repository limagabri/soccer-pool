-- Migration 003: palpites table, RLS, scoring trigger

CREATE TABLE IF NOT EXISTS palpites (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid REFERENCES auth.users NOT NULL,
  jogo_id   uuid REFERENCES jogos NOT NULL,
  gols_casa integer NOT NULL CHECK (gols_casa >= 0),
  gols_fora integer NOT NULL CHECK (gols_fora >= 0),
  pontos    integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, jogo_id)
);

ALTER TABLE palpites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions visible to authenticated users"
  ON palpites FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users insert own predictions"
  ON palpites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own predictions"
  ON palpites FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION recalcular_pontos_jogo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.encerrado = true AND NEW.gols_casa IS NOT NULL AND NEW.gols_fora IS NOT NULL THEN
    UPDATE palpites SET pontos = CASE
      WHEN gols_casa = NEW.gols_casa AND gols_fora = NEW.gols_fora THEN 10
      WHEN (gols_casa > gols_fora AND NEW.gols_casa > NEW.gols_fora)
        OR (gols_casa < gols_fora AND NEW.gols_casa < NEW.gols_fora)
        OR (gols_casa = gols_fora AND NEW.gols_casa = NEW.gols_fora) THEN 5
      ELSE 0
    END
    WHERE jogo_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_pontos_jogo ON jogos;
CREATE TRIGGER trigger_pontos_jogo
  AFTER UPDATE ON jogos
  FOR EACH ROW EXECUTE FUNCTION recalcular_pontos_jogo();

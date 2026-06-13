-- Migration 004: special predictions tables, scoring function

CREATE TABLE IF NOT EXISTS escolhas_especiais (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users NOT NULL UNIQUE,
  campeao       text,
  vice_campeao  text,
  terceiro      text,
  artilheiro    text,
  melhor_jogador text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE escolhas_especiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own special picks"
  ON escolhas_especiais FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own special picks"
  ON escolhas_especiais FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own special picks"
  ON escolhas_especiais FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "All picks visible to authenticated users"
  ON escolhas_especiais FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin sees all special picks"
  ON escolhas_especiais FOR SELECT USING (is_user_admin());

CREATE TABLE IF NOT EXISTS resultados_especiais (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campeao        text,
  vice_campeao   text,
  terceiro       text,
  artilheiro     text,
  melhor_jogador text,
  finalizado     boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE resultados_especiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Special results visible to all"
  ON resultados_especiais FOR SELECT USING (true);

CREATE POLICY "Admin manages special results"
  ON resultados_especiais FOR ALL USING (is_user_admin());

-- Scoring: champion=30, runner-up=15, third=10, top-scorer=20, best-player=15
CREATE OR REPLACE FUNCTION calcular_pontos_especiais()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  res resultados_especiais%ROWTYPE;
  e   record;
  pts integer;
BEGIN
  SELECT * INTO res FROM resultados_especiais
  WHERE finalizado = true ORDER BY created_at LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  FOR e IN SELECT * FROM escolhas_especiais LOOP
    pts := 0;
    IF e.campeao       IS NOT NULL AND e.campeao       = res.campeao       THEN pts := pts + 30; END IF;
    IF e.vice_campeao  IS NOT NULL AND e.vice_campeao  = res.vice_campeao  THEN pts := pts + 15; END IF;
    IF e.terceiro      IS NOT NULL AND e.terceiro      = res.terceiro      THEN pts := pts + 10; END IF;
    IF e.artilheiro    IS NOT NULL AND lower(trim(e.artilheiro))    = lower(trim(res.artilheiro))    THEN pts := pts + 20; END IF;
    IF e.melhor_jogador IS NOT NULL AND lower(trim(e.melhor_jogador)) = lower(trim(res.melhor_jogador)) THEN pts := pts + 15; END IF;
    UPDATE profiles SET pontos_especiais = pts WHERE id = e.user_id;
  END LOOP;
END;
$$;

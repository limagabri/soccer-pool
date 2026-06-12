-- SPRINT 7: Estatísticas de jogadores e placar de escolhas especiais
-- Executar no Supabase Dashboard SQL Editor

-- ─── eventos_jogo ────────────────────────────────────────────────────────────
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

CREATE POLICY "Eventos visíveis para todos" ON eventos_jogo
  FOR SELECT USING (true);

CREATE POLICY "Admin gerencia eventos" ON eventos_jogo
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── resultados_especiais ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resultados_especiais (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campeao        text,
  vice_campeao   text,
  terceiro       text,
  artilheiro     text,
  melhor_jogador text,
  melhor_defesa  text,
  finalizado     boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE resultados_especiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resultados visíveis para todos" ON resultados_especiais
  FOR SELECT USING (true);

CREATE POLICY "Admin gerencia resultados especiais" ON resultados_especiais
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── pontos_especiais em profiles ─────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pontos_especiais integer DEFAULT 0;

-- ─── atualizar escolhas_especiais ─────────────────────────────────────────────
-- Renomear melhor_goleiro → melhor_jogador e remover melhor_defesa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'escolhas_especiais' AND column_name = 'melhor_goleiro'
  ) THEN
    ALTER TABLE escolhas_especiais RENAME COLUMN melhor_goleiro TO melhor_jogador;
  END IF;
END $$;

ALTER TABLE escolhas_especiais DROP COLUMN IF EXISTS melhor_defesa;

-- ─── função: calcular pontos especiais ────────────────────────────────────────
-- Pontuação: campeão=30, vice=15, terceiro=10, artilheiro=20, melhor_jogador=15
CREATE OR REPLACE FUNCTION calcular_pontos_especiais()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res resultados_especiais%ROWTYPE;
  e   record;
  pts integer;
BEGIN
  SELECT * INTO res
  FROM resultados_especiais
  WHERE finalizado = true
  ORDER BY created_at
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  FOR e IN SELECT * FROM escolhas_especiais LOOP
    pts := 0;
    IF e.campeao      IS NOT NULL AND e.campeao      = res.campeao      THEN pts := pts + 30; END IF;
    IF e.vice_campeao IS NOT NULL AND e.vice_campeao = res.vice_campeao THEN pts := pts + 15; END IF;
    IF e.terceiro     IS NOT NULL AND e.terceiro     = res.terceiro     THEN pts := pts + 10; END IF;
    IF e.artilheiro   IS NOT NULL
       AND lower(trim(e.artilheiro))   = lower(trim(res.artilheiro))   THEN pts := pts + 20; END IF;
    IF e.melhor_jogador IS NOT NULL
       AND lower(trim(e.melhor_jogador)) = lower(trim(res.melhor_jogador)) THEN pts := pts + 15; END IF;

    UPDATE profiles SET pontos_especiais = pts WHERE id = e.user_id;
  END LOOP;
END;
$$;

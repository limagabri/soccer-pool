-- Migration 015: recria tabelas que faltavam em produção (banco provisionado de
-- schema antigo, divergente das migrations) e conserta o realtime.
--   - comentarios        (chat por jogo)         — estava AUSENTE → chat quebrado
--   - resultados_especiais (resultados oficiais)  — estava AUSENTE
--   - ranking_historico  (snapshots do ranking)  — estava AUSENTE
--   - realtime de comentarios e eventos_jogo (mensagens ao vivo / animação de gol)

-- ─────────────────────────────── comentarios ───────────────────────────────
CREATE TABLE IF NOT EXISTS comentarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id    uuid REFERENCES jogos NOT NULL,
  user_id    uuid REFERENCES auth.users NOT NULL,
  texto      text NOT NULL CHECK (char_length(texto) <= 280),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments visible to authenticated users" ON comentarios;
CREATE POLICY "Comments visible to authenticated users"
  ON comentarios FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users insert own comments" ON comentarios;
CREATE POLICY "Users insert own comments"
  ON comentarios FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own comments" ON comentarios;
CREATE POLICY "Users delete own comments"
  ON comentarios FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin deletes any comment" ON comentarios;
CREATE POLICY "Admin deletes any comment"
  ON comentarios FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ──────────────────────────── resultados_especiais ─────────────────────────
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

DROP POLICY IF EXISTS "Special results visible to all" ON resultados_especiais;
CREATE POLICY "Special results visible to all"
  ON resultados_especiais FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manages special results" ON resultados_especiais;
CREATE POLICY "Admin manages special results"
  ON resultados_especiais FOR ALL USING (is_user_admin());

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
    IF e.campeao        IS NOT NULL AND e.campeao        = res.campeao        THEN pts := pts + 30; END IF;
    IF e.vice_campeao   IS NOT NULL AND e.vice_campeao   = res.vice_campeao   THEN pts := pts + 15; END IF;
    IF e.terceiro       IS NOT NULL AND e.terceiro       = res.terceiro       THEN pts := pts + 10; END IF;
    IF e.artilheiro     IS NOT NULL AND lower(trim(e.artilheiro))     = lower(trim(res.artilheiro))     THEN pts := pts + 20; END IF;
    IF e.melhor_jogador IS NOT NULL AND lower(trim(e.melhor_jogador)) = lower(trim(res.melhor_jogador)) THEN pts := pts + 15; END IF;
    UPDATE profiles SET pontos_especiais = pts WHERE id = e.user_id;
  END LOOP;
END;
$$;

-- ───────────────────────────── ranking_historico ───────────────────────────
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

DROP POLICY IF EXISTS "History visible to all" ON ranking_historico;
CREATE POLICY "History visible to all" ON ranking_historico FOR SELECT USING (true);
DROP POLICY IF EXISTS "System inserts history" ON ranking_historico;
CREATE POLICY "System inserts history" ON ranking_historico FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "System updates history" ON ranking_historico;
CREATE POLICY "System updates history" ON ranking_historico FOR UPDATE USING (true);

-- ─────────────────────────────── realtime ──────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='comentarios') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comentarios;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='eventos_jogo') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE eventos_jogo;
  END IF;
END $$;

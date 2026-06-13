-- SPRINT 8: Chat por jogo, compartilhamento de card e histórico de ranking
-- Executar no Supabase Dashboard SQL Editor

-- ─── comentarios ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comentarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id    uuid REFERENCES jogos NOT NULL,
  user_id    uuid REFERENCES auth.users NOT NULL,
  texto      text NOT NULL CHECK (char_length(texto) <= 280),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários visíveis para autenticados" ON comentarios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários inserem próprios comentários" ON comentarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios comentários" ON comentarios
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin deleta qualquer comentário" ON comentarios
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE comentarios;

-- ─── ranking_historico ────────────────────────────────────────────────────────
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

CREATE POLICY "Histórico visível para todos" ON ranking_historico
  FOR SELECT USING (true);

CREATE POLICY "Sistema insere histórico" ON ranking_historico
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema atualiza histórico" ON ranking_historico
  FOR UPDATE USING (true);

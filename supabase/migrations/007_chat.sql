-- Migration 007: per-match chat with realtime

CREATE TABLE IF NOT EXISTS comentarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id    uuid REFERENCES jogos NOT NULL,
  user_id    uuid REFERENCES auth.users NOT NULL,
  texto      text NOT NULL CHECK (char_length(texto) <= 280),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments visible to authenticated users"
  ON comentarios FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users insert own comments"
  ON comentarios FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments"
  ON comentarios FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin deletes any comment"
  ON comentarios FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

ALTER PUBLICATION supabase_realtime ADD TABLE comentarios;

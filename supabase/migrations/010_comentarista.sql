-- Migration 010: AI commentator and comic stories

CREATE TABLE IF NOT EXISTS comentarios_ia (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL CHECK (tipo IN (
    'rodada_grupos', 'rodada_32avos', 'rodada_oitavas',
    'rodada_quartas', 'rodada_semis', 'rodada_final'
  )),
  numero_rodada integer,
  conteudo      text NOT NULL,
  publicado     boolean DEFAULT false,
  gerado_em     timestamptz DEFAULT now(),
  publicado_em  timestamptz,
  created_by    uuid REFERENCES auth.users
);

ALTER TABLE comentarios_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários IA visíveis para autenticados" ON comentarios_ia
  FOR SELECT USING (auth.uid() IS NOT NULL AND publicado = true);

CREATE POLICY "Admin gerencia comentários IA" ON comentarios_ia
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Comic stories (Instagram-style)

CREATE TABLE IF NOT EXISTS stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template    text NOT NULL CHECK (template IN (
    'hall_vergonha', 'zebra_dia', 'vidente_chutometro',
    'subiu_afundou', 'palpite_covarde', 'telepata_rodada'
  )),
  titulo      text NOT NULL,
  conteudo_ia text NOT NULL,
  dados       json,
  publicado   boolean DEFAULT false,
  criado_em   timestamptz DEFAULT now(),
  publicado_em timestamptz
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories visíveis para autenticados" ON stories
  FOR SELECT USING (auth.uid() IS NOT NULL AND publicado = true);

CREATE POLICY "Admin gerencia stories" ON stories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

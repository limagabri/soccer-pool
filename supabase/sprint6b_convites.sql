-- Sprint 6b — Sistema de Convites
-- Execute no Supabase SQL Editor

-- ── Tabela convites (cria se não existir, migra se veio do sprint6) ───────────
CREATE TABLE IF NOT EXISTS convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  nome text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  usado boolean DEFAULT false,
  criado_por uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days'
);

-- Migração para quem já rodou sprint6_admin.sql (adiciona/remove colunas)
ALTER TABLE convites DROP COLUMN IF EXISTS senha_temporaria;
ALTER TABLE convites ADD COLUMN IF NOT EXISTS token text UNIQUE;
ALTER TABLE convites ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT now() + interval '7 days';
UPDATE convites SET token = encode(gen_random_bytes(32), 'hex') WHERE token IS NULL;
ALTER TABLE convites ALTER COLUMN token SET NOT NULL;
ALTER TABLE convites ALTER COLUMN token SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gerencia convites" ON convites;
DROP POLICY IF EXISTS "Convite visível por token" ON convites;

-- Admin faz tudo
CREATE POLICY "Admin gerencia convites" ON convites
  FOR ALL USING (is_user_admin());

-- Qualquer pessoa pode LER um convite pelo token (necessário no /cadastro antes do login)
CREATE POLICY "Convite visível por token" ON convites
  FOR SELECT USING (true);

-- ── Função para marcar convite como usado (chamada após signup) ───────────────
CREATE OR REPLACE FUNCTION marcar_convite_usado(p_token text, p_email text)
RETURNS boolean AS $$
BEGIN
  UPDATE convites
  SET usado = true
  WHERE token = p_token
    AND email = p_email
    AND usado = false
    AND expires_at > now();
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

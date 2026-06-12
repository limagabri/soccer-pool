-- Sprint 6 — Admin, Primeiro Acesso e Escolhas Especiais
-- Execute via: node scripts/db.js --file supabase/sprint6_admin.sql

-- ── Novas colunas no profiles ────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primeiro_acesso boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS senha_trocada boolean DEFAULT false;

-- ── Função helper: checa admin sem recursão RLS ───────────────────────────────
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean AS $$
  SELECT coalesce(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Políticas de profiles ─────────────────────────────────────────────────────
-- Admin vê todos os perfis (a policy existente cobre apenas o próprio)
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON profiles;
CREATE POLICY "Admin vê todos os perfis" ON profiles
  FOR SELECT USING (is_user_admin());

-- Admin atualiza qualquer perfil (ex: setar is_admin de outro usuário)
DROP POLICY IF EXISTS "Admin atualiza todos os perfis" ON profiles;
CREATE POLICY "Admin atualiza todos os perfis" ON profiles
  FOR UPDATE USING (is_user_admin());

-- ── Políticas de jogos ────────────────────────────────────────────────────────
-- Remove a política que deixava qualquer um atualizar
DROP POLICY IF EXISTS "Admin atualiza jogos" ON jogos;
DROP POLICY IF EXISTS "Admin pode atualizar jogos" ON jogos;
CREATE POLICY "Admin pode atualizar jogos" ON jogos
  FOR UPDATE USING (is_user_admin());

-- ── Tabela de convites ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  nome text NOT NULL,
  senha_temporaria text NOT NULL,
  usado boolean DEFAULT false,
  criado_por uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin gerencia convites" ON convites;
CREATE POLICY "Admin gerencia convites" ON convites
  FOR ALL USING (is_user_admin());

-- ── Tabela de escolhas especiais ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escolhas_especiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  campeao text,
  vice_campeao text,
  terceiro text,
  artilheiro text,
  melhor_goleiro text,
  melhor_defesa text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE escolhas_especiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários veem próprias escolhas" ON escolhas_especiais;
DROP POLICY IF EXISTS "Usuários inserem próprias escolhas" ON escolhas_especiais;
DROP POLICY IF EXISTS "Usuários atualizam próprias escolhas" ON escolhas_especiais;
DROP POLICY IF EXISTS "Escolhas visíveis para todos autenticados" ON escolhas_especiais;
DROP POLICY IF EXISTS "Admin vê todas as escolhas" ON escolhas_especiais;

CREATE POLICY "Usuários veem próprias escolhas" ON escolhas_especiais
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários inserem próprias escolhas" ON escolhas_especiais
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários atualizam próprias escolhas" ON escolhas_especiais
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Escolhas visíveis para todos autenticados" ON escolhas_especiais
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin vê todas as escolhas" ON escolhas_especiais
  FOR SELECT USING (is_user_admin());

-- ── RPC para admin listar usuários (com email via auth.users) ─────────────────
CREATE OR REPLACE FUNCTION admin_listar_usuarios()
RETURNS TABLE(
  id uuid,
  username text,
  email text,
  is_admin boolean,
  primeiro_acesso boolean,
  pontos bigint,
  palpites_count bigint,
  created_at timestamptz
) AS $$
BEGIN
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    u.email::text,
    p.is_admin,
    p.primeiro_acesso,
    coalesce((SELECT sum(pal.pontos) FROM palpites pal WHERE pal.user_id = p.id), 0)::bigint AS pontos,
    coalesce((SELECT count(*) FROM palpites pal WHERE pal.user_id = p.id), 0)::bigint AS palpites_count,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY pontos DESC, p.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

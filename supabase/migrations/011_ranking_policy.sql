-- Migration 011: Fix palpites SELECT policy to allow ranking to work
-- The policy must allow any authenticated user to read ALL palpites,
-- not just their own, otherwise ranking only shows the logged-in user.

-- Drop any existing SELECT policies (names may vary across deployments)
DROP POLICY IF EXISTS "Usuários veem próprios palpites" ON palpites;
DROP POLICY IF EXISTS "Palpites visíveis para todos autenticados" ON palpites;
DROP POLICY IF EXISTS "Palpites visíveis para autenticados" ON palpites;
DROP POLICY IF EXISTS "Predictions visible to authenticated users" ON palpites;

-- Recreate with a canonical name
CREATE POLICY "Palpites visíveis para autenticados"
  ON palpites FOR SELECT
  USING (auth.uid() IS NOT NULL);

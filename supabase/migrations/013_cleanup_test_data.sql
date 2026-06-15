-- Migration 013: Clean up test data before open-source release.
-- Safe to run multiple times (idempotent WHERE clauses).

-- 1. Remove special picks from test users
DELETE FROM escolhas_especiais
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'ana@teste.com', 'pedro@teste.com', 'joao@teste.com',
    'maria@teste.com', 'carlos@teste.com'
  )
);

-- 2. Remove predictions from test users
DELETE FROM palpites
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'ana@teste.com', 'pedro@teste.com', 'joao@teste.com',
    'maria@teste.com', 'carlos@teste.com'
  )
);

-- 3. Remove chat messages from test users
DELETE FROM comentarios
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'ana@teste.com', 'pedro@teste.com', 'joao@teste.com',
    'maria@teste.com', 'carlos@teste.com'
  )
);

-- 4. Remove profiles of test users
DELETE FROM profiles
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'ana@teste.com', 'pedro@teste.com', 'joao@teste.com',
    'maria@teste.com', 'carlos@teste.com'
  )
);

-- 5. Remove unpublished stories and AI commentary
DELETE FROM stories WHERE publicado = false;
DELETE FROM comentarios_ia WHERE publicado = false;

-- 6. Remove ranking history (was built with test data)
DELETE FROM ranking_historico;

-- 7. Reset fictitious match results (only if real results haven't been entered yet)
-- Remove this block after real Copa 2026 matches are completed.
UPDATE jogos SET
  gols_casa = NULL,
  gols_fora = NULL,
  encerrado = false
WHERE numero_jogo IN (7, 8)
  AND encerrado = true
  AND gols_casa IS NOT NULL
  AND updated_at < '2026-06-13'::timestamptz;

-- 8. Remove fictitious goal events inserted for demo purposes
DELETE FROM eventos_jogo
WHERE jogador IN ('Vinicius Jr', 'Rodrygo', 'Endrick', 'Raphinha', 'Amallah')
  AND created_at < '2026-06-14'::timestamptz;

-- 9. Confirmation
SELECT 'profiles (non-admin)' AS entity, COUNT(*) AS total FROM profiles WHERE is_admin = false
UNION ALL
SELECT 'jogos encerrados', COUNT(*) FROM jogos WHERE encerrado = true
UNION ALL
SELECT 'palpites', COUNT(*) FROM palpites
UNION ALL
SELECT 'ranking_historico', COUNT(*) FROM ranking_historico;

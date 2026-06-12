-- Sprint 3 — jogos, palpites e resultados
-- Executar no Supabase SQL Editor

-- Apagar tabela de jogos antiga se existir
DROP TABLE IF EXISTS palpites;
DROP TABLE IF EXISTS jogos;

CREATE TABLE jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_jogo integer UNIQUE NOT NULL,
  grupo text NOT NULL,
  time_casa text NOT NULL,
  time_fora text NOT NULL,
  emoji_casa text NOT NULL,
  emoji_fora text NOT NULL,
  data_jogo timestamptz NOT NULL,
  estadio text,
  cidade text,
  rodada integer NOT NULL DEFAULT 1,
  gols_casa integer,
  gols_fora integer,
  encerrado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE palpites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  jogo_id uuid REFERENCES jogos NOT NULL,
  gols_casa integer NOT NULL CHECK (gols_casa >= 0),
  gols_fora integer NOT NULL CHECK (gols_fora >= 0),
  pontos integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, jogo_id)
);

ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jogos visíveis para todos" ON jogos FOR SELECT USING (true);
CREATE POLICY "Admin atualiza jogos" ON jogos FOR UPDATE USING (true);
CREATE POLICY "Palpites visíveis para todos autenticados" ON palpites FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuários inserem próprios palpites" ON palpites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários atualizam próprios palpites" ON palpites FOR UPDATE USING (auth.uid() = user_id);

-- TODOS OS 72 JOGOS DA FASE DE GRUPOS (horários de Brasília)
INSERT INTO jogos (numero_jogo, grupo, time_casa, time_fora, emoji_casa, emoji_fora, data_jogo, estadio, cidade, rodada) VALUES
-- RODADA 1
(1,  'A', 'México',       'África do Sul',    '🇲🇽','🇿🇦','2026-06-11 16:00:00-03','Estádio Azteca',        'Cidade do México', 1),
(2,  'A', 'Coreia do Sul','Rep. Tcheca',       '🇰🇷','🇨🇿','2026-06-11 23:00:00-03','Estádio Akron',         'Guadalajara',      1),
(3,  'B', 'Canadá',       'Bósnia-Herzegóvina','🇨🇦','🇧🇦','2026-06-12 16:00:00-03','BMO Field',             'Toronto',          1),
(4,  'D', 'Estados Unidos','Paraguai',          '🇺🇸','🇵🇾','2026-06-12 22:00:00-03','SoFi Stadium',          'Los Angeles',      1),
(5,  'D', 'Austrália',    'Turquia',           '🇦🇺','🇹🇷','2026-06-13 01:00:00-03','BC Place',              'Vancouver',        1),
(6,  'B', 'Catar',        'Suíça',             '🇶🇦','🇨🇭','2026-06-13 16:00:00-03','Levi Stadium',          'San Francisco',    1),
(7,  'C', 'Brasil',       'Marrocos',          '🇧🇷','🇲🇦','2026-06-13 19:00:00-03','MetLife Stadium',       'Nova York',        1),
(8,  'C', 'Haiti',        'Escócia',           '🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-13 22:00:00-03','Gillette Stadium',      'Boston',           1),
(9,  'E', 'Alemanha',     'Curaçao',           '🇩🇪','🇨🇼','2026-06-14 14:00:00-03','NRG Stadium',           'Houston',          1),
(10, 'F', 'Holanda',      'Japão',             '🇳🇱','🇯🇵','2026-06-14 17:00:00-03','AT&T Stadium',          'Dallas',           1),
(11, 'E', 'Costa do Marfim','Equador',         '🇨🇮','🇪🇨','2026-06-14 20:00:00-03','Lincoln Financial',     'Filadélfia',       1),
(12, 'F', 'Suécia',       'Tunísia',           '🇸🇪','🇹🇳','2026-06-14 23:00:00-03','Estadio BBVA',          'Monterrey',        1),
(13, 'H', 'Espanha',      'Cabo Verde',        '🇪🇸','🇨🇻','2026-06-15 13:00:00-03','Mercedes-Benz Stadium', 'Atlanta',          1),
(14, 'G', 'Bélgica',      'Egito',             '🇧🇪','🇪🇬','2026-06-15 16:00:00-03','Hard Rock Stadium',     'Miami',            1),
(15, 'I', 'França',       'Iraque',            '🇫🇷','🇮🇶','2026-06-15 19:00:00-03','Arrowhead Stadium',     'Kansas City',      1),
(16, 'G', 'Irã',          'Nova Zelândia',     '🇮🇷','🇳🇿','2026-06-15 22:00:00-03','Lumen Field',           'Seattle',          1),
(17, 'J', 'Argentina',    'Argélia',           '🇦🇷','🇩🇿','2026-06-16 13:00:00-03','MetLife Stadium',       'Nova York',        1),
(18, 'H', 'Arábia Saudita','Uruguai',          '🇸🇦','🇺🇾','2026-06-16 16:00:00-03','Allegiant Stadium',     'Las Vegas',        1),
(19, 'I', 'Senegal',      'Noruega',           '🇸🇳','🇳🇴','2026-06-16 19:00:00-03','State Farm Stadium',    'Phoenix',          1),
(20, 'J', 'Áustria',      'Jordânia',          '🇦🇹','🇯🇴','2026-06-16 22:00:00-03','Estadio Azteca',        'Cidade do México', 1),
(21, 'K', 'Portugal',     'Uzbequistão',       '🇵🇹','🇺🇿','2026-06-17 13:00:00-03','Rose Bowl',             'Los Angeles',      1),
(22, 'L', 'Inglaterra',   'Croácia',           '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷','2026-06-17 16:00:00-03','BC Place',              'Vancouver',        1),
(23, 'K', 'Colômbia',     'RD Congo',          '🇨🇴','🇨🇩','2026-06-17 19:00:00-03','SoFi Stadium',          'Los Angeles',      1),
(24, 'L', 'Gana',         'Panamá',            '🇬🇭','🇵🇦','2026-06-17 22:00:00-03','Empower Field',         'Denver',           1),
-- RODADA 2
(25, 'A', 'México',       'Coreia do Sul',     '🇲🇽','🇰🇷','2026-06-18 22:00:00-03','AT&T Stadium',          'Dallas',           2),
(26, 'A', 'África do Sul','Rep. Tcheca',       '🇿🇦','🇨🇿','2026-06-18 13:00:00-03','Estadio BBVA',          'Monterrey',        2),
(27, 'B', 'Canadá',       'Catar',             '🇨🇦','🇶🇦','2026-06-19 13:00:00-03','BMO Field',             'Toronto',          2),
(28, 'C', 'Brasil',       'Haiti',             '🇧🇷','🇭🇹','2026-06-19 16:00:00-03','Allegiant Stadium',     'Las Vegas',        2),
(29, 'B', 'Suíça',        'Bósnia-Herzegóvina','🇨🇭','🇧🇦','2026-06-19 19:00:00-03','Gillette Stadium',      'Boston',           2),
(30, 'C', 'Marrocos',     'Escócia',           '🇲🇦','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-19 22:00:00-03','NRG Stadium',           'Houston',          2),
(31, 'D', 'Estados Unidos','Austrália',         '🇺🇸','🇦🇺','2026-06-20 13:00:00-03','MetLife Stadium',       'Nova York',        2),
(32, 'E', 'Alemanha',     'Costa do Marfim',   '🇩🇪','🇨🇮','2026-06-20 16:00:00-03','Lincoln Financial',     'Filadélfia',       2),
(33, 'D', 'Paraguai',     'Turquia',           '🇵🇾','🇹🇷','2026-06-20 19:00:00-03','Levi Stadium',          'San Francisco',    2),
(34, 'E', 'Equador',      'Curaçao',           '🇪🇨','🇨🇼','2026-06-20 22:00:00-03','Arrowhead Stadium',     'Kansas City',      2),
(35, 'F', 'Holanda',      'Suécia',            '🇳🇱','🇸🇪','2026-06-21 13:00:00-03','Hard Rock Stadium',     'Miami',            2),
(36, 'G', 'Bélgica',      'Irã',               '🇧🇪','🇮🇷','2026-06-21 16:00:00-03','Rose Bowl',             'Los Angeles',      2),
(37, 'F', 'Japão',        'Tunísia',           '🇯🇵','🇹🇳','2026-06-21 19:00:00-03','SoFi Stadium',          'Los Angeles',      2),
(38, 'G', 'Egito',        'Nova Zelândia',     '🇪🇬','🇳🇿','2026-06-21 22:00:00-03','Lumen Field',           'Seattle',          2),
(39, 'H', 'Espanha',      'Arábia Saudita',    '🇪🇸','🇸🇦','2026-06-22 13:00:00-03','Mercedes-Benz Stadium', 'Atlanta',          2),
(40, 'I', 'França',       'Senegal',           '🇫🇷','🇸🇳','2026-06-22 16:00:00-03','BC Place',              'Vancouver',        2),
(41, 'H', 'Cabo Verde',   'Uruguai',           '🇨🇻','🇺🇾','2026-06-22 19:00:00-03','State Farm Stadium',    'Phoenix',          2),
(42, 'I', 'Iraque',       'Noruega',           '🇮🇶','🇳🇴','2026-06-22 22:00:00-03','Estadio Azteca',        'Cidade do México', 2),
(43, 'J', 'Argentina',    'Áustria',           '🇦🇷','🇦🇹','2026-06-23 13:00:00-03','NRG Stadium',           'Houston',          2),
(44, 'K', 'Portugal',     'Colômbia',          '🇵🇹','🇨🇴','2026-06-23 16:00:00-03','AT&T Stadium',          'Dallas',           2),
(45, 'J', 'Argélia',      'Jordânia',          '🇩🇿','🇯🇴','2026-06-23 19:00:00-03','BMO Field',             'Toronto',          2),
(46, 'K', 'Uzbequistão',  'RD Congo',          '🇺🇿','🇨🇩','2026-06-23 22:00:00-03','Empower Field',         'Denver',           2),
(47, 'L', 'Inglaterra',   'Gana',              '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇬🇭','2026-06-24 13:00:00-03','MetLife Stadium',       'Nova York',        2),
(48, 'L', 'Croácia',      'Panamá',            '🇭🇷','🇵🇦','2026-06-24 16:00:00-03','Allegiant Stadium',     'Las Vegas',        2),
-- RODADA 3 (jogos simultâneos por grupo)
(49, 'A', 'México',       'Rep. Tcheca',       '🇲🇽','🇨🇿','2026-06-25 16:00:00-03','Estadio Azteca',        'Cidade do México', 3),
(50, 'A', 'África do Sul','Coreia do Sul',     '🇿🇦','🇰🇷','2026-06-25 16:00:00-03','Estadio BBVA',          'Monterrey',        3),
(51, 'B', 'Canadá',       'Suíça',             '🇨🇦','🇨🇭','2026-06-25 19:00:00-03','BMO Field',             'Toronto',          3),
(52, 'B', 'Catar',        'Bósnia-Herzegóvina','🇶🇦','🇧🇦','2026-06-25 19:00:00-03','Gillette Stadium',      'Boston',           3),
(53, 'C', 'Brasil',       'Escócia',           '🇧🇷','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-24 22:00:00-03','MetLife Stadium',       'Nova York',        3),
(54, 'C', 'Marrocos',     'Haiti',             '🇲🇦','🇭🇹','2026-06-24 22:00:00-03','NRG Stadium',           'Houston',          3),
(55, 'D', 'Estados Unidos','Turquia',           '🇺🇸','🇹🇷','2026-06-26 16:00:00-03','SoFi Stadium',          'Los Angeles',      3),
(56, 'D', 'Paraguai',     'Austrália',         '🇵🇾','🇦🇺','2026-06-26 16:00:00-03','Levi Stadium',          'San Francisco',    3),
(57, 'E', 'Alemanha',     'Equador',           '🇩🇪','🇪🇨','2026-06-26 19:00:00-03','AT&T Stadium',          'Dallas',           3),
(58, 'E', 'Costa do Marfim','Curaçao',         '🇨🇮','🇨🇼','2026-06-26 19:00:00-03','Lincoln Financial',     'Filadélfia',       3),
(59, 'F', 'Holanda',      'Tunísia',           '🇳🇱','🇹🇳','2026-06-27 13:00:00-03','Rose Bowl',             'Los Angeles',      3),
(60, 'F', 'Japão',        'Suécia',            '🇯🇵','🇸🇪','2026-06-27 13:00:00-03','Hard Rock Stadium',     'Miami',            3),
(61, 'G', 'Bélgica',      'Nova Zelândia',     '🇧🇪','🇳🇿','2026-06-27 16:00:00-03','Arrowhead Stadium',     'Kansas City',      3),
(62, 'G', 'Egito',        'Irã',               '🇪🇬','🇮🇷','2026-06-27 16:00:00-03','Lumen Field',           'Seattle',          3),
(63, 'H', 'Espanha',      'Uruguai',           '🇪🇸','🇺🇾','2026-06-27 19:00:00-03','Mercedes-Benz Stadium', 'Atlanta',          3),
(64, 'H', 'Cabo Verde',   'Arábia Saudita',    '🇨🇻','🇸🇦','2026-06-27 19:00:00-03','State Farm Stadium',    'Phoenix',          3),
(65, 'I', 'França',       'Noruega',           '🇫🇷','🇳🇴','2026-06-27 22:00:00-03','BC Place',              'Vancouver',        3),
(66, 'I', 'Iraque',       'Senegal',           '🇮🇶','🇸🇳','2026-06-27 22:00:00-03','Estadio Azteca',        'Cidade do México', 3),
(67, 'J', 'Argentina',    'Jordânia',          '🇦🇷','🇯🇴','2026-06-26 13:00:00-03','NRG Stadium',           'Houston',          3),
(68, 'J', 'Argélia',      'Áustria',           '🇩🇿','🇦🇹','2026-06-26 13:00:00-03','BMO Field',             'Toronto',          3),
(69, 'K', 'Portugal',     'RD Congo',          '🇵🇹','🇨🇩','2026-06-26 22:00:00-03','SoFi Stadium',          'Los Angeles',      3),
(70, 'K', 'Colômbia',     'Uzbequistão',       '🇨🇴','🇺🇿','2026-06-26 22:00:00-03','Empower Field',         'Denver',           3),
(71, 'L', 'Inglaterra',   'Panamá',            '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇵🇦','2026-06-24 19:00:00-03','Allegiant Stadium',     'Las Vegas',        3),
(72, 'L', 'Croácia',      'Gana',              '🇭🇷','🇬🇭','2026-06-24 19:00:00-03','Empower Field',         'Denver',           3);

-- Atualizar resultados já conhecidos (11/06 e 12/06)
UPDATE jogos SET gols_casa = 2, gols_fora = 0, encerrado = true WHERE numero_jogo = 1; -- México 2x0 África do Sul
UPDATE jogos SET gols_casa = 2, gols_fora = 1, encerrado = true WHERE numero_jogo = 2; -- Coreia do Sul 2x1 Rep. Tcheca

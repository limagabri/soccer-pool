-- Resultados dos jogos já ocorridos (Copa 2026 fase de grupos)
UPDATE jogos SET gols_casa=1, gols_fora=0, encerrado=true WHERE numero_jogo=4;
UPDATE jogos SET gols_casa=0, gols_fora=1, encerrado=true WHERE numero_jogo=5;
UPDATE jogos SET gols_casa=0, gols_fora=2, encerrado=true WHERE numero_jogo=6;
UPDATE jogos SET gols_casa=4, gols_fora=1, encerrado=true WHERE numero_jogo=7;
UPDATE jogos SET gols_casa=0, gols_fora=1, encerrado=true WHERE numero_jogo=8;

-- Eventos do jogo 7 (Brasil 4×1 Marrocos — dados fictícios)
INSERT INTO eventos_jogo (jogo_id, tipo, jogador, selecao, minuto)
SELECT id, 'gol', 'Vinicius Jr', 'Brasil', 12 FROM jogos WHERE numero_jogo=7;

INSERT INTO eventos_jogo (jogo_id, tipo, jogador, selecao, minuto)
SELECT id, 'gol', 'Rodrygo', 'Brasil', 34 FROM jogos WHERE numero_jogo=7;

INSERT INTO eventos_jogo (jogo_id, tipo, jogador, selecao, minuto)
SELECT id, 'gol', 'Endrick', 'Brasil', 67 FROM jogos WHERE numero_jogo=7;

INSERT INTO eventos_jogo (jogo_id, tipo, jogador, selecao, minuto)
SELECT id, 'gol', 'Raphinha', 'Brasil', 89 FROM jogos WHERE numero_jogo=7;

INSERT INTO eventos_jogo (jogo_id, tipo, jogador, selecao, minuto)
SELECT id, 'gol', 'Amallah', 'Marrocos', 55 FROM jogos WHERE numero_jogo=7;

-- Verificações
SELECT COUNT(*) AS encerrados FROM jogos WHERE encerrado=true;

SELECT e.jogador, e.selecao, e.minuto
FROM eventos_jogo e
JOIN jogos j ON j.id = e.jogo_id
WHERE j.numero_jogo = 7
ORDER BY e.minuto;

SELECT numero_jogo, time_casa, time_fora, gols_casa, gols_fora
FROM jogos WHERE encerrado=true ORDER BY numero_jogo;

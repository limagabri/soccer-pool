-- Migration 017: fase de mata-mata
-- - jogos ganha `fase` (grupos|r32|oitavas|quartas|semis|terceiro|final) e
--   `vencedor_penaltis` (quem avançou nos pênaltis, em empate de knockout);
--   `grupo` passa a aceitar NULL (jogos de mata-mata não têm grupo).
-- - palpites ganha `avanca` (palpite de quem avança nos pênaltis).
-- - trigger de pontuação fica phase-aware: grupos 10/5, mata-mata 15/10 (+5
--   se acertar quem avança). DEVE bater com src/lib/utils.ts (calcularPontosJogo).

ALTER TABLE jogos ALTER COLUMN grupo DROP NOT NULL;
ALTER TABLE jogos ADD COLUMN IF NOT EXISTS fase text;
UPDATE jogos SET fase = 'grupos' WHERE fase IS NULL;
ALTER TABLE jogos ALTER COLUMN fase SET DEFAULT 'grupos';
ALTER TABLE jogos ADD COLUMN IF NOT EXISTS vencedor_penaltis text;

ALTER TABLE palpites ADD COLUMN IF NOT EXISTS avanca text;

-- CHECK das fases válidas (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jogos_fase_check') THEN
    ALTER TABLE jogos ADD CONSTRAINT jogos_fase_check
      CHECK (fase IN ('grupos','r32','oitavas','quartas','semis','terceiro','final'));
  END IF;
END $$;

-- Pontuação phase-aware
CREATE OR REPLACE FUNCTION recalcular_pontos_jogo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.encerrado = true AND NEW.gols_casa IS NOT NULL AND NEW.gols_fora IS NOT NULL THEN
    IF COALESCE(NEW.fase, 'grupos') = 'grupos' THEN
      -- Fase de grupos: 10 exato / 5 resultado
      UPDATE palpites SET pontos = CASE
        WHEN gols_casa = NEW.gols_casa AND gols_fora = NEW.gols_fora THEN 10
        WHEN (gols_casa > gols_fora AND NEW.gols_casa > NEW.gols_fora)
          OR (gols_casa < gols_fora AND NEW.gols_casa < NEW.gols_fora)
          OR (gols_casa = gols_fora AND NEW.gols_casa = NEW.gols_fora) THEN 5
        ELSE 0
      END
      WHERE jogo_id = NEW.id;
    ELSE
      -- Mata-mata: 15 exato / 10 resultado, +5 se acertar quem avança nos pênaltis
      UPDATE palpites SET pontos =
        CASE
          WHEN gols_casa = NEW.gols_casa AND gols_fora = NEW.gols_fora THEN 15
          WHEN (gols_casa > gols_fora AND NEW.gols_casa > NEW.gols_fora)
            OR (gols_casa < gols_fora AND NEW.gols_casa < NEW.gols_fora)
            OR (gols_casa = gols_fora AND NEW.gols_casa = NEW.gols_fora) THEN 10
          ELSE 0
        END
        + CASE
          WHEN NEW.gols_casa = NEW.gols_fora
            AND NEW.vencedor_penaltis IS NOT NULL
            AND avanca = NEW.vencedor_penaltis THEN 5
          ELSE 0
        END
      WHERE jogo_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_pontos_jogo ON jogos;
CREATE TRIGGER trigger_pontos_jogo
  AFTER UPDATE ON jogos
  FOR EACH ROW EXECUTE FUNCTION recalcular_pontos_jogo();

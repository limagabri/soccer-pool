CREATE OR REPLACE FUNCTION recalcular_pontos_jogo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.encerrado = true AND NEW.gols_casa IS NOT NULL AND NEW.gols_fora IS NOT NULL THEN
    UPDATE palpites SET pontos = CASE
      WHEN gols_casa = NEW.gols_casa AND gols_fora = NEW.gols_fora THEN 10
      WHEN (gols_casa > gols_fora AND NEW.gols_casa > NEW.gols_fora) OR
           (gols_casa < gols_fora AND NEW.gols_casa < NEW.gols_fora) OR
           (gols_casa = gols_fora AND NEW.gols_casa = NEW.gols_fora) THEN 5
      ELSE 0
    END
    WHERE jogo_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_pontos_jogo ON jogos;

CREATE TRIGGER trigger_pontos_jogo
AFTER UPDATE ON jogos
FOR EACH ROW EXECUTE FUNCTION recalcular_pontos_jogo();

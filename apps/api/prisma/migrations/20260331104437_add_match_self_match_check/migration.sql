-- Evita autocruces en partidos: local y visitante deben ser distintos.
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_home_away_different_check"
  CHECK ("homeTeamSeasonId" <> "awayTeamSeasonId");
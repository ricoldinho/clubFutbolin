-- Evita duplicados de cruce invertido (A-B y B-A)
-- dentro de la misma temporada y jornada.
CREATE UNIQUE INDEX "Match_season_round_pair_unique_idx"
ON "Match" (
  "seasonId",
  "round",
  LEAST("homeTeamSeasonId", "awayTeamSeasonId"),
  GREATEST("homeTeamSeasonId", "awayTeamSeasonId")
);
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'FINISHED', 'POSTPONED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seasonId" UUID NOT NULL,
    "homeTeamSeasonId" UUID NOT NULL,
    "awayTeamSeasonId" UUID NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "round" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_seasonId_round_idx" ON "Match"("seasonId", "round");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE INDEX "Match_homeTeamSeasonId_idx" ON "Match"("homeTeamSeasonId");

-- CreateIndex
CREATE INDEX "Match_awayTeamSeasonId_idx" ON "Match"("awayTeamSeasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_seasonId_round_homeTeamSeasonId_awayTeamSeasonId_key" ON "Match"("seasonId", "round", "homeTeamSeasonId", "awayTeamSeasonId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamSeasonId_fkey" FOREIGN KEY ("homeTeamSeasonId") REFERENCES "TeamSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamSeasonId_fkey" FOREIGN KEY ("awayTeamSeasonId") REFERENCES "TeamSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

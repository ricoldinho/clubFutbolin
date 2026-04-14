import type {
  IMatchRepository,
  MatchListFilters,
  MatchListResult,
} from '@/application/ports/matches/Match.repository';
import { Match } from '@/domain/matches/Match.entity';
import type { MatchId } from '@/domain/matches/MatchId.value-object';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';

export class InMemoryMatchRepository implements IMatchRepository {
  private readonly matches: Match[] = [];

  async existsBySeasonId(seasonId: SeasonId): Promise<boolean> {
    return this.matches.some((match) => match.seasonId.equals(seasonId));
  }

  async findById(matchId: MatchId): Promise<Match | null> {
    return this.matches.find((match) => match.id?.equals(matchId) ?? false) ?? null;
  }

  async findBySeasonId(
    seasonId: SeasonId,
    filters: MatchListFilters,
  ): Promise<MatchListResult> {
    const filteredBySeason = this.matches.filter((match) =>
      match.seasonId.equals(seasonId),
    );
    const filteredByRound =
      filters.round === undefined
        ? filteredBySeason
        : filteredBySeason.filter((match) => match.round === filters.round);

    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    const data = filteredByRound.slice(start, end);

    return {
      data,
      total: filteredByRound.length,
    };
  }

  async save(match: Match): Promise<void> {
    const index = this.matches.findIndex((stored) =>
      stored.id?.equals(match.id!) ?? false,
    );

    if (index === -1) {
      this.matches.push(match);
      return;
    }

    this.matches[index] = match;
  }

  async saveMany(matches: readonly Match[]): Promise<void> {
    for (const match of matches) {
      await this.save(match);
    }
  }

  async updateRoundDate(seasonId: SeasonId, round: number, date: Date): Promise<number> {
    let updatedCount = 0;
    for (let i = 0; i < this.matches.length; i += 1) {
      const current = this.matches[i]!;
      if (!current.seasonId.equals(seasonId) || current.round !== round) {
        continue;
      }
      this.matches[i] = Match.create({
        id: current.id!,
        seasonId: current.seasonId,
        homeTeamSeasonId: current.homeTeamSeasonId,
        awayTeamSeasonId: current.awayTeamSeasonId,
        score: current.score,
        date,
        round: current.round,
        status: current.status,
      });
      updatedCount += 1;
    }
    return updatedCount;
  }
}

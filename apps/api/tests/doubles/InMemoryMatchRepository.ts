import type {
  IMatchRepository,
  MatchListFilters,
  MatchListResult,
} from '@/application/ports/matches/Match.repository';
import type { Match } from '@/domain/matches/Match.entity';
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
}

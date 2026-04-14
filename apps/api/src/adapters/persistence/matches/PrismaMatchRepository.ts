import { PrismaClient, MatchStatus as PrismaMatchStatus } from '@prisma/client';
import type {
  IMatchRepository,
  MatchListFilters,
  MatchListResult,
} from '@/application/ports/matches/Match.repository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { MatchScore } from '@/domain/matches/MatchScore.value-object';
import { parseMatchStatus } from '@/domain/matches/MatchStatus';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';

/**
 * Implementación Prisma del repositorio de Match.
 * Mantiene mapping explícito entre filas y agregado de dominio.
 */
export class PrismaMatchRepository implements IMatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async existsBySeasonId(seasonId: SeasonId): Promise<boolean> {
    const count = await this.prisma.match.count({
      where: { seasonId: seasonId.value },
      take: 1,
    });
    return count > 0;
  }

  async findById(matchId: MatchId): Promise<Match | null> {
    const row = await this.prisma.match.findUnique({
      where: { id: matchId.value },
      select: {
        id: true,
        seasonId: true,
        homeTeamSeasonId: true,
        awayTeamSeasonId: true,
        homeScore: true,
        awayScore: true,
        date: true,
        round: true,
        status: true,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySeasonId(
    seasonId: SeasonId,
    filters: MatchListFilters,
  ): Promise<MatchListResult> {
    const where = {
      seasonId: seasonId.value,
      ...(filters.round !== undefined ? { round: filters.round } : {}),
    };
    const rows = await this.prisma.match.findMany({
      where,
      select: {
        id: true,
        seasonId: true,
        homeTeamSeasonId: true,
        awayTeamSeasonId: true,
        homeScore: true,
        awayScore: true,
        date: true,
        round: true,
        status: true,
      },
      orderBy: [{ round: 'asc' }, { date: 'asc' }, { id: 'asc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });

    const total = await this.prisma.match.count({ where });
    return {
      data: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async save(match: Match): Promise<void> {
    const id = match.id?.value ?? MatchId.generate().value;
    await this.prisma.match.upsert({
      where: { id },
      update: {
        seasonId: match.seasonId.value,
        homeTeamSeasonId: match.homeTeamSeasonId.value,
        awayTeamSeasonId: match.awayTeamSeasonId.value,
        homeScore: match.score.home,
        awayScore: match.score.away,
        date: match.date,
        round: match.round,
        status: match.status as PrismaMatchStatus,
      },
      create: {
        id,
        seasonId: match.seasonId.value,
        homeTeamSeasonId: match.homeTeamSeasonId.value,
        awayTeamSeasonId: match.awayTeamSeasonId.value,
        homeScore: match.score.home,
        awayScore: match.score.away,
        date: match.date,
        round: match.round,
        status: match.status as PrismaMatchStatus,
      },
    });
  }

  async saveMany(matches: readonly Match[]): Promise<void> {
    if (matches.length === 0) {
      return;
    }

    await this.prisma.match.createMany({
      data: matches.map((match) => ({
        id: match.id?.value ?? MatchId.generate().value,
        seasonId: match.seasonId.value,
        homeTeamSeasonId: match.homeTeamSeasonId.value,
        awayTeamSeasonId: match.awayTeamSeasonId.value,
        homeScore: match.score.home,
        awayScore: match.score.away,
        date: match.date,
        round: match.round,
        status: match.status as PrismaMatchStatus,
      })),
    });
  }

  async updateRoundDate(seasonId: SeasonId, round: number, date: Date): Promise<number> {
    const result = await this.prisma.match.updateMany({
      where: {
        seasonId: seasonId.value,
        round,
      },
      data: { date },
    });
    return result.count;
  }

  private toDomain(row: {
    id: string;
    seasonId: string;
    homeTeamSeasonId: string;
    awayTeamSeasonId: string;
    homeScore: number | null;
    awayScore: number | null;
    date: Date;
    round: number;
    status: PrismaMatchStatus;
  }): Match {
    return Match.create({
      id: MatchId.fromString(row.id),
      seasonId: SeasonId.fromString(row.seasonId),
      homeTeamSeasonId: TeamSeasonId.fromString(row.homeTeamSeasonId),
      awayTeamSeasonId: TeamSeasonId.fromString(row.awayTeamSeasonId),
      score: MatchScore.fromNullable(row.homeScore, row.awayScore),
      date: row.date,
      round: row.round,
      status: parseMatchStatus(row.status),
    });
  }
}

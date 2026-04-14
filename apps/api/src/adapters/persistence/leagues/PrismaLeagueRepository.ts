import { PrismaClient } from '@prisma/client';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { parseLeagueCategory } from '@/domain/leagues/LeagueCategory';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ILeagueRepository, LeagueListResult } from '@/application/ports/leagues/League.repository';
import type { PaginationParams } from '@/shared/pagination';

export class PrismaLeagueRepository implements ILeagueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: { id: string; name: string; leagueCategory: string }): League {
    return League.create({
      id: LeagueId.fromString(row.id),
      name: row.name,
      leagueCategory: parseLeagueCategory(row.leagueCategory),
    });
  }

  private toSeasonDomain(row: {
    id: string;
    year: number;
    leagueId: string;
    championId: string | null;
    secondId: string | null;
  }): Season {
    return Season.create({
      id: SeasonId.fromString(row.id),
      year: row.year,
      leagueId: LeagueId.fromString(row.leagueId),
      championId: row.championId ? TeamId.fromString(row.championId) : null,
      secondId: row.secondId ? TeamId.fromString(row.secondId) : null,
    });
  }

  async findById(id: LeagueId): Promise<League | null> {
    const row = await this.prisma.league.findUnique({
      where: { id: id.value },
      select: { id: true, name: true, leagueCategory: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<League[]>;
  async findAll(pagination: PaginationParams): Promise<LeagueListResult>;
  async findAll(pagination?: PaginationParams): Promise<League[] | LeagueListResult> {
    const rows = await this.prisma.league.findMany({
      select: { id: true, name: true, leagueCategory: true },
      ...(pagination
        ? {
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          }
        : {}),
      orderBy: { name: 'asc' },
    });
    if (pagination === undefined) {
      return rows.map((r) => this.toDomain(r));
    }
    const total = await this.prisma.league.count();
    return {
      data: rows.map((r) => this.toDomain(r)),
      total,
    };
  }

  async save(league: League): Promise<void> {
    const id = league.id?.value ?? LeagueId.generate().value;
    await this.prisma.league.upsert({
      where: { id },
      update: {
        name: league.name,
        leagueCategory: league.leagueCategory,
      },
      create: {
        id,
        name: league.name,
        leagueCategory: league.leagueCategory,
      },
    });
  }

  async createWithInitialSeason(league: League, year: number): Promise<Season> {
    const leagueId = league.id?.value ?? LeagueId.generate().value;
    const seasonRow = await this.prisma.$transaction(async (tx) => {
      await tx.league.create({
        data: {
          id: leagueId,
          name: league.name,
          leagueCategory: league.leagueCategory,
        },
      });
      return tx.season.create({
        data: {
          year,
          leagueId,
        },
        select: {
          id: true,
          year: true,
          leagueId: true,
          championId: true,
          secondId: true,
        },
      });
    });

    return this.toSeasonDomain(seasonRow);
  }

  async delete(id: LeagueId): Promise<void> {
    await this.prisma.league.deleteMany({
      where: { id: id.value },
    });
  }

  async countSeasonsByLeagueId(id: LeagueId): Promise<number> {
    return this.prisma.season.count({
      where: { leagueId: id.value },
    });
  }
}

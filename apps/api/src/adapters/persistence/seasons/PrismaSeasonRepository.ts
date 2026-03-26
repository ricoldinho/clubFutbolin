import { PrismaClient } from '@prisma/client';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ISeasonRepository, SeasonListResult } from '@/application/ports/seasons/Season.repository';
import type { PaginationParams } from '@/shared/pagination';

export class PrismaSeasonRepository implements ISeasonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: {
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

  async findById(id: SeasonId): Promise<Season | null> {
    const row = await this.prisma.season.findUnique({
      where: { id: id.value },
      select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Season[]>;
  async findAll(pagination: PaginationParams): Promise<SeasonListResult>;
  async findAll(pagination?: PaginationParams): Promise<Season[] | SeasonListResult> {
    const rows = await this.prisma.season.findMany({
      select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
      ...(pagination
        ? {
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          }
        : {}),
      orderBy: [{ year: 'asc' }, { id: 'asc' }],
    });
    if (pagination === undefined) {
      return rows.map((r) => this.toDomain(r));
    }
    const total = await this.prisma.season.count();
    return {
      data: rows.map((r) => this.toDomain(r)),
      total,
    };
  }

  async findByLeagueId(leagueId: LeagueId): Promise<Season[]> {
    const rows = await this.prisma.season.findMany({
      where: { leagueId: leagueId.value },
      select: { id: true, year: true, leagueId: true, championId: true, secondId: true },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(season: Season): Promise<void> {
    const id = season.id?.value ?? SeasonId.generate().value;
    await this.prisma.season.upsert({
      where: { id },
      update: {
        year: season.year,
        leagueId: season.leagueId.value,
        championId: season.championId?.value ?? null,
        secondId: season.secondId?.value ?? null,
      },
      create: {
        id,
        year: season.year,
        leagueId: season.leagueId.value,
        championId: season.championId?.value ?? null,
        secondId: season.secondId?.value ?? null,
      },
    });
  }

  async delete(id: SeasonId): Promise<void> {
    await this.prisma.season.deleteMany({
      where: { id: id.value },
    });
  }
}

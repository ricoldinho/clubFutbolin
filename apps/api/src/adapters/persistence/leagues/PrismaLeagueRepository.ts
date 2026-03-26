import { PrismaClient } from '@prisma/client';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { parseLeagueCategory } from '@/domain/leagues/LeagueCategory';
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

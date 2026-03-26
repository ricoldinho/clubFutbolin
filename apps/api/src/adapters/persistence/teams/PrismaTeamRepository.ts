import { PrismaClient } from '@prisma/client';
import { Team } from '@/domain/teams/Team.entity';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ITeamRepository, TeamListResult } from '@/application/ports/teams/Team.repository';
import type { PaginationParams } from '@/shared/pagination';

export class PrismaTeamRepository implements ITeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: { id: string; name: string; createdAt: Date }): Team {
    return Team.create({
      id: TeamId.fromString(row.id),
      name: row.name,
      createdAt: row.createdAt,
    });
  }

  async findById(id: TeamId): Promise<Team | null> {
    const row = await this.prisma.team.findUnique({
      where: { id: id.value },
      select: { id: true, name: true, createdAt: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Team | null> {
    const row = await this.prisma.team.findUnique({
      where: { name: name.trim() },
      select: { id: true, name: true, createdAt: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Team[]>;
  async findAll(pagination: PaginationParams): Promise<TeamListResult>;
  async findAll(pagination?: PaginationParams): Promise<Team[] | TeamListResult> {
    const rows = await this.prisma.team.findMany({
      select: { id: true, name: true, createdAt: true },
      ...(pagination
        ? {
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          }
        : {}),
      orderBy: { createdAt: 'asc' },
    });
    if (pagination === undefined) {
      return rows.map((r) => this.toDomain(r));
    }
    const total = await this.prisma.team.count();
    return {
      data: rows.map((r) => this.toDomain(r)),
      total,
    };
  }

  async save(team: Team): Promise<void> {
    const id = team.id?.value ?? TeamId.generate().value;
    await this.prisma.team.upsert({
      where: { id },
      update: { name: team.name },
      create: {
        id,
        name: team.name,
        createdAt: team.createdAt,
      },
    });
  }

  async delete(id: TeamId): Promise<void> {
    await this.prisma.team.deleteMany({
      where: { id: id.value },
    });
  }
}

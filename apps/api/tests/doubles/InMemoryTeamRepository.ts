import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import { Team } from '@/domain/teams/Team.entity';
import type { TeamId } from '@/domain/teams/TeamId.value-object';
import type { PaginationParams } from '@/shared/pagination';

export class InMemoryTeamRepository implements ITeamRepository {
  private readonly teams: Team[] = [];

  async findById(id: TeamId): Promise<Team | null> {
    return this.teams.find((t) => t.id?.equals(id)) ?? null;
  }

  async findByName(name: string): Promise<Team | null> {
    const normalized = name.trim().toLowerCase();
    return (
      this.teams.find((t) => t.name.toLowerCase() === normalized) ?? null
    );
  }

  async findAll(): Promise<Team[]>;
  async findAll(pagination: PaginationParams): Promise<{ data: Team[]; total: number }>;
  async findAll(pagination?: PaginationParams): Promise<Team[] | { data: Team[]; total: number }> {
    const all = [...this.teams];
    if (pagination === undefined) {
      return all;
    }
    const start = (pagination.page - 1) * pagination.limit;
    return {
      data: all.slice(start, start + pagination.limit),
      total: all.length,
    };
  }

  async save(team: Team): Promise<void> {
    const id = team.id;
    if (id === undefined) {
      this.teams.push(team);
      return;
    }
    const existing = this.teams.findIndex((t) => t.id?.equals(id));
    if (existing >= 0) {
      this.teams[existing] = team;
    } else {
      this.teams.push(team);
    }
  }

  async delete(id: TeamId): Promise<void> {
    const idx = this.teams.findIndex((t) => t.id?.equals(id));
    if (idx >= 0) this.teams.splice(idx, 1);
  }
}

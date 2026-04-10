import type { ITeamRepository, ListTeamsFilters } from '@/application/ports/teams/Team.repository';
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
  async findAll(
    pagination: PaginationParams,
    filters?: ListTeamsFilters,
  ): Promise<{ data: Team[]; total: number }>;
  async findAll(
    pagination?: PaginationParams,
    filters?: ListTeamsFilters,
  ): Promise<Team[] | { data: Team[]; total: number }> {
    const all = [...this.teams];
    if (pagination === undefined) {
      return all;
    }
    const q = filters?.searchQuery?.trim().toLowerCase();
    const filtered =
      q !== undefined && q.length > 0
        ? all.filter((t) => t.name.toLowerCase().includes(q))
        : all;
    const start = (pagination.page - 1) * pagination.limit;
    return {
      data: filtered.slice(start, start + pagination.limit),
      total: filtered.length,
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

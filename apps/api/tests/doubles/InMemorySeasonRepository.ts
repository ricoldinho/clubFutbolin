import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { Season } from '@/domain/seasons/Season.entity';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { PaginationParams } from '@/shared/pagination';

export class InMemorySeasonRepository implements ISeasonRepository {
  private readonly seasons: Season[] = [];

  async findById(id: SeasonId): Promise<Season | null> {
    return this.seasons.find((s) => s.id?.equals(id)) ?? null;
  }

  async findAll(): Promise<Season[]>;
  async findAll(pagination: PaginationParams): Promise<{ data: Season[]; total: number }>;
  async findAll(pagination?: PaginationParams): Promise<Season[] | { data: Season[]; total: number }> {
    const all = [...this.seasons];
    if (pagination === undefined) {
      return all;
    }
    const start = (pagination.page - 1) * pagination.limit;
    return {
      data: all.slice(start, start + pagination.limit),
      total: all.length,
    };
  }

  async findByLeagueId(leagueId: LeagueId): Promise<Season[]> {
    return this.seasons.filter((s) => s.leagueId.equals(leagueId));
  }

  async save(season: Season): Promise<void> {
    const id = season.id;
    if (id === undefined) {
      this.seasons.push(season);
      return;
    }
    const existing = this.seasons.findIndex((s) => s.id?.equals(id));
    if (existing >= 0) {
      this.seasons[existing] = season;
    } else {
      this.seasons.push(season);
    }
  }

  async delete(id: SeasonId): Promise<void> {
    const idx = this.seasons.findIndex((s) => s.id?.equals(id));
    if (idx >= 0) this.seasons.splice(idx, 1);
  }
}

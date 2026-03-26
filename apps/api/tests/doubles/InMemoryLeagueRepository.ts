import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { League } from '@/domain/leagues/League.entity';
import type { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import type { PaginationParams } from '@/shared/pagination';

export class InMemoryLeagueRepository implements ILeagueRepository {
  private readonly leagues: League[] = [];
  private seasonCounts = new Map<string, number>();

  async findById(id: LeagueId): Promise<League | null> {
    return this.leagues.find((l) => l.id?.equals(id)) ?? null;
  }

  async findAll(): Promise<League[]>;
  async findAll(pagination: PaginationParams): Promise<{ data: League[]; total: number }>;
  async findAll(pagination?: PaginationParams): Promise<League[] | { data: League[]; total: number }> {
    const all = [...this.leagues];
    if (pagination === undefined) {
      return all;
    }
    const start = (pagination.page - 1) * pagination.limit;
    return {
      data: all.slice(start, start + pagination.limit),
      total: all.length,
    };
  }

  async save(league: League): Promise<void> {
    const id = league.id;
    if (id === undefined) {
      this.leagues.push(league);
      return;
    }
    const existing = this.leagues.findIndex((l) => l.id?.equals(id));
    if (existing >= 0) {
      this.leagues[existing] = league;
    } else {
      this.leagues.push(league);
    }
  }

  async delete(id: LeagueId): Promise<void> {
    this.seasonCounts.delete(id.value);
    const idx = this.leagues.findIndex((l) => l.id?.equals(id));
    if (idx >= 0) this.leagues.splice(idx, 1);
  }

  async countSeasonsByLeagueId(id: LeagueId): Promise<number> {
    return this.seasonCounts.get(id.value) ?? 0;
  }

  /** Helper para tests: establecer el número de seasons de una liga. */
  setSeasonCount(leagueId: LeagueId, count: number): void {
    this.seasonCounts.set(leagueId.value, count);
  }
}

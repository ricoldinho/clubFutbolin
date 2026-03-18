import type { League } from '@/domain/leagues/League.entity';
import type { ILeagueRepository } from '@/application/ports/leagues/League.repository';
import { Result } from '@/shared/result';

/**
 * Lista todas las Leagues. Público.
 */
export class ListLeagues {
  constructor(private readonly repository: ILeagueRepository) {}

  async execute(): Promise<Result<League[], never>> {
    const leagues = await this.repository.findAll();
    return Result.ok(leagues);
  }
}

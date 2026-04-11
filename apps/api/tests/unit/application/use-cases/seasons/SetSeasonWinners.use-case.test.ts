import { describe, it, expect } from 'vitest';
import { SetSeasonWinners } from '@/application/use-cases/seasons/SetSeasonWinners.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { isOk } from '@/shared/result';

describe('SetSeasonWinners', () => {
  it('asigna campeón y subcampeón a una temporada', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const teamRepo = new InMemoryTeamRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const createResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(createResult)) throw new Error('Expected season create');
    const t1 = await saveTeamInMemory(teamRepo, 'Campeón');
    const t2 = await saveTeamInMemory(teamRepo, 'Subcampeón');

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId: createResult.value.id!,
      championId: t1.id!,
      secondId: t2.id!,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.championId?.value).toBe(t1.id!.value);
    expect(result.value.secondId?.value).toBe(t2.id!.value);
  });

  it('falla con NotFound cuando la temporada no existe', async () => {
    const seasonRepo = new InMemorySeasonRepository();
    const teamRepo = new InMemoryTeamRepository();
    const t1 = await saveTeamInMemory(teamRepo, 'T1');
    const t2 = await saveTeamInMemory(teamRepo, 'T2');
    const seasonId = SeasonId.generate();

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId,
      championId: t1.id!,
      secondId: t2.id!,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Season');
  });

  it('falla con NotFound cuando el campeón no existe', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const teamRepo = new InMemoryTeamRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const createResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(createResult)) throw new Error('Expected season create');
    const t2 = await saveTeamInMemory(teamRepo, 'Sub');
    const fakeChampionId = TeamId.generate();

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId: createResult.value.id!,
      championId: fakeChampionId,
      secondId: t2.id!,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Team');
  });

  it('falla cuando campeón y subcampeón son el mismo equipo', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const teamRepo = new InMemoryTeamRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const createResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(createResult)) throw new Error('Expected season create');
    const team = await saveTeamInMemory(teamRepo, 'Mismo');

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId: createResult.value.id!,
      championId: team.id!,
      secondId: team.id!,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('diferentes');
  });
});

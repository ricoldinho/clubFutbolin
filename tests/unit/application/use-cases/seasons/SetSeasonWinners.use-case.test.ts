import { describe, it, expect } from 'vitest';
import { SetSeasonWinners } from '@/application/use-cases/seasons/SetSeasonWinners.use-case';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
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
    const team1Result = await new CreateTeam(teamRepo).execute({ name: 'Campeón' });
    const team2Result = await new CreateTeam(teamRepo).execute({ name: 'Subcampeón' });
    if (!isOk(team1Result) || !isOk(team2Result)) throw new Error('Expected team create');

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId: createResult.value.id!,
      championId: team1Result.value.id!,
      secondId: team2Result.value.id!,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.championId?.value).toBe(team1Result.value.id!.value);
    expect(result.value.secondId?.value).toBe(team2Result.value.id!.value);
  });

  it('falla con NotFound cuando la temporada no existe', async () => {
    const seasonRepo = new InMemorySeasonRepository();
    const teamRepo = new InMemoryTeamRepository();
    const team1Result = await new CreateTeam(teamRepo).execute({ name: 'T1' });
    const team2Result = await new CreateTeam(teamRepo).execute({ name: 'T2' });
    if (!isOk(team1Result) || !isOk(team2Result)) throw new Error('Expected team create');
    const seasonId = SeasonId.generate();

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId,
      championId: team1Result.value.id!,
      secondId: team2Result.value.id!,
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
    const team2Result = await new CreateTeam(teamRepo).execute({ name: 'Sub' });
    if (!isOk(team2Result)) throw new Error('Expected team create');
    const fakeChampionId = TeamId.generate();

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId: createResult.value.id!,
      championId: fakeChampionId,
      secondId: team2Result.value.id!,
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
    const teamResult = await new CreateTeam(teamRepo).execute({ name: 'Mismo' });
    if (!isOk(teamResult)) throw new Error('Expected team create');

    const setWinners = new SetSeasonWinners(seasonRepo, teamRepo);
    const result = await setWinners.execute({
      seasonId: createResult.value.id!,
      championId: teamResult.value.id!,
      secondId: teamResult.value.id!,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('diferentes');
  });
});

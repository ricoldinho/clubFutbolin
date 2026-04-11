import { describe, it, expect } from 'vitest';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { isOk } from '@/shared/result';

describe('RegisterTeamToSeason', () => {
  it('falla con NotFound cuando el equipo no existe', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const teamRepo = new InMemoryTeamRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const seasonResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(seasonResult)) throw new Error('Expected season create');
    const teamId = TeamId.generate();

    const register = new RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
    const result = await register.execute({
      teamId,
      seasonId: seasonResult.value.id!,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Team');
  });

  it('falla con NotFound cuando la temporada no existe', async () => {
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const team = await saveTeamInMemory(teamRepo, 'Equipo X');
    const seasonId = SeasonId.generate();

    const register = new RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
    const result = await register.execute({
      teamId: team.id!,
      seasonId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('Season');
  });

  it('falla con AlreadyExists cuando el equipo ya está inscrito', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);
    const team = await saveTeamInMemory(teamRepo, 'Equipo Y');
    const seasonResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(seasonResult)) throw new Error('Expected season create');
    const register = new RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
    await register.execute({
      teamId: team.id!,
      seasonId: seasonResult.value.id!,
    });
    const duplicate = await register.execute({
      teamId: team.id!,
      seasonId: seasonResult.value.id!,
    });

    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.error.message).toContain('ya inscrito');
  });

  it('inscribe un equipo en una temporada', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }));

    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const createSeason = new CreateSeason(seasonRepo, leagueRepo);

    const team = await saveTeamInMemory(teamRepo, 'Equipo A');
    const seasonResult = await createSeason.execute({ year: 2025, leagueId });
    if (!isOk(seasonResult)) throw new Error('Expected season create to succeed');

    const register = new RegisterTeamToSeason(rosterRepo, teamRepo, seasonRepo);
    const result = await register.execute({
      teamId: team.id!,
      seasonId: seasonResult.value.id!,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.teamId.value).toBe(team.id!.value);
    expect(result.value.members).toHaveLength(0);
  });
});

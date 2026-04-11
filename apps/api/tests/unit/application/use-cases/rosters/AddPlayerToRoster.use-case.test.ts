import { describe, it, expect } from 'vitest';
import { AddPlayerToRoster } from '@/application/use-cases/rosters/AddPlayerToRoster.use-case';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { isOk } from '@/shared/result';

describe('AddPlayerToRoster', () => {
  it('añade un jugador a la plantilla', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();

    const team = await saveTeamInMemory(teamRepo, 'Equipo A');
    const seasonResult = await new CreateSeason(seasonRepo, leagueRepo).execute({
      year: 2025,
      leagueId,
    });
    if (!isOk(seasonResult)) throw new Error('Expected season create');
    const regResult = await new RegisterTeamToSeason(
      rosterRepo,
      teamRepo,
      seasonRepo,
    ).execute({ teamId: team.id!, seasonId: seasonResult.value.id! });
    if (!isOk(regResult)) throw new Error('Expected register');
    const teamSeasonId = regResult.value.teamSeasonId;
    const playerId = PlayerId.generate();

    const addPlayer = new AddPlayerToRoster(rosterRepo);
    const result = await addPlayer.execute({
      teamSeasonId,
      playerId,
      position: 'PORTERO',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.members).toHaveLength(1);
    expect(result.value.members[0].playerId.equals(playerId)).toBe(true);
  });

  it('falla con NotFound cuando el roster no existe', async () => {
    const rosterRepo = new InMemoryRosterRepository();
    const teamSeasonId = TeamSeasonId.generate();
    const playerId = PlayerId.generate();

    const addPlayer = new AddPlayerToRoster(rosterRepo);
    const result = await addPlayer.execute({
      teamSeasonId,
      playerId,
      position: 'DELANTERO',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('TeamSeason');
  });

  it('falla cuando la plantilla ya tiene 4 jugadores', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();

    const team = await saveTeamInMemory(teamRepo, 'Equipo B');
    const seasonResult = await new CreateSeason(seasonRepo, leagueRepo).execute({
      year: 2025,
      leagueId,
    });
    if (!isOk(seasonResult)) throw new Error('Expected season create');
    const regResult = await new RegisterTeamToSeason(
      rosterRepo,
      teamRepo,
      seasonRepo,
    ).execute({ teamId: team.id!, seasonId: seasonResult.value.id! });
    if (!isOk(regResult)) throw new Error('Expected register');

    const addPlayer = new AddPlayerToRoster(rosterRepo);
    let roster = regResult.value;
    for (let i = 0; i < 4; i++) {
      const r = await addPlayer.execute({
        teamSeasonId: roster.teamSeasonId,
        playerId: PlayerId.generate(),
        position: i === 0 ? 'PORTERO' : 'DELANTERO',
      });
      if (!isOk(r)) throw new Error('Expected add success');
      roster = r.value;
    }

    const fifth = await addPlayer.execute({
      teamSeasonId: roster.teamSeasonId,
      playerId: PlayerId.generate(),
      position: 'DELANTERO',
    });

    expect(fifth.ok).toBe(false);
    if (fifth.ok) return;
    expect(fifth.error.message).toContain('4 jugadores');
  });

  it('falla cuando el jugador ya está en la plantilla', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();

    const team = await saveTeamInMemory(teamRepo, 'Equipo C');
    const seasonResult = await new CreateSeason(seasonRepo, leagueRepo).execute({
      year: 2025,
      leagueId,
    });
    if (!isOk(seasonResult)) throw new Error('Expected season create');
    const regResult = await new RegisterTeamToSeason(
      rosterRepo,
      teamRepo,
      seasonRepo,
    ).execute({ teamId: team.id!, seasonId: seasonResult.value.id! });
    if (!isOk(regResult)) throw new Error('Expected register');
    const teamSeasonId = regResult.value.teamSeasonId;
    const playerId = PlayerId.generate();

    const addPlayer = new AddPlayerToRoster(rosterRepo);
    await addPlayer.execute({
      teamSeasonId,
      playerId,
      position: 'PORTERO',
    });
    const duplicate = await addPlayer.execute({
      teamSeasonId,
      playerId,
      position: 'DELANTERO',
    });

    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.error.message).toContain('ya está en la plantilla');
  });
});

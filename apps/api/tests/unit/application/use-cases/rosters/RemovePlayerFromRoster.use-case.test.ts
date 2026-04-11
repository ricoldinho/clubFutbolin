import { describe, it, expect } from 'vitest';
import { RemovePlayerFromRoster } from '@/application/use-cases/rosters/RemovePlayerFromRoster.use-case';
import { AddPlayerToRoster } from '@/application/use-cases/rosters/AddPlayerToRoster.use-case';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryLeagueRepository } from '../../../../doubles/InMemoryLeagueRepository';
import { saveTeamInMemory } from '../../../../doubles/saveTeamInMemory';
import { CreateSeason } from '@/application/use-cases/seasons/CreateSeason.use-case';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { League } from '@/domain/leagues/League.entity';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { isOk } from '@/shared/result';

describe('RemovePlayerFromRoster', () => {
  it('elimina un jugador de la plantilla', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();

    const team = await saveTeamInMemory(teamRepo, 'Equipo D');
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
    const addResult = await addPlayer.execute({
      teamSeasonId,
      playerId,
      position: 'PORTERO',
    });
    if (!isOk(addResult)) throw new Error('Expected add');
    const finalTsId = addResult.value.teamSeasonId;

    const removePlayer = new RemovePlayerFromRoster(rosterRepo);
    const result = await removePlayer.execute({
      teamSeasonId: finalTsId,
      playerId,
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.members).toHaveLength(0);
  });

  it('falla con NotFound cuando el roster no existe', async () => {
    const rosterRepo = new InMemoryRosterRepository();
    const teamSeasonId = TeamSeasonId.generate();
    const playerId = PlayerId.generate();

    const removePlayer = new RemovePlayerFromRoster(rosterRepo);
    const result = await removePlayer.execute({
      teamSeasonId,
      playerId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('TeamSeason');
  });

  it('falla cuando el jugador no está en la plantilla', async () => {
    const leagueRepo = new InMemoryLeagueRepository();
    const leagueId = LeagueId.generate();
    await leagueRepo.save(
      League.create({ id: leagueId, name: 'Liga X', leagueCategory: 'PRIMERA' }),
    );
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();

    const team = await saveTeamInMemory(teamRepo, 'Equipo E');
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
    const playerInRoster = PlayerId.generate();
    const playerNotInRoster = PlayerId.generate();

    const addPlayer = new AddPlayerToRoster(rosterRepo);
    const addResult = await addPlayer.execute({
      teamSeasonId,
      playerId: playerInRoster,
      position: 'PORTERO',
    });
    if (!isOk(addResult)) throw new Error('Expected add');

    const removePlayer = new RemovePlayerFromRoster(rosterRepo);
    const result = await removePlayer.execute({
      teamSeasonId: addResult.value.teamSeasonId,
      playerId: playerNotInRoster,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('no está en la plantilla');
  });
});

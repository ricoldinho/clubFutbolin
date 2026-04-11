import { describe, it, expect } from 'vitest';
import { CreateTeam } from '@/application/use-cases/teams/CreateTeam.use-case';
import { InMemoryTeamRepository } from '../../../../doubles/InMemoryTeamRepository';
import { InMemorySeasonRepository } from '../../../../doubles/InMemorySeasonRepository';
import { InMemoryRosterRepository } from '../../../../doubles/InMemoryRosterRepository';
import { InMemoryPlayerRepository } from '../../../../doubles/InMemoryPlayerRepository';
import { buildCreateTeamUseCase } from '../../../../doubles/buildCreateTeamUseCase';
import { AlreadyExistsError, NotFoundError } from '@/domain/shared/errors';
import { isOk } from '@/shared/result';
import { TeamId } from '@/domain/teams/TeamId.value-object';
import { Season } from '@/domain/seasons/Season.entity';
import { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { LeagueId } from '@/domain/leagues/LeagueId.value-object';
import { Player } from '@/domain/players/Player.entity';
import { PlayerCategory } from '@/domain/players/PlayerCategory';
import { PlayerRole } from '@/domain/players/PlayerRole';
import { Email } from '@/domain/players/value-objects/Email.value-object';
import { PhoneNumber } from '@/domain/players/value-objects/PhoneNumber.value-object';
import { Birthdate } from '@/domain/players/value-objects/Birthdate.value-object';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';

const P1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const P2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

async function seedSeasonAndPlayers(
  seasonRepo: InMemorySeasonRepository,
  playerRepo: InMemoryPlayerRepository,
): Promise<void> {
  const leagueId = LeagueId.generate();
  await seasonRepo.save(
    Season.create({
      id: SeasonId.generate(),
      year: 2026,
      leagueId,
    }),
  );
  await playerRepo.save(
    Player.create({
      id: PlayerId.fromString(P1),
      name: 'A',
      lastname: 'Uno',
      nickname: null,
      email: Email.create('ct-p1@test.local'),
      phoneNumber: PhoneNumber.create('600000011'),
      birthdate: Birthdate.create('2000-01-01'),
      category: PlayerCategory.PRIMERA,
      role: PlayerRole.USER,
    }),
    'h',
  );
  await playerRepo.save(
    Player.create({
      id: PlayerId.fromString(P2),
      name: 'B',
      lastname: 'Dos',
      nickname: null,
      email: Email.create('ct-p2@test.local'),
      phoneNumber: PhoneNumber.create('600000012'),
      birthdate: Birthdate.create('2001-01-01'),
      category: PlayerCategory.PRIMERA,
      role: PlayerRole.USER,
    }),
    'h',
  );
}

describe('CreateTeam', () => {
  it('crea un equipo, lo inscribe en la última temporada y añade la plantilla inicial', async () => {
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const playerRepo = new InMemoryPlayerRepository();
    await seedSeasonAndPlayers(seasonRepo, playerRepo);
    const createTeam = buildCreateTeamUseCase({
      teamRepository: teamRepo,
      seasonRepository: seasonRepo,
      rosterRepository: rosterRepo,
      playerRepository: playerRepo,
    });

    const result = await createTeam.execute({
      name: 'Equipo A',
      playerIds: [P1, P2],
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe('Equipo A');
    expect(result.value.id).toBeInstanceOf(TeamId);
    const season = (await seasonRepo.findLatestByYear())!;
    const roster = await rosterRepo.findTeamSeasonByTeamAndSeason(result.value.id!, season.id!);
    expect(roster).not.toBeNull();
    expect(roster!.members).toHaveLength(2);
  });

  it('devuelve Result.fail(AlreadyExistsError) cuando ya existe un equipo con el mismo nombre', async () => {
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const playerRepo = new InMemoryPlayerRepository();
    await seedSeasonAndPlayers(seasonRepo, playerRepo);
    const createTeam = buildCreateTeamUseCase({
      teamRepository: teamRepo,
      seasonRepository: seasonRepo,
      rosterRepository: rosterRepo,
      playerRepository: playerRepo,
    });
    await createTeam.execute({ name: 'Equipo A', playerIds: [P1, P2] });

    const result = await createTeam.execute({ name: 'Equipo A', playerIds: [P1, P2] });

    expect(isOk(result)).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyExistsError);
  });

  it('falla si hay menos de 2 jugadores distintos', async () => {
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const playerRepo = new InMemoryPlayerRepository();
    await seedSeasonAndPlayers(seasonRepo, playerRepo);
    const createTeam = buildCreateTeamUseCase({
      teamRepository: teamRepo,
      seasonRepository: seasonRepo,
      rosterRepository: rosterRepo,
      playerRepository: playerRepo,
    });

    const result = await createTeam.execute({ name: 'X', playerIds: [P1] });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('2');
  });

  it('falla con NotFound si un jugador no existe', async () => {
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const playerRepo = new InMemoryPlayerRepository();
    await seedSeasonAndPlayers(seasonRepo, playerRepo);
    const createTeam = buildCreateTeamUseCase({
      teamRepository: teamRepo,
      seasonRepository: seasonRepo,
      rosterRepository: rosterRepo,
      playerRepository: playerRepo,
    });
    const missing = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    const result = await createTeam.execute({ name: 'Y', playerIds: [P1, missing] });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('falla si no hay ninguna temporada', async () => {
    const teamRepo = new InMemoryTeamRepository();
    const seasonRepo = new InMemorySeasonRepository();
    const rosterRepo = new InMemoryRosterRepository();
    const playerRepo = new InMemoryPlayerRepository();
    await playerRepo.save(
      Player.create({
        id: PlayerId.fromString(P1),
        name: 'A',
        lastname: 'Uno',
        nickname: null,
        email: Email.create('ct-p1b@test.local'),
        phoneNumber: PhoneNumber.create('600000013'),
        birthdate: Birthdate.create('2000-01-01'),
        category: PlayerCategory.PRIMERA,
        role: PlayerRole.USER,
      }),
      'h',
    );
    await playerRepo.save(
      Player.create({
        id: PlayerId.fromString(P2),
        name: 'B',
        lastname: 'Dos',
        nickname: null,
        email: Email.create('ct-p2b@test.local'),
        phoneNumber: PhoneNumber.create('600000014'),
        birthdate: Birthdate.create('2001-01-01'),
        category: PlayerCategory.PRIMERA,
        role: PlayerRole.USER,
      }),
      'h',
    );
    const createTeam = buildCreateTeamUseCase({
      teamRepository: teamRepo,
      seasonRepository: seasonRepo,
      rosterRepository: rosterRepo,
      playerRepository: playerRepo,
    });

    const result = await createTeam.execute({ name: 'Z', playerIds: [P1, P2] });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('temporadas');
  });
});

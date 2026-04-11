import { TeamId } from '@/domain/teams/TeamId.value-object';
import type { ITeamRepository } from '@/application/ports/teams/Team.repository';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { IPlayerRepository } from '@/application/ports/players/Player.repository';
import { RegisterTeamToSeason } from '@/application/use-cases/rosters/RegisterTeamToSeason.use-case';
import { AddPlayerToRoster } from '@/application/use-cases/rosters/AddPlayerToRoster.use-case';
import { PlayerId } from '@/domain/players/value-objects/PlayerId.value-object';
import { Team } from '@/domain/teams/Team.entity';
import { AlreadyExistsError, DomainValidationError, NotFoundError } from '@/domain/shared/errors';
import { Result } from '@/shared/result';
import type { Position } from '@/domain/rosters/Position';

const MIN_INITIAL_PLAYERS = 2;
/** Misma capacidad que la plantilla en una temporada. */
const MAX_INITIAL_PLAYERS = 4;

const POSITION_CYCLE: readonly Position[] = ['DELANTERO', 'PORTERO', 'DELANTERO', 'PORTERO'];

export type CreateTeamInput = {
  name: string;
  playerIds: readonly string[];
};

type CreateTeamError = AlreadyExistsError | DomainValidationError | NotFoundError;

/**
 * Crea un nuevo Team e inscribe la plantilla inicial en la temporada más reciente (por año).
 * Solo ADMIN. Requiere al menos dos jugadores distintos existentes.
 * Si ya existe un equipo con el mismo nombre, devuelve AlreadyExistsError (409).
 */
export class CreateTeam {
  constructor(
    private readonly teamRepository: ITeamRepository,
    private readonly seasonRepository: ISeasonRepository,
    private readonly rosterRepository: IRosterRepository,
    private readonly playerRepository: IPlayerRepository,
    private readonly registerTeamToSeason: RegisterTeamToSeason,
    private readonly addPlayerToRoster: AddPlayerToRoster,
  ) {}

  async execute(input: CreateTeamInput): Promise<Result<Team, CreateTeamError>> {
    const uniqueIds = [...new Set(input.playerIds.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length < MIN_INITIAL_PLAYERS) {
      return Result.fail(
        new DomainValidationError(
          `Debes asociar al menos ${MIN_INITIAL_PLAYERS} jugadores distintos al crear el equipo`,
        ),
      );
    }
    if (uniqueIds.length > MAX_INITIAL_PLAYERS) {
      return Result.fail(
        new DomainValidationError(
          `Como máximo ${MAX_INITIAL_PLAYERS} jugadores en la plantilla inicial`,
        ),
      );
    }

    let playerIdsVo: PlayerId[];
    try {
      playerIdsVo = uniqueIds.map((id) => PlayerId.fromString(id));
    } catch (err) {
      if (err instanceof DomainValidationError) {
        return Result.fail(err);
      }
      throw err;
    }

    for (const pid of playerIdsVo) {
      const player = await this.playerRepository.findById(pid);
      if (player === null) {
        return Result.fail(new NotFoundError('Player', pid.value));
      }
    }

    const season = await this.seasonRepository.findLatestByYear();
    if (season === null || season.id === undefined) {
      return Result.fail(
        new DomainValidationError(
          'No hay temporadas en el sistema. Crea al menos una temporada antes de registrar equipos con plantilla.',
        ),
      );
    }

    const trimmedName = input.name.trim();
    if (trimmedName.length === 0) {
      return Result.fail(new DomainValidationError('El nombre del equipo no puede estar vacío'));
    }

    const existing = await this.teamRepository.findByName(trimmedName);
    if (existing !== null) {
      return Result.fail(new AlreadyExistsError('Team', `nombre "${trimmedName}"`));
    }

    const team = Team.create({
      id: TeamId.generate(),
      name: trimmedName,
    });
    await this.teamRepository.save(team);

    const registerResult = await this.registerTeamToSeason.execute({
      teamId: team.id!,
      seasonId: season.id,
    });
    if (!registerResult.ok) {
      return Result.fail(registerResult.error);
    }

    const { teamSeasonId } = registerResult.value;

    for (let i = 0; i < playerIdsVo.length; i += 1) {
      const addResult = await this.addPlayerToRoster.execute({
        teamSeasonId,
        playerId: playerIdsVo[i]!,
        position: POSITION_CYCLE[i % POSITION_CYCLE.length]!,
      });
      if (!addResult.ok) {
        return Result.fail(addResult.error);
      }
    }

    return Result.ok(team);
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTeam = void 0;
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
const Team_entity_1 = require("@/domain/teams/Team.entity");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
const MIN_INITIAL_PLAYERS = 2;
/** Misma capacidad que la plantilla en una temporada. */
const MAX_INITIAL_PLAYERS = 4;
const POSITION_CYCLE = ['DELANTERO', 'PORTERO', 'DELANTERO', 'PORTERO'];
/**
 * Crea un nuevo Team e inscribe la plantilla inicial en la temporada más reciente (por año).
 * Solo ADMIN. Requiere al menos dos jugadores distintos existentes.
 * Si ya existe un equipo con el mismo nombre, devuelve AlreadyExistsError (409).
 */
class CreateTeam {
    constructor(teamRepository, seasonRepository, rosterRepository, playerRepository, registerTeamToSeason, addPlayerToRoster) {
        this.teamRepository = teamRepository;
        this.seasonRepository = seasonRepository;
        this.rosterRepository = rosterRepository;
        this.playerRepository = playerRepository;
        this.registerTeamToSeason = registerTeamToSeason;
        this.addPlayerToRoster = addPlayerToRoster;
    }
    async execute(input) {
        const uniqueIds = [...new Set(input.playerIds.map((id) => id.trim()).filter(Boolean))];
        if (uniqueIds.length < MIN_INITIAL_PLAYERS) {
            return result_1.Result.fail(new errors_1.DomainValidationError(`Debes asociar al menos ${MIN_INITIAL_PLAYERS} jugadores distintos al crear el equipo`));
        }
        if (uniqueIds.length > MAX_INITIAL_PLAYERS) {
            return result_1.Result.fail(new errors_1.DomainValidationError(`Como máximo ${MAX_INITIAL_PLAYERS} jugadores en la plantilla inicial`));
        }
        let playerIdsVo;
        try {
            playerIdsVo = uniqueIds.map((id) => PlayerId_value_object_1.PlayerId.fromString(id));
        }
        catch (err) {
            if (err instanceof errors_1.DomainValidationError) {
                return result_1.Result.fail(err);
            }
            throw err;
        }
        for (const pid of playerIdsVo) {
            const player = await this.playerRepository.findById(pid);
            if (player === null) {
                return result_1.Result.fail(new errors_1.NotFoundError('Player', pid.value));
            }
        }
        const season = await this.seasonRepository.findLatestByYear();
        if (season === null || season.id === undefined) {
            return result_1.Result.fail(new errors_1.DomainValidationError('No hay temporadas en el sistema. Crea al menos una temporada antes de registrar equipos con plantilla.'));
        }
        const trimmedName = input.name.trim();
        if (trimmedName.length === 0) {
            return result_1.Result.fail(new errors_1.DomainValidationError('El nombre del equipo no puede estar vacío'));
        }
        const existing = await this.teamRepository.findByName(trimmedName);
        if (existing !== null) {
            return result_1.Result.fail(new errors_1.AlreadyExistsError('Team', `nombre "${trimmedName}"`));
        }
        const team = Team_entity_1.Team.create({
            id: TeamId_value_object_1.TeamId.generate(),
            name: trimmedName,
        });
        await this.teamRepository.save(team);
        const registerResult = await this.registerTeamToSeason.execute({
            teamId: team.id,
            seasonId: season.id,
        });
        if (!registerResult.ok) {
            return result_1.Result.fail(registerResult.error);
        }
        const { teamSeasonId } = registerResult.value;
        for (let i = 0; i < playerIdsVo.length; i += 1) {
            const addResult = await this.addPlayerToRoster.execute({
                teamSeasonId,
                playerId: playerIdsVo[i],
                position: POSITION_CYCLE[i % POSITION_CYCLE.length],
            });
            if (!addResult.ok) {
                return result_1.Result.fail(addResult.error);
            }
        }
        return result_1.Result.ok(team);
    }
}
exports.CreateTeam = CreateTeam;

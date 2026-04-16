"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterTeamToSeason = void 0;
const TeamRoster_entity_1 = require("@/domain/rosters/TeamRoster.entity");
const TeamSeasonId_value_object_1 = require("@/domain/rosters/TeamSeasonId.value-object");
const errors_1 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Inscribe un equipo en una temporada. Solo ADMIN.
 */
class RegisterTeamToSeason {
    constructor(rosterRepository, teamRepository, seasonRepository) {
        this.rosterRepository = rosterRepository;
        this.teamRepository = teamRepository;
        this.seasonRepository = seasonRepository;
    }
    async execute(input) {
        const team = await this.teamRepository.findById(input.teamId);
        if (team === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Team', input.teamId.value));
        }
        const season = await this.seasonRepository.findById(input.seasonId);
        if (season === null) {
            return result_1.Result.fail(new errors_1.NotFoundError('Season', input.seasonId.value));
        }
        const existing = await this.rosterRepository.findTeamSeasonByTeamAndSeason(input.teamId, input.seasonId);
        if (existing !== null) {
            return result_1.Result.fail(new errors_1.AlreadyExistsError('TeamSeason', `equipo ya inscrito en esta temporada`));
        }
        const roster = TeamRoster_entity_1.TeamRoster.create({
            teamSeasonId: TeamSeasonId_value_object_1.TeamSeasonId.generate(),
            teamId: input.teamId,
            seasonId: input.seasonId,
        });
        await this.rosterRepository.saveTeamSeason(roster);
        return result_1.Result.ok(roster);
    }
}
exports.RegisterTeamToSeason = RegisterTeamToSeason;

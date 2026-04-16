"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCreateTeamUseCase = buildCreateTeamUseCase;
const CreateTeam_use_case_1 = require("@/application/use-cases/teams/CreateTeam.use-case");
const RegisterTeamToSeason_use_case_1 = require("@/application/use-cases/rosters/RegisterTeamToSeason.use-case");
const AddPlayerToRoster_use_case_1 = require("@/application/use-cases/rosters/AddPlayerToRoster.use-case");
function buildCreateTeamUseCase(deps) {
    const registerTeamToSeason = new RegisterTeamToSeason_use_case_1.RegisterTeamToSeason(deps.rosterRepository, deps.teamRepository, deps.seasonRepository);
    const addPlayerToRoster = new AddPlayerToRoster_use_case_1.AddPlayerToRoster(deps.rosterRepository);
    return new CreateTeam_use_case_1.CreateTeam(deps.teamRepository, deps.seasonRepository, deps.rosterRepository, deps.playerRepository, registerTeamToSeason, addPlayerToRoster);
}

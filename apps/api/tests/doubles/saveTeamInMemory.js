"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTeamInMemory = saveTeamInMemory;
const Team_entity_1 = require("@/domain/teams/Team.entity");
const TeamId_value_object_1 = require("@/domain/teams/TeamId.value-object");
/** Persiste un equipo sin plantilla (tests que no usan CreateTeam completo). */
async function saveTeamInMemory(teamRepo, name) {
    const team = Team_entity_1.Team.create({ id: TeamId_value_object_1.TeamId.generate(), name });
    await teamRepo.save(team);
    return team;
}

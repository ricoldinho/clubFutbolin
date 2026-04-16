"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRoster = void 0;
const RosterMember_1 = require("./RosterMember");
const errors_1 = require("@/domain/shared/errors");
const MAX_ROSTER_SIZE = 4;
/**
 * Aggregate Root que maneja la plantilla de un equipo en una temporada.
 * Reglas: máximo 4 jugadores, sin duplicados.
 */
class TeamRoster {
    constructor(props) {
        this.teamSeasonId = props.teamSeasonId;
        this.teamId = props.teamId;
        this.seasonId = props.seasonId;
        this._members = props.members ? [...props.members] : [];
    }
    static create(props) {
        return new TeamRoster(props);
    }
    get members() {
        return [...this._members];
    }
    addPlayer(playerId, position) {
        if (this._members.length >= MAX_ROSTER_SIZE) {
            throw new errors_1.DomainValidationError(`La plantilla no puede tener más de ${MAX_ROSTER_SIZE} jugadores`);
        }
        const newMember = RosterMember_1.RosterMember.create({ playerId, position });
        const isDuplicate = this._members.some((m) => m.hasSamePlayerAs(newMember));
        if (isDuplicate) {
            throw new errors_1.DomainValidationError('El jugador ya está en la plantilla');
        }
        return TeamRoster.create({
            teamSeasonId: this.teamSeasonId,
            teamId: this.teamId,
            seasonId: this.seasonId,
            members: [...this._members, newMember],
        });
    }
    removePlayer(playerId) {
        const filtered = this._members.filter((m) => !m.playerId.equals(playerId));
        if (filtered.length === this._members.length) {
            throw new errors_1.DomainValidationError('El jugador no está en la plantilla');
        }
        return TeamRoster.create({
            teamSeasonId: this.teamSeasonId,
            teamId: this.teamId,
            seasonId: this.seasonId,
            members: filtered,
        });
    }
}
exports.TeamRoster = TeamRoster;

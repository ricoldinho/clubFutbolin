"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const MatchScore_value_object_1 = require("./MatchScore.value-object");
const MatchStatus_1 = require("./MatchStatus");
const errors_1 = require("./errors");
const errors_2 = require("@/domain/shared/errors");
/**
 * Aggregate Root del partido.
 * Invariantes:
 * - local y visitante deben ser distintos.
 * - no se puede actualizar el marcador si el partido está cancelado.
 * - al actualizar marcador válido el estado pasa a FINISHED.
 */
class Match {
    constructor(props) {
        const withId = props;
        if (withId.id !== undefined) {
            this.id = withId.id;
        }
        if (props.homeTeamSeasonId.equals(props.awayTeamSeasonId)) {
            throw new errors_1.MatchTeamsMustBeDifferentError();
        }
        if (!Number.isInteger(props.round) || props.round <= 0) {
            throw new errors_2.DomainValidationError('La jornada debe ser un entero mayor que 0');
        }
        this.seasonId = props.seasonId;
        this.homeTeamSeasonId = props.homeTeamSeasonId;
        this.awayTeamSeasonId = props.awayTeamSeasonId;
        this.score = props.score ?? MatchScore_value_object_1.MatchScore.pending();
        this.date = new Date(props.date);
        this.round = props.round;
        this.status = props.status ?? MatchStatus_1.MatchStatus.SCHEDULED;
    }
    static create(props) {
        return new Match(props);
    }
    updateScore(home, away) {
        if (this.status === MatchStatus_1.MatchStatus.CANCELLED) {
            throw new errors_1.MatchScoreUpdateNotAllowedError();
        }
        return Match.create({
            ...(this.id && { id: this.id }),
            seasonId: this.seasonId,
            homeTeamSeasonId: this.homeTeamSeasonId,
            awayTeamSeasonId: this.awayTeamSeasonId,
            date: this.date,
            round: this.round,
            score: MatchScore_value_object_1.MatchScore.fromResult(home, away),
            status: MatchStatus_1.MatchStatus.FINISHED,
        });
    }
    updateStatus(status) {
        return Match.create({
            ...(this.id && { id: this.id }),
            seasonId: this.seasonId,
            homeTeamSeasonId: this.homeTeamSeasonId,
            awayTeamSeasonId: this.awayTeamSeasonId,
            date: this.date,
            round: this.round,
            score: this.score,
            status,
        });
    }
}
exports.Match = Match;

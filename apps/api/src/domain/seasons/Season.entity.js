"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Season = void 0;
const errors_1 = require("@/domain/shared/errors");
class Season {
    constructor(props) {
        const withId = props;
        if (withId.id !== undefined) {
            this.id = withId.id;
        }
        this.year = props.year;
        this.leagueId = props.leagueId;
        this.championId = props.championId ?? null;
        this.secondId = props.secondId ?? null;
    }
    static create(props) {
        return new Season(props);
    }
    /**
     * Asigna campeón y subcampeón. Regla: ambos ids deben ser diferentes.
     */
    setWinners(championId, secondId) {
        if (championId.equals(secondId)) {
            throw new errors_1.DomainValidationError('El campeón y subcampeón deben ser equipos diferentes');
        }
        return Season.create({
            ...(this.id && { id: this.id }),
            year: this.year,
            leagueId: this.leagueId,
            championId,
            secondId,
        });
    }
}
exports.Season = Season;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchScore = void 0;
const errors_1 = require("./errors");
class MatchScore {
    constructor(home, away) {
        this._home = home;
        this._away = away;
    }
    static pending() {
        return new MatchScore(null, null);
    }
    static fromNullable(home, away) {
        if (home === null && away === null) {
            return MatchScore.pending();
        }
        if (home === null || away === null) {
            throw new errors_1.InvalidMatchScoreError('El marcador debe tener ambos valores o ambos en null');
        }
        MatchScore.validateScore(home);
        MatchScore.validateScore(away);
        return new MatchScore(home, away);
    }
    static fromResult(home, away) {
        MatchScore.validateScore(home);
        MatchScore.validateScore(away);
        return new MatchScore(home, away);
    }
    get home() {
        return this._home;
    }
    get away() {
        return this._away;
    }
    hasResult() {
        return this._home !== null && this._away !== null;
    }
    static validateScore(score) {
        if (!Number.isInteger(score)) {
            throw new errors_1.InvalidMatchScoreError('El marcador debe ser un entero');
        }
        if (score < 0) {
            throw new errors_1.InvalidMatchScoreError('El marcador no puede ser negativo');
        }
    }
}
exports.MatchScore = MatchScore;

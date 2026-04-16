"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchStatus = void 0;
exports.isMatchStatus = isMatchStatus;
exports.parseMatchStatus = parseMatchStatus;
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["SCHEDULED"] = "SCHEDULED";
    MatchStatus["FINISHED"] = "FINISHED";
    MatchStatus["POSTPONED"] = "POSTPONED";
    MatchStatus["CANCELLED"] = "CANCELLED";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
const VALID_MATCH_STATUSES = Object.values(MatchStatus);
function isMatchStatus(value) {
    return VALID_MATCH_STATUSES.includes(value);
}
function parseMatchStatus(value) {
    if (!isMatchStatus(value)) {
        throw new Error(`Estado de partido inválido: ${value}. Debe ser uno de: ${VALID_MATCH_STATUSES.join(', ')}`);
    }
    return value;
}

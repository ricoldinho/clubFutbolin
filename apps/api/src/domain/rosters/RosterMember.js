"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RosterMember = void 0;
class RosterMember {
    constructor(props) {
        this.playerId = props.playerId;
        this.position = props.position;
    }
    static create(props) {
        return new RosterMember(props);
    }
    hasSamePlayerAs(other) {
        return this.playerId.equals(other.playerId);
    }
}
exports.RosterMember = RosterMember;

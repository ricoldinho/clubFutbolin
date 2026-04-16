"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
class Team {
    constructor(props) {
        const withId = props;
        if (withId.id !== undefined) {
            this.id = withId.id;
        }
        this.name = props.name;
        this.createdAt = props.createdAt ?? new Date();
    }
    static create(props) {
        return new Team(props);
    }
}
exports.Team = Team;

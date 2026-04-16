"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.League = void 0;
class League {
    constructor(props) {
        const withId = props;
        if (withId.id !== undefined) {
            this.id = withId.id;
        }
        this.name = props.name;
        this.leagueCategory = props.leagueCategory;
    }
    static create(props) {
        return new League(props);
    }
}
exports.League = League;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(props) {
        const withId = props;
        if (withId.id !== undefined) {
            this.id = withId.id;
        }
        this.name = props.name;
        this.lastname = props.lastname;
        this.nickname = props.nickname;
        this.email = props.email;
        this.phoneNumber = props.phoneNumber;
        this.birthdate = props.birthdate;
        this.category = props.category;
        this.role = props.role;
    }
    static create(props) {
        return new Player(props);
    }
    get fullName() {
        return `${this.name} ${this.lastname}`.trim();
    }
}
exports.Player = Player;

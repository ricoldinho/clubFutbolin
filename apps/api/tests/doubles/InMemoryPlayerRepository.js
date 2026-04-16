"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryPlayerRepository = void 0;
const Player_entity_1 = require("@/domain/players/Player.entity");
const PlayerId_value_object_1 = require("@/domain/players/value-objects/PlayerId.value-object");
/**
 * Fake del repositorio de Player para tests. Almacena en memoria; findByEmail por valor de email.
 * Guarda passwordHash en un mapa aparte para findLoginDataByEmail.
 */
class InMemoryPlayerRepository {
    constructor() {
        this.players = [];
        this.passwordHashes = new Map();
    }
    async findByEmail(email) {
        return this.players.find((p) => p.email.equals(email)) ?? null;
    }
    async findById(id) {
        return this.players.find((p) => p.id?.equals(id)) ?? null;
    }
    async findAll(pagination, filters) {
        const all = [...this.players];
        if (pagination === undefined) {
            return all;
        }
        const q = filters?.searchQuery?.trim().toLowerCase();
        const filtered = q !== undefined && q.length > 0
            ? all.filter((p) => {
                const nick = p.nickname?.toLowerCase() ?? '';
                return (p.name.toLowerCase().includes(q) ||
                    p.lastname.toLowerCase().includes(q) ||
                    nick.includes(q));
            })
            : all;
        const start = (pagination.page - 1) * pagination.limit;
        return {
            data: filtered.slice(start, start + pagination.limit),
            total: filtered.length,
        };
    }
    async findLoginDataByEmail(email) {
        const player = this.players.find((p) => p.email.equals(email));
        if (!player?.id)
            return null;
        const hash = this.passwordHashes.get(player.id.value);
        if (hash === undefined)
            return null;
        return {
            playerId: player.id,
            role: player.role,
            passwordHash: hash,
        };
    }
    async save(player, passwordHash) {
        const id = player.id;
        if (!id) {
            const newId = PlayerId_value_object_1.PlayerId.generate();
            const playerWithId = Player_entity_1.Player.create({
                id: newId,
                name: player.name,
                lastname: player.lastname,
                nickname: player.nickname,
                email: player.email,
                phoneNumber: player.phoneNumber,
                birthdate: player.birthdate,
                category: player.category,
                role: player.role,
            });
            this.players.push(playerWithId);
            if (passwordHash !== undefined) {
                this.passwordHashes.set(newId.value, passwordHash);
            }
            return;
        }
        if (passwordHash !== undefined) {
            this.passwordHashes.set(id.value, passwordHash);
        }
        const index = this.players.findIndex((p) => p.id?.equals(id));
        if (index === -1) {
            this.players.push(player);
            return;
        }
        this.players[index] = player;
    }
    async delete(id) {
        this.passwordHashes.delete(id.value);
        const index = this.players.findIndex((p) => p.id?.equals(id));
        if (index === -1) {
            return;
        }
        this.players.splice(index, 1);
    }
}
exports.InMemoryPlayerRepository = InMemoryPlayerRepository;

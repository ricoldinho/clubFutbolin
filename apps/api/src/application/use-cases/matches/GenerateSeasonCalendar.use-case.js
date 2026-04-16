"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateSeasonCalendar = void 0;
const Match_entity_1 = require("@/domain/matches/Match.entity");
const MatchId_value_object_1 = require("@/domain/matches/MatchId.value-object");
const MatchStatus_1 = require("@/domain/matches/MatchStatus");
const errors_1 = require("@/domain/matches/errors");
const errors_2 = require("@/domain/shared/errors");
const result_1 = require("@/shared/result");
/**
 * Genera el calendario round-robin de una temporada.
 * Por defecto crea ida simple; opcionalmente ida y vuelta.
 * Obtiene los equipos inscritos y crea partidos por ronda separados 7 días.
 * Devuelve Result.fail en:
 * - NotFoundError: temporada inexistente
 * - SeasonCalendarAlreadyGeneratedError: ya existían partidos
 * - InsufficientTeamsForCalendarError: menos de 2 inscritos
 */
class GenerateSeasonCalendar {
    constructor(matchRepository, rosterRepository, seasonRepository) {
        this.matchRepository = matchRepository;
        this.rosterRepository = rosterRepository;
        this.seasonRepository = seasonRepository;
    }
    async execute(input) {
        const season = await this.seasonRepository.findById(input.seasonId);
        if (season === null) {
            return result_1.Result.fail(new errors_2.NotFoundError('Season', input.seasonId.value));
        }
        const alreadyGenerated = await this.matchRepository.existsBySeasonId(input.seasonId);
        if (alreadyGenerated) {
            return result_1.Result.fail(new errors_1.SeasonCalendarAlreadyGeneratedError());
        }
        const teamSeasons = await this.rosterRepository.findBySeasonId(input.seasonId);
        if (teamSeasons.length < 2) {
            return result_1.Result.fail(new errors_1.InsufficientTeamsForCalendarError());
        }
        const startDate = input.startDate ?? new Date();
        const rounds = this.generateRoundRobin(teamSeasons.map((r) => r.teamSeasonId), input.doubleRoundRobin ?? false);
        const matches = rounds.flatMap((roundMatches, roundIndex) => roundMatches.map(([homeTeamSeasonId, awayTeamSeasonId]) => Match_entity_1.Match.create({
            id: MatchId_value_object_1.MatchId.generate(),
            seasonId: input.seasonId,
            homeTeamSeasonId,
            awayTeamSeasonId,
            round: roundIndex + 1,
            date: this.addDays(startDate, roundIndex * 7),
            status: MatchStatus_1.MatchStatus.SCHEDULED,
        })));
        await this.matchRepository.saveMany(matches);
        return result_1.Result.ok(matches);
    }
    addDays(baseDate, days) {
        const result = new Date(baseDate);
        result.setDate(result.getDate() + days);
        return result;
    }
    /**
     * Algoritmo circle method para round-robin de ida simple.
     * Cuando el número de equipos es impar añade un BYE (null) y omite ese cruce.
     */
    generateRoundRobin(teamSeasonIds, doubleRoundRobin) {
        const entries = [...teamSeasonIds];
        const BYE = null;
        const participants = entries.length % 2 === 0 ? entries : [...entries, BYE];
        const roundsCount = participants.length - 1;
        const matchesPerRound = participants.length / 2;
        const rounds = [];
        for (let round = 0; round < roundsCount; round++) {
            const roundMatches = [];
            for (let i = 0; i < matchesPerRound; i++) {
                const home = participants[i];
                const away = participants[participants.length - 1 - i];
                if (home !== null && away !== null) {
                    roundMatches.push([home, away]);
                }
            }
            rounds.push(roundMatches);
            const fixed = participants[0];
            const rotating = participants.slice(1);
            rotating.unshift(rotating.pop() ?? null);
            participants.splice(0, participants.length, fixed, ...rotating);
        }
        if (!doubleRoundRobin) {
            return rounds;
        }
        const reverseRounds = rounds.map((roundMatches) => roundMatches.map(([home, away]) => [away, home]));
        return [...rounds, ...reverseRounds];
    }
}
exports.GenerateSeasonCalendar = GenerateSeasonCalendar;

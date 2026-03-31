import type { IMatchRepository } from '@/application/ports/matches/Match.repository';
import type { IRosterRepository } from '@/application/ports/rosters/Roster.repository';
import type { ISeasonRepository } from '@/application/ports/seasons/Season.repository';
import { Match } from '@/domain/matches/Match.entity';
import { MatchId } from '@/domain/matches/MatchId.value-object';
import { MatchStatus } from '@/domain/matches/MatchStatus';
import {
  InsufficientTeamsForCalendarError,
  SeasonCalendarAlreadyGeneratedError,
} from '@/domain/matches/errors';
import { NotFoundError } from '@/domain/shared/errors';
import type { SeasonId } from '@/domain/seasons/SeasonId.value-object';
import { Result, type Result as ResultType } from '@/shared/result';
import type { TeamSeasonId } from '@/domain/rosters/TeamSeasonId.value-object';

export interface GenerateSeasonCalendarInput {
  readonly seasonId: SeasonId;
  readonly startDate?: Date;
}

type GenerateSeasonCalendarError =
  | NotFoundError
  | SeasonCalendarAlreadyGeneratedError
  | InsufficientTeamsForCalendarError;

/**
 * Genera el calendario (round-robin ida simple) de una temporada.
 * Obtiene los equipos inscritos y crea partidos por ronda separados 7 días.
 * Devuelve Result.fail en:
 * - NotFoundError: temporada inexistente
 * - SeasonCalendarAlreadyGeneratedError: ya existían partidos
 * - InsufficientTeamsForCalendarError: menos de 2 inscritos
 */
export class GenerateSeasonCalendar {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly rosterRepository: IRosterRepository,
    private readonly seasonRepository: ISeasonRepository,
  ) {}

  async execute(
    input: GenerateSeasonCalendarInput,
  ): Promise<ResultType<readonly Match[], GenerateSeasonCalendarError>> {
    const season = await this.seasonRepository.findById(input.seasonId);
    if (season === null) {
      return Result.fail(new NotFoundError('Season', input.seasonId.value));
    }

    const alreadyGenerated = await this.matchRepository.existsBySeasonId(input.seasonId);
    if (alreadyGenerated) {
      return Result.fail(new SeasonCalendarAlreadyGeneratedError());
    }

    const teamSeasons = await this.rosterRepository.findBySeasonId(input.seasonId);
    if (teamSeasons.length < 2) {
      return Result.fail(new InsufficientTeamsForCalendarError());
    }

    const startDate = input.startDate ?? new Date();
    const rounds = this.generateRoundRobin(teamSeasons.map((r) => r.teamSeasonId));
    const matches = rounds.flatMap((roundMatches, roundIndex) =>
      roundMatches.map(([homeTeamSeasonId, awayTeamSeasonId]) =>
        Match.create({
          id: MatchId.generate(),
          seasonId: input.seasonId,
          homeTeamSeasonId,
          awayTeamSeasonId,
          round: roundIndex + 1,
          date: this.addDays(startDate, roundIndex * 7),
          status: MatchStatus.SCHEDULED,
        }),
      ),
    );

    await this.matchRepository.saveMany(matches);
    return Result.ok(matches);
  }

  private addDays(baseDate: Date, days: number): Date {
    const result = new Date(baseDate);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Algoritmo circle method para round-robin de ida simple.
   * Cuando el número de equipos es impar añade un BYE (null) y omite ese cruce.
   */
  private generateRoundRobin(teamSeasonIds: readonly TeamSeasonId[]): TeamSeasonId[][][] {
    const entries = [...teamSeasonIds];
    const BYE = null;
    const participants: Array<TeamSeasonId | null> =
      entries.length % 2 === 0 ? entries : [...entries, BYE];

    const roundsCount = participants.length - 1;
    const matchesPerRound = participants.length / 2;
    const rounds: TeamSeasonId[][][] = [];

    for (let round = 0; round < roundsCount; round++) {
      const roundMatches: TeamSeasonId[][] = [];
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

    return rounds;
  }
}

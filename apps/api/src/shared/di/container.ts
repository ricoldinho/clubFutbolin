import {
  asFunction,
  asValue,
  createContainer,
  type AwilixContainer,
} from "awilix";
import type { PrismaClient } from "@prisma/client";
import { PrismaPlayerRepository } from "@/adapters/persistence/players/PrismaPlayerRepository";
import { PrismaLeagueRepository } from "@/adapters/persistence/leagues/PrismaLeagueRepository";
import { PrismaTeamRepository } from "@/adapters/persistence/teams/PrismaTeamRepository";
import { PrismaSeasonRepository } from "@/adapters/persistence/seasons/PrismaSeasonRepository";
import { PrismaRosterRepository } from "@/adapters/persistence/rosters/PrismaRosterRepository";
import { BcryptPasswordHasher } from "@/adapters/auth/BcryptPasswordHasher";
import { JoseJwtService } from "@/adapters/auth/JoseJwtService";
import { LoginPlayer } from "@/application/use-cases/players/LoginPlayer.use-case";
import { RegisterPlayer } from "@/application/use-cases/players/RegisterPlayer.use-case";
import { ListPlayers } from "@/application/use-cases/players/ListPlayers.use-case";
import { GetPlayerById } from "@/application/use-cases/players/GetPlayerById.use-case";
import { UpdatePlayer } from "@/application/use-cases/players/UpdatePlayer.use-case";
import { DeletePlayer } from "@/application/use-cases/players/DeletePlayer.use-case";
import { CreateLeague } from "@/application/use-cases/leagues/CreateLeague.use-case";
import { UpdateLeague } from "@/application/use-cases/leagues/UpdateLeague.use-case";
import { DeleteLeague } from "@/application/use-cases/leagues/DeleteLeague.use-case";
import { ListLeagues } from "@/application/use-cases/leagues/ListLeagues.use-case";
import { GetLeagueById } from "@/application/use-cases/leagues/GetLeagueById.use-case";
import { CreateTeam } from "@/application/use-cases/teams/CreateTeam.use-case";
import { UpdateTeam } from "@/application/use-cases/teams/UpdateTeam.use-case";
import { DeleteTeam } from "@/application/use-cases/teams/DeleteTeam.use-case";
import { ListTeams } from "@/application/use-cases/teams/ListTeams.use-case";
import { GetTeamByName } from "@/application/use-cases/teams/GetTeamByName.use-case";
import { CreateSeason } from "@/application/use-cases/seasons/CreateSeason.use-case";
import { ListSeasons } from "@/application/use-cases/seasons/ListSeasons.use-case";
import { GetSeasonById } from "@/application/use-cases/seasons/GetSeasonById.use-case";
import { SetSeasonWinners } from "@/application/use-cases/seasons/SetSeasonWinners.use-case";
import { RegisterTeamToSeason } from "@/application/use-cases/rosters/RegisterTeamToSeason.use-case";
import { AddPlayerToRoster } from "@/application/use-cases/rosters/AddPlayerToRoster.use-case";
import { RemovePlayerFromRoster } from "@/application/use-cases/rosters/RemovePlayerFromRoster.use-case";
import type { Envs } from "@/shared/config/env";

export interface AppContainerCradle {
  prisma: PrismaClient;
  playerRepository: PrismaPlayerRepository;
  leagueRepository: PrismaLeagueRepository;
  teamRepository: PrismaTeamRepository;
  seasonRepository: PrismaSeasonRepository;
  rosterRepository: PrismaRosterRepository;
  passwordHasher: BcryptPasswordHasher;
  jwtService: JoseJwtService;
  loginPlayer: LoginPlayer;
  registerPlayer: RegisterPlayer;
  listPlayers: ListPlayers;
  getPlayerById: GetPlayerById;
  updatePlayer: UpdatePlayer;
  deletePlayer: DeletePlayer;
  createLeague: CreateLeague;
  updateLeague: UpdateLeague;
  deleteLeague: DeleteLeague;
  listLeagues: ListLeagues;
  getLeagueById: GetLeagueById;
  createTeam: CreateTeam;
  updateTeam: UpdateTeam;
  deleteTeam: DeleteTeam;
  listTeams: ListTeams;
  getTeamByName: GetTeamByName;
  createSeason: CreateSeason;
  listSeasons: ListSeasons;
  getSeasonById: GetSeasonById;
  setSeasonWinners: SetSeasonWinners;
  registerTeamToSeason: RegisterTeamToSeason;
  addPlayerToRoster: AddPlayerToRoster;
  removePlayerFromRoster: RemovePlayerFromRoster;
}

interface BuildContainerParams {
  prisma: PrismaClient;
  config: Envs;
}

export function buildContainer({
  prisma,
  config,
}: BuildContainerParams): AwilixContainer<AppContainerCradle> {
  const container = createContainer<AppContainerCradle>();

  container.register({
    playerRepository: asFunction(() => new PrismaPlayerRepository(prisma)).singleton(),
    leagueRepository: asFunction(() => new PrismaLeagueRepository(prisma)).singleton(),
    teamRepository: asFunction(() => new PrismaTeamRepository(prisma)).singleton(),
    seasonRepository: asFunction(() => new PrismaSeasonRepository(prisma)).singleton(),
    rosterRepository: asFunction(() => new PrismaRosterRepository(prisma)).singleton(),
    passwordHasher: asFunction(() => new BcryptPasswordHasher()).singleton(),
    jwtService: asFunction(
      () => new JoseJwtService(config.JWT_SECRET, config.JWT_EXPIRES_IN),
    ).singleton(),
    loginPlayer: asFunction(
      ({ playerRepository, passwordHasher, jwtService }) =>
        new LoginPlayer(playerRepository, passwordHasher, jwtService),
    ).scoped(),
    registerPlayer: asFunction(
      ({ playerRepository, passwordHasher }) =>
        new RegisterPlayer(playerRepository, passwordHasher),
    ).scoped(),
    listPlayers: asFunction(
      ({ playerRepository }) => new ListPlayers(playerRepository),
    ).scoped(),
    getPlayerById: asFunction(
      ({ playerRepository }) => new GetPlayerById(playerRepository),
    ).scoped(),
    updatePlayer: asFunction(
      ({ playerRepository }) => new UpdatePlayer(playerRepository),
    ).scoped(),
    deletePlayer: asFunction(
      ({ playerRepository }) => new DeletePlayer(playerRepository),
    ).scoped(),
    createLeague: asFunction(
      ({ leagueRepository }) => new CreateLeague(leagueRepository),
    ).scoped(),
    updateLeague: asFunction(
      ({ leagueRepository }) => new UpdateLeague(leagueRepository),
    ).scoped(),
    deleteLeague: asFunction(
      ({ leagueRepository }) => new DeleteLeague(leagueRepository),
    ).scoped(),
    listLeagues: asFunction(
      ({ leagueRepository }) => new ListLeagues(leagueRepository),
    ).scoped(),
    getLeagueById: asFunction(
      ({ leagueRepository }) => new GetLeagueById(leagueRepository),
    ).scoped(),
    createTeam: asFunction(({ teamRepository }) => new CreateTeam(teamRepository)).scoped(),
    updateTeam: asFunction(({ teamRepository }) => new UpdateTeam(teamRepository)).scoped(),
    deleteTeam: asFunction(({ teamRepository }) => new DeleteTeam(teamRepository)).scoped(),
    listTeams: asFunction(({ teamRepository }) => new ListTeams(teamRepository)).scoped(),
    getTeamByName: asFunction(
      ({ teamRepository }) => new GetTeamByName(teamRepository),
    ).scoped(),
    createSeason: asFunction(
      ({ seasonRepository, leagueRepository }) =>
        new CreateSeason(seasonRepository, leagueRepository),
    ).scoped(),
    listSeasons: asFunction(
      ({ seasonRepository }) => new ListSeasons(seasonRepository),
    ).scoped(),
    getSeasonById: asFunction(
      ({ seasonRepository }) => new GetSeasonById(seasonRepository),
    ).scoped(),
    setSeasonWinners: asFunction(
      ({ seasonRepository, teamRepository }) =>
        new SetSeasonWinners(seasonRepository, teamRepository),
    ).scoped(),
    registerTeamToSeason: asFunction(
      ({ rosterRepository, teamRepository, seasonRepository }) =>
        new RegisterTeamToSeason(rosterRepository, teamRepository, seasonRepository),
    ).scoped(),
    addPlayerToRoster: asFunction(
      ({ rosterRepository }) => new AddPlayerToRoster(rosterRepository),
    ).scoped(),
    removePlayerFromRoster: asFunction(
      ({ rosterRepository }) => new RemovePlayerFromRoster(rosterRepository),
    ).scoped(),
    prisma: asValue(prisma),
  });

  return container;
}

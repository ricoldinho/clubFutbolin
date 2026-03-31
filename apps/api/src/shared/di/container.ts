import {
  asClass,
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
import { PrismaMatchRepository } from "@/adapters/persistence/matches/PrismaMatchRepository";
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
import { GenerateSeasonCalendar } from "@/application/use-cases/matches/GenerateSeasonCalendar.use-case";
import { UpdateMatchScore } from "@/application/use-cases/matches/UpdateMatchScore.use-case";
import type { Envs } from "@/shared/config/env";

export interface AppContainerCradle {
  prisma: PrismaClient;
  playerRepository: PrismaPlayerRepository;
  leagueRepository: PrismaLeagueRepository;
  teamRepository: PrismaTeamRepository;
  seasonRepository: PrismaSeasonRepository;
  rosterRepository: PrismaRosterRepository;
  matchRepository: PrismaMatchRepository;
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
  generateSeasonCalendar: GenerateSeasonCalendar;
  updateMatchScore: UpdateMatchScore;
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
    // Repositorios/adaptadores: singleton (stateless) con inyección automática.
    playerRepository: asClass(PrismaPlayerRepository).classic().singleton(),
    leagueRepository: asClass(PrismaLeagueRepository).classic().singleton(),
    teamRepository: asClass(PrismaTeamRepository).classic().singleton(),
    seasonRepository: asClass(PrismaSeasonRepository).classic().singleton(),
    rosterRepository: asClass(PrismaRosterRepository).classic().singleton(),
    matchRepository: asClass(PrismaMatchRepository).classic().singleton(),

    // Servicios (no dependientes salvo config para JWT).
    passwordHasher: asClass(BcryptPasswordHasher).classic().singleton(),
    jwtService: asClass(JoseJwtService, {
      injector: () => ({
        secret: config.JWT_SECRET,
        expiresIn: config.JWT_EXPIRES_IN,
      }),
    }).classic().singleton(),

    // Casos de uso: scoped por request.
    loginPlayer: asClass(LoginPlayer).classic().scoped(),
    registerPlayer: asClass(RegisterPlayer).classic().scoped(),
    listPlayers: asClass(ListPlayers).classic().scoped(),
    getPlayerById: asClass(GetPlayerById).classic().scoped(),
    updatePlayer: asClass(UpdatePlayer).classic().scoped(),
    deletePlayer: asClass(DeletePlayer).classic().scoped(),

    createLeague: asClass(CreateLeague).classic().scoped(),
    updateLeague: asClass(UpdateLeague).classic().scoped(),
    deleteLeague: asClass(DeleteLeague).classic().scoped(),
    listLeagues: asClass(ListLeagues).classic().scoped(),
    getLeagueById: asClass(GetLeagueById).classic().scoped(),

    createTeam: asClass(CreateTeam).classic().scoped(),
    updateTeam: asClass(UpdateTeam).classic().scoped(),
    deleteTeam: asClass(DeleteTeam).classic().scoped(),
    listTeams: asClass(ListTeams).classic().scoped(),
    getTeamByName: asClass(GetTeamByName).classic().scoped(),

    createSeason: asClass(CreateSeason).classic().scoped(),
    listSeasons: asClass(ListSeasons).classic().scoped(),
    getSeasonById: asClass(GetSeasonById).classic().scoped(),
    setSeasonWinners: asClass(SetSeasonWinners).classic().scoped(),
    registerTeamToSeason: asClass(RegisterTeamToSeason).classic().scoped(),
    addPlayerToRoster: asClass(AddPlayerToRoster).classic().scoped(),
    removePlayerFromRoster: asClass(RemovePlayerFromRoster).classic().scoped(),
    generateSeasonCalendar: asClass(GenerateSeasonCalendar).classic().scoped(),
    updateMatchScore: asClass(UpdateMatchScore).classic().scoped(),
    prisma: asValue(prisma),
  });

  return container;
}
